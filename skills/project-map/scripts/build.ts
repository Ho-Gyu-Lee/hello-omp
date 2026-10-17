// Builds W/stage/index.html from the screen source in W/stage/src and checks it against the project-map rules:
// strict schema, reader-text rules and length limits, code and link references, Archify node ownership, freshness snapshot.
// Usage: bun build.ts --project <project-root> --map <map-dir-relative-to-project> --work <work-directory>
// stage/index.html and build/build.json are written only when there are no errors; otherwise nothing is written.
import { existsSync, statSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { HashStage, IsWithin, ParseArguments, RelativePosix, RunCli, Sha256Hex, WalkFiles, WriteJson } from "./lib/files.ts";
import { ComputeInputs, ScopeForMap, ValidateScope, type Input } from "./lib/inputs.ts";
import { ResolveMap, ResolveWork } from "./lib/location.ts";

type Reader<T> = (value: unknown, path: string) => T;
type Shape = Record<string, Reader<unknown>>;
type Infer<TShape extends Shape> = { [K in keyof TShape]: ReturnType<TShape[K]> };

interface Paths
{
    projectRoot: string;
    mapRelative: string;
    mapDirectory: string;
    workDirectory: string;
    stageDirectory: string;
    sourceDirectory: string;
}

interface PendingPath
{
    context: string;
    path: string;
    symbols: string[];
}

interface Config
{
    schema: string;
    project: { name: string; logo: string; subtitle: string };
    links: Array<{ label: string; href: string }>;
    basis: { label: string; written: string };
    areas: string[];
    views: Record<string, { name: string }>;
    scope: { include: string[]; exclude: string[] };
    tokens: Record<string, string>;
}

// The part of an area page the cross-page checks read.
interface AreaPageData
{
    rows: Array<{ node: string[] }>;
}

const FIXED_PAGE_IDS = ["overview", "board", "verification", "decisions", "basis"];
const RESERVED_AREA_IDS = [...FIXED_PAGE_IDS, "task"];
const RESERVED_VIEW_IDS = ["index"];
const COLUMNS = ["proposal", "todo", "doing", "blocked", "done"] as const;
const VERIFY_STATES = ["통과", "부분", "미실행", "실패", "재검증 필요", "해당 없음"] as const;
const TONES = ["ok", "warn", "fail", "block", "decide", "neutral"] as const;
const TASK_KINDS = ["task", "decision"] as const;
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp"];
const VIDEO_EXTENSIONS = [".mp4", ".webm"];
const CONFIG_SCHEMA = "project-map/config-1";
const MAX_ID_LENGTH = 32;
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TASK_ID_PATTERN = /^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*$/;
const DATE_PATTERN = /^20\d\d-\d\d-\d\d$/;
const VISUAL_BASIS_PATTERN = /^20\d\d-\d\d-\d\d (?:빌드|촬영)$/;
const TOKEN_NAME_PATTERN = /^--[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TOKEN_VALUE_PATTERN = /^[#%.,()\s\w-]{1,64}$/;
const TEMPLATE_META_PATTERN = /<meta name="project-map-template" content="([a-z0-9-]+)\/(\d+)">/;
const SNAPSHOT_PLACEHOLDER = "__SNAPSHOT__";
const DATA_PLACEHOLDER = "/*MAP_DATA*/";

// Limits count Unicode code points. The screen is sized for them (menu width, two-line headline, one-line points).
const LIMITS =
{
    projectNameCells: 13,
    logo: 2,
    subtitleCells: 15,
    linkLabel: 12,
    basisLabel: 36,
    menu: 14,
    viewName: 14,
    headline: 50,
    role: 60,
    point: 60,
    statusLabel: 6,
    statusText: 24,
    rowWhat: 30,
    rowHow: 90,
    symbol: 80,
    note: 80,
    evidenceLabel: 30,
    alt: 80,
    caption: 60,
    source: 16,
    staleReason: 60,
    repoName: 24,
    repoRole: 60,
    change: 90,
    cardTitle: 40,
    criteria: 90,
    reason: 70,
    decision: 90,
    deadline: 24,
    verifiedWhat: 40,
    verifiedHow: 100,
    notVerifiedWhat: 40,
    sectionTitle: 30,
    basisLine: 160,
    basisLinkText: 100,
    remark: 300
};

// Reader text is what a person reads on screen. Evidence belongs in the work directory and in sources.json.
const FORBIDDEN: Array<[string, RegExp]> =
[
    ["commit-like hex", /\b(?=[0-9a-f]*\d)(?=[0-9a-f]*[a-f])[0-9a-f]{7,40}\b/i],
    ["artifact task id", /[a-z0-9]+(?:-[a-z0-9]+)*-20\d{6}-[a-z]\d/i],
    ["test count", /\d[\d,]*\s*\/\s*\d[\d,]*(?:\s*\/\s*\d[\d,]*)?/],
    ["test count", /\d+\s*(?:passed|failed|passing)\b/i],
    ["test count", /(?:시험|테스트)\s*\d+\s*(?:건|개)|\d+\s*(?:건|개)\s*(?:통과|실패)/],
    ["em dash", /—/],
    ["circled number", /[\u2460-\u2473]/],
    ["emoji", /\p{Extended_Pictographic}/u],
    ["bold markdown", /\*\*/],
    ["backtick", /`/],
    ["command line", /(?:^|\s)(?:bun|npm|npx|pnpm|yarn|git|dotnet|cargo|cmake|make|pip|python3?|node)\s+(?:run|install|add|test|build|commit|push|pull|checkout|exec|clone|status|diff|publish|-{1,2}[a-z])/i],
    ["command line", /(?:^|\s)--[a-z][\w-]*/],
    ["work-log date lead", /^\s*20\d\d-\d\d-\d\d/],
    ["history disclaimer", /승계하지 않|이력이며|이력입니다/],
    ["middle-dot chain", /[^·]+·[^·]+·[^·]+·[^·]+/],
    ["arrow chain", /→[^→]*→[^→]*→/]
];

const sErrors: string[] = [];
const sWarnings: string[] = [];
const sPending: PendingPath[] = [];
const sUsedMedia = new Set<string>();
const sPageIds = new Set<string>(FIXED_PAGE_IDS);
const sTaskIds = new Set<string>();
const sViewNodes = new Map<string, Set<string>>();
const sFileText = new Map<string, string | null>();
let sTokenNames: string[] = [];
let sAllowedSnapshot = "";

// Raw-byte sha256 of every src file exactly as it was read and validated, keyed by path below src/.
const sSourceHashes = new Map<string, string>();

// Results Obj made up for a value that was not an object (see Obj). Their fields hold fallbacks, so cross-field checks skip them.
const sStandIns = new WeakSet<object>();

async function ResolvePaths(argv: string[]): Promise<Paths>
{
    const values = ParseArguments(argv, ["project", "map", "work"], []);
    const location = await ResolveMap(values.project, values.map);
    const workDirectory = await ResolveWork(location, values.work);
    return { ...location, workDirectory, stageDirectory: join(workDirectory, "stage"), sourceDirectory: join(workDirectory, "stage", "src") };
}

function Fail(path: string, message: string): void
{
    sErrors.push(`${path}: ${message}`);
}

function Child(path: string, key: string): string
{
    return path.includes(":") ? `${path}.${key}` : `${path}:${key}`;
}

function Describe(value: unknown): string
{
    if (value === undefined)
    {
        return "nothing (the key is missing)";
    }

    if (value === null)
    {
        return "null";
    }

    if (Array.isArray(value))
    {
        return "an array";
    }

    return typeof value === "string" ? `the text ${JSON.stringify(value)}` : `a ${typeof value}`;
}

function IsRecord(value: unknown): value is Record<string, unknown>
{
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function CheckForbidden(path: string, value: string, allowDateLead: boolean): void
{
    // The computed snapshot id is the one hash-like string the reader screen may show, and only on the basis screen.
    const checked = sAllowedSnapshot === "" || !path.startsWith("src/pages/basis.json:") ? value : value.replaceAll(sAllowedSnapshot, "");
    const reported = new Set<string>();

    for (const [name, pattern] of FORBIDDEN)
    {
        if ((allowDateLead && name === "work-log date lead") || reported.has(name))
        {
            continue;
        }

        if (pattern.test(checked))
        {
            reported.add(name);
            Fail(path, `forbidden ${name} (${value})`);
        }
    }
}

function Text(maxLength: number | null, allowDateLead = false): Reader<string>
{
    return (value, path) =>
    {
        if (typeof value !== "string" || value.trim() === "")
        {
            Fail(path, `expected non-empty text, got ${Describe(value)}`);
            return "";
        }

        if (value !== value.trim() || /[\r\n\t]/.test(value))
        {
            Fail(path, `text must be one line without surrounding whitespace (${value})`);
        }

        const length = [...value].length;

        if (maxLength !== null && length > maxLength)
        {
            Fail(path, `${length} chars > ${maxLength} (${value})`);
        }

        CheckForbidden(path, value, allowDateLead);
        return value;
    };
}

// A Hangul syllable fills one cell of the sidebar brand slot, a Latin letter or digit 0.6 of one (measured in LINE Seed Sans KR 14px bold and 12px).
function Cells(value: string): number
{
    let tenths = 0;

    for (const character of value)
    {
        tenths += /[\u1100-\u11ff\u3130-\u318f\u3400-\u9fff\uac00-\ud7a3\uff00-\uffef]/.test(character) ? 10 : 6;
    }

    return tenths / 10;
}

function Brand(maxCells: number): Reader<string>
{
    const read = Text(null);

    return (value, path) =>
    {
        const text = read(value, path);

        if (Cells(text) > maxCells)
        {
            Fail(path, `${Cells(text)} cells > ${maxCells}; Hangul counts 1, letters and digits 0.6 (${text})`);
        }

        return text;
    };
}

// Work-directory text (reasons, remarks) is not reader text: only presence and length are checked.
function Remark(maxLength: number): Reader<string>
{
    return (value, path) =>
    {
        if (typeof value !== "string" || value.trim() === "")
        {
            Fail(path, `expected non-empty text, got ${Describe(value)}`);
            return "";
        }

        if ([...value].length > maxLength)
        {
            Fail(path, `${[...value].length} chars > ${maxLength}`);
        }

        return value;
    };
}

function Plain(pattern: RegExp, expected: string, maxLength = 40): Reader<string>
{
    return (value, path) =>
    {
        if (typeof value !== "string" || value.length > maxLength || !pattern.test(value))
        {
            Fail(path, `expected ${expected}, got ${Describe(value)}`);
            return "";
        }

        return value;
    };
}

function Literal<T extends string>(expected: T): Reader<T>
{
    return (value, path) =>
    {
        if (value !== expected)
        {
            Fail(path, `expected "${expected}", got ${Describe(value)}`);
        }

        return expected;
    };
}

function OneOf<T extends string>(values: readonly T[]): Reader<T>
{
    return (value, path) =>
    {
        if (typeof value !== "string" || !values.includes(value as T))
        {
            Fail(path, `expected one of ${values.join(" | ")}, got ${Describe(value)}`);
            return values[0];
        }

        return value as T;
    };
}

function Flag(): Reader<boolean>
{
    return (value, path) =>
    {
        if (typeof value !== "boolean")
        {
            Fail(path, `expected true or false, got ${Describe(value)}`);
            return false;
        }

        return value;
    };
}

// A nullable key must still be present; null means "none".
function Nullable<T>(reader: Reader<T>): Reader<T | null>
{
    return (value, path) => value === null ? null : reader(value, path);
}

// An optional key may be absent or null.
function Optional<T>(reader: Reader<T>): Reader<T | undefined>
{
    return (value, path) => value === undefined || value === null ? undefined : reader(value, path);
}

function Refine<T>(reader: Reader<T>, check: (value: T, path: string) => void): Reader<T>
{
    return (value, path) =>
    {
        const result = reader(value, path);

        if (!(typeof result === "object" && result !== null && sStandIns.has(result)))
        {
            check(result, path);
        }

        return result;
    };
}

function List<T>(reader: Reader<T>, minimum: number, maximum: number): Reader<T[]>
{
    return (value, path) =>
    {
        if (!Array.isArray(value))
        {
            Fail(path, `expected an array, got ${Describe(value)}`);
            return [];
        }

        if (value.length < minimum || value.length > maximum)
        {
            Fail(path, `${value.length} entries, expected ${minimum} to ${maximum}`);
        }

        return value.map((item, index) => reader(item, `${path}[${index}]`));
    };
}

function Obj<TShape extends Shape>(shape: TShape): Reader<Infer<TShape>>
{
    return (value, path) =>
    {
        const result: Record<string, unknown> = {};

        if (!IsRecord(value))
        {
            Fail(path, `expected an object, got ${Describe(value)}`);

            // Callers read the fields of every result, so a stand-in gets each field's fallback; the field errors would only
            // repeat the one above.
            const errorCount = sErrors.length;

            for (const [key, reader] of Object.entries(shape))
            {
                result[key] = reader(undefined, Child(path, key));
            }

            sErrors.length = errorCount;
            sStandIns.add(result);
            return result as Infer<TShape>;
        }

        for (const key of Object.keys(value))
        {
            if (!Object.hasOwn(shape, key))
            {
                Fail(Child(path, key), "unknown key (agent notes, hashes and counts stay in the work directory, not in src)");
            }
        }

        for (const [key, reader] of Object.entries(shape))
        {
            result[key] = reader(Object.hasOwn(value, key) ? value[key] : undefined, Child(path, key));
        }

        return result as Infer<TShape>;
    };
}

function Dictionary<T>(keyPattern: RegExp, keyLabel: string, reader: Reader<T>, maximum: number): Reader<Record<string, T>>
{
    return (value, path) =>
    {
        const result: Record<string, T> = {};

        if (!IsRecord(value))
        {
            Fail(path, `expected an object, got ${Describe(value)}`);
            return result;
        }

        const keys = Object.keys(value);

        if (keys.length > maximum)
        {
            Fail(path, `${keys.length} entries, expected at most ${maximum}`);
        }

        for (const key of keys)
        {
            if (!keyPattern.test(key))
            {
                Fail(Child(path, key), `key must be ${keyLabel}`);
                continue;
            }

            result[key] = reader(value[key], Child(path, key));
        }

        return result;
    };
}

function DateText(): Reader<string>
{
    return (value, path) =>
    {
        const isValid = typeof value === "string" && DATE_PATTERN.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;

        if (!isValid)
        {
            Fail(path, `expected a calendar date YYYY-MM-DD, got ${Describe(value)}`);
            return "";
        }

        return value;
    };
}

// A leading control character is skipped by the URL parser, so "\u0001javascript:..." would still run as a script URL.
const CONTROL_PATTERN = /[\u0000-\u001f\u007f-\u009f]/;

function IsRegularFile(absolute: string): boolean
{
    return existsSync(absolute) && statSync(absolute).isFile();
}

function CheckHref(path: string, href: string): void
{
    if (CONTROL_PATTERN.test(href))
    {
        Fail(path, `href must not contain control characters: ${JSON.stringify(href)}`);
        return;
    }

    if (/^https?:\/\/\S+$/i.test(href))
    {
        return;
    }

    if (/^[A-Za-z][A-Za-z0-9+.-]*:/.test(href) || /^[\\/#?]/.test(href) || /[\\\s]/.test(href))
    {
        Fail(path, `href must be a relative path (spaces written as %20) or an http(s) URL: ${href}`);
        return;
    }

    const target = href.split("#")[0].split("?")[0];
    let decoded = "";

    try
    {
        decoded = decodeURIComponent(target);
    }
    catch
    {
        Fail(path, `href has a malformed percent escape: ${href}`);
        return;
    }

    if (decoded === "" || CONTROL_PATTERN.test(decoded))
    {
        Fail(path, `href needs a path without control characters: ${JSON.stringify(href)}`);
        return;
    }

    const absolute = resolve(PATHS.mapDirectory, decoded);

    if (IsWithin(absolute, PATHS.mapDirectory))
    {
        const inside = RelativePosix(PATHS.mapDirectory, absolute);

        // The manifest is written by publish after the build, so a first-time stage does not have it yet.
        if (inside !== "sources.json" && !IsRegularFile(join(PATHS.stageDirectory, inside)))
        {
            Fail(path, `link target is not a file in stage/: ${href}`);
        }
    }
    else if (!IsRegularFile(absolute))
    {
        Fail(path, `link target is not a file: ${href}`);
    }
}

// A link relative to the map directory. Targets inside the map directory must exist in stage/; targets outside must exist where they are.
function Href(): Reader<string>
{
    return (value, path) =>
    {
        if (typeof value !== "string" || value === "")
        {
            Fail(path, `expected a link, got ${Describe(value)}`);
            return "";
        }

        CheckHref(path, value);
        return value;
    };
}

function MediaFile(extensions: string[]): Reader<string>
{
    return (value, path) =>
    {
        if (typeof value !== "string" || value === "" || /[?#\\\s]/.test(value) || CONTROL_PATTERN.test(value))
        {
            Fail(path, `expected a path below media/ (spaces written as %20), got ${Describe(value)}`);
            return "";
        }

        let decoded = "";

        try
        {
            decoded = decodeURIComponent(value);

            if (CONTROL_PATTERN.test(decoded))
            {
                Fail(path, `path must not contain control characters: ${JSON.stringify(value)}`);
                return value;
            }
        }
        catch
        {
            Fail(path, `path has a malformed percent escape: ${value}`);
            return value;
        }

        if (!decoded.startsWith("media/") || decoded.split("/").includes(".."))
        {
            Fail(path, `media files live below media/: ${value}`);
            return value;
        }

        const file = join(PATHS.stageDirectory, decoded);

        if (!IsRegularFile(file))
        {
            Fail(path, `file is missing in stage/: ${value}`);
        }
        else if (!extensions.includes(extname(decoded).toLowerCase()))
        {
            Fail(path, `expected ${extensions.join(" | ")}: ${value}`);
        }

        sUsedMedia.add(decoded);
        return value;
    };
}

// A project-root-relative POSIX path; it may start with "../<sibling>/" for a sibling repository.
function CheckProjectPath(path: string, value: string): boolean
{
    const segments = value.replace(/\/+$/, "").split("/");
    const isBad = value === "" || value.includes("\\") || value.startsWith("/") || /^[A-Za-z]:/.test(value) || /\s$|^\s/.test(value)
        || segments.slice(1).some(segment => segment === ".." || segment === "." || segment === "")
        || (segments[0] === ".." && segments.length === 1) || segments.includes(".omp-artifacts");

    if (isBad)
    {
        Fail(path, `expected a project-relative POSIX path (only a leading ../<sibling>/ may leave the project; not .omp-artifacts), got ${Describe(value)}`);
    }

    return !isBad;
}

// A file or directory of the project that must exist.
function ProjectPath(): Reader<string>
{
    return (value, path) =>
    {
        if (typeof value !== "string")
        {
            Fail(path, `expected a path, got ${Describe(value)}`);
            return "";
        }

        if (CheckProjectPath(path, value))
        {
            sPending.push({ context: path, path: value, symbols: [] });
        }

        return value;
    };
}

// Reads the entry first so the symbols can be looked up in the file after the path is known.
function Where(): Reader<{ path: string; symbols: string[] }>
{
    const read = Obj({
        path: Plain(/^\S(?:.*\S)?$/, "a path", 260),
        symbols: List(Plain(/^\S(?:.*\S)?$/, "a code symbol on one line", LIMITS.symbol), 0, 12)
    });

    return (value, path) =>
    {
        const entry = read(value, path);

        if (!sStandIns.has(entry) && CheckProjectPath(Child(path, "path"), entry.path))
        {
            sPending.push({ context: path, path: entry.path, symbols: entry.symbols });
        }

        return entry;
    };
}

async function SourceText(absolute: string): Promise<string | null>
{
    if (!sFileText.has(absolute))
    {
        sFileText.set(absolute, existsSync(absolute) && statSync(absolute).isFile() ? await readFile(absolute, "utf8") : null);
    }

    return sFileText.get(absolute) ?? null;
}

async function CheckPendingPaths(): Promise<void>
{
    for (const pending of sPending)
    {
        const absolute = resolve(PATHS.projectRoot, pending.path);

        if (!existsSync(absolute))
        {
            Fail(pending.context, `path does not exist in the project: ${pending.path}`);
            continue;
        }

        if (statSync(absolute).isDirectory())
        {
            if (pending.symbols.length > 0)
            {
                Fail(pending.context, `symbols listed for directory ${pending.path}`);
            }

            continue;
        }

        const text = await SourceText(absolute);

        for (const symbol of pending.symbols)
        {
            const parts = symbol.split("::").map(part => part.replace(/\(.*\)$/, "").trim()).filter(part => part.length > 0);
            const isPresent = (text ?? "").includes(symbol) || (parts.length > 0 && parts.every(part => (text ?? "").includes(part)));

            if (!isPresent)
            {
                Fail(pending.context, `symbol ${symbol} not found in ${pending.path}`);
            }
        }
    }
}

function ViewRef(): Reader<string>
{
    return (value, path) =>
    {
        if (typeof value !== "string" || !sViewNodes.has(value))
        {
            Fail(path, `expected a view listed in map.config.json views (${[...sViewNodes.keys()].join(", ") || "none configured"}), got ${Describe(value)}`);
            return "";
        }

        return value;
    };
}

// "<view>:<componentId>" of a configured view.
function NodeRef(): Reader<string>
{
    return (value, path) =>
    {
        const separator = typeof value === "string" ? value.indexOf(":") : -1;
        const nodes = typeof value === "string" ? sViewNodes.get(value.slice(0, Math.max(separator, 0))) : undefined;

        if (typeof value !== "string" || nodes === undefined || !nodes.has(value.slice(separator + 1)))
        {
            Fail(path, `expected <view>:<componentId> of a configured view, got ${Describe(value)}`);
            return "";
        }

        return value;
    };
}

function PageRef(): Reader<string>
{
    return (value, path) =>
    {
        if (typeof value !== "string" || !sPageIds.has(value))
        {
            Fail(path, `expected a page id (${[...sPageIds].join(", ")}), got ${Describe(value)}`);
            return "";
        }

        return value;
    };
}

function TaskId(): Reader<string>
{
    return (value, path) =>
    {
        const id = Plain(TASK_ID_PATTERN, "a task id of capital letters and digits joined by hyphens, like AREA-NAME-01", MAX_ID_LENGTH)(value, path);
        CheckForbidden(path, id, true);
        return id;
    };
}

function TaskRef(): Reader<string>
{
    return (value, path) =>
    {
        const id = typeof value === "string" ? value : "";

        if (!sTaskIds.has(id))
        {
            Fail(path, `expected the id of a task in tasks.json, got ${Describe(value)}`);
        }

        return id;
    };
}

function Tokens(): Reader<Record<string, string>>
{
    const read = Dictionary(TOKEN_NAME_PATTERN, "a CSS custom property name such as --background", Plain(TOKEN_VALUE_PATTERN, "a color or length value", 64), 40);

    return (value, path) =>
    {
        const tokens = read(value, path);

        for (const [name, tokenValue] of Object.entries(tokens))
        {
            if (!sTokenNames.includes(name))
            {
                Fail(Child(path, name), `not a token of the template (${sTokenNames.join(", ")})`);
            }

            if (/url\s*\(/i.test(tokenValue))
            {
                Fail(Child(path, name), `url() is not allowed in a token value: ${tokenValue}`);
            }
        }

        return tokens;
    };
}

// Only the shape is read here; ValidateScope decides whether the pattern may reach the files it names.
const SCOPE_PATTERN = Plain(/^\S(?:.*\S)?$/, "a project-relative glob", 260);

function AreaId(): Reader<string>
{
    return (value, path) =>
    {
        const id = Plain(ID_PATTERN, "lowercase words joined by hyphens", MAX_ID_LENGTH)(value, path);

        if (RESERVED_AREA_IDS.includes(id))
        {
            Fail(path, `"${id}" is reserved (${RESERVED_AREA_IDS.join(", ")})`);
        }

        return id;
    };
}

const CONFIG: Reader<Config> = Obj({
    schema: Literal(CONFIG_SCHEMA),
    project: Obj({
        name: Brand(LIMITS.projectNameCells),
        logo: Text(LIMITS.logo),
        subtitle: Brand(LIMITS.subtitleCells)
    }),
    links: List(Obj({ label: Text(LIMITS.linkLabel), href: Href() }), 0, 4),
    basis: Obj({ label: Text(LIMITS.basisLabel, true), written: DateText() }),
    areas: Refine(List(AreaId(), 1, 16), (areas, path) =>
    {
        for (const [index, id] of areas.entries())
        {
            if (areas.indexOf(id) !== index)
            {
                Fail(`${path}[${index}]`, `duplicate area ${id}`);
            }
        }
    }),
    views: Refine(Dictionary(ID_PATTERN, "lowercase words joined by hyphens", Obj({ name: Text(LIMITS.viewName) }), 12), (views, path) =>
    {
        for (const view of Object.keys(views))
        {
            if (RESERVED_VIEW_IDS.includes(view))
            {
                Fail(Child(path, view), `"${view}" is reserved (${RESERVED_VIEW_IDS.join(", ")})`);
            }

            if (view.length > MAX_ID_LENGTH)
            {
                Fail(Child(path, view), `${view.length} chars > ${MAX_ID_LENGTH}`);
            }
        }
    }),
    scope: Obj({ include: List(SCOPE_PATTERN, 1, 200), exclude: List(SCOPE_PATTERN, 0, 200) }),
    tokens: Tokens()
});

const STATUS_TEXT = Obj({ label: Text(LIMITS.statusLabel), text: Text(LIMITS.statusText), tone: OneOf(TONES) });
const STATUS_COUNT = Obj({ label: Text(LIMITS.statusLabel), tone: OneOf(TONES), count: Literal("userDecision") });
const STATUS: Reader<unknown> = (value, path) => (IsRecord(value) && Object.hasOwn(value, "count") ? STATUS_COUNT : STATUS_TEXT)(value, path);

function CheckStale(visual: { stale: boolean; staleReason: string | null }, path: string): void
{
    if (visual.stale && visual.staleReason === null)
    {
        Fail(Child(path, "staleReason"), "a stale visual needs the reason");
    }
    else if (!visual.stale && visual.staleReason !== null)
    {
        Fail(Child(path, "staleReason"), "staleReason must be null when stale is false");
    }
}

const IMAGE_VISUAL = Refine(Obj({
    kind: Literal("image"),
    src: MediaFile(IMAGE_EXTENSIONS),
    alt: Text(LIMITS.alt),
    caption: Text(LIMITS.caption),
    source: Text(LIMITS.source),
    basis: Plain(VISUAL_BASIS_PATTERN, `"YYYY-MM-DD 빌드" or "YYYY-MM-DD 촬영"`, 16),
    stale: Flag(),
    staleReason: Nullable(Text(LIMITS.staleReason)),
    evidence: Nullable(Href())
}), CheckStale);

const VIDEO_VISUAL = Refine(Obj({
    kind: Literal("video"),
    src: MediaFile(VIDEO_EXTENSIONS),
    poster: Nullable(MediaFile(IMAGE_EXTENSIONS)),
    alt: Text(LIMITS.alt),
    caption: Text(LIMITS.caption),
    source: Text(LIMITS.source),
    basis: Plain(VISUAL_BASIS_PATTERN, `"YYYY-MM-DD 빌드" or "YYYY-MM-DD 촬영"`, 16),
    stale: Flag(),
    staleReason: Nullable(Text(LIMITS.staleReason)),
    evidence: Nullable(Href()),
    loop: Flag()
}), (visual, path) =>
{
    CheckStale(visual, path);

    if (!visual.loop && visual.poster === null)
    {
        Fail(Child(path, "poster"), "a video that does not loop waits for the reader and needs a poster image");
    }
});

const DIAGRAM_VISUAL = Refine(Obj({
    kind: Literal("diagram"),
    view: ViewRef(),
    focus: Nullable(Plain(/^\S+$/, "a component id", 80)),
    caption: Text(LIMITS.caption)
}), (visual, path) =>
{
    // The Archify viewer takes a bare component id after #focus= and silently ignores anything else.
    if (visual.focus !== null && (visual.focus.includes(":") || !(sViewNodes.get(visual.view)?.has(visual.focus) ?? false)))
    {
        Fail(Child(path, "focus"), `expected null or a bare component id of view ${visual.view}, got ${visual.focus}`);
    }
});

const VISUAL_READERS: Record<string, Reader<unknown>> = { image: IMAGE_VISUAL, video: VIDEO_VISUAL, diagram: DIAGRAM_VISUAL };

function Visual(kinds: readonly string[]): Reader<unknown>
{
    return (value, path) =>
    {
        const kind = IsRecord(value) ? value.kind : undefined;
        const reader = typeof kind === "string" && kinds.includes(kind) ? VISUAL_READERS[kind] : undefined;

        if (reader === undefined)
        {
            Fail(Child(path, "kind"), `expected one of ${kinds.join(" | ")}, got ${Describe(kind)}`);
            return null;
        }

        return reader(value, path);
    };
}

const ROW = Obj({
    what: Text(LIMITS.rowWhat),
    where: List(Where(), 1, 6),
    how: Text(LIMITS.rowHow),
    node: List(NodeRef(), 0, 12)
});

const EVIDENCE_LINK = Obj({ label: Text(LIMITS.evidenceLabel), href: Href() });

function AreaPage(id: string): Reader<AreaPageData>
{
    return Obj({
        id: Literal(id),
        menu: Text(LIMITS.menu),
        headline: Text(LIMITS.headline),
        role: Text(LIMITS.role),
        status: List(STATUS, 0, 4),
        visual: Optional(Visual(["image", "video", "diagram"])),
        points: List(Text(LIMITS.point), 1, 5),
        rows: List(ROW, 0, 60),
        diagram: Optional(Obj({ view: ViewRef(), caption: Text(LIMITS.caption) })),
        notes: List(Text(LIMITS.note), 0, 8),
        evidence: List(EVIDENCE_LINK, 0, 8),
        tasks: List(TaskRef(), 0, 30)
    });
}

const OVERVIEW_PAGE = Obj({
    headline: Text(LIMITS.headline),
    role: Text(LIMITS.role),
    status: List(STATUS, 0, 4),
    visual: Nullable(Visual(["image", "video"])),
    points: List(Text(LIMITS.point), 1, 5),
    repos: Optional(List(Obj({ name: Text(LIMITS.repoName), path: ProjectPath(), role: Text(LIMITS.repoRole) }), 1, 6)),
    changes: List(Obj({ date: DateText(), text: Text(LIMITS.change) }), 0, 6)
});

const VERIFICATION_PAGE = Obj({
    headline: Text(LIMITS.headline),
    role: Optional(Text(LIMITS.role)),
    points: List(Text(LIMITS.point), 1, 5),
    verified: List(Obj({
        what: Text(LIMITS.verifiedWhat),
        how: Text(LIMITS.verifiedHow),
        result: OneOf(VERIFY_STATES),
        date: Nullable(DateText()),
        area: PageRef(),
        evidence: Nullable(Href()),
        suite: List(ProjectPath(), 0, 30)
    }), 0, 60),
    notVerified: List(Obj({
        what: Text(LIMITS.notVerifiedWhat),
        why: Text(LIMITS.reason),
        area: PageRef(),
        task: Nullable(TaskRef())
    }), 0, 60)
});

const BASIS_LINE = (value: unknown, path: string): unknown => typeof value === "string"
    ? Text(LIMITS.basisLine)(value, path)
    : Obj({ text: Text(LIMITS.basisLinkText), href: Href(), label: Text(LIMITS.evidenceLabel) })(value, path);

const BASIS_PAGE = Obj({
    headline: Text(LIMITS.headline),
    role: Text(LIMITS.role),
    points: List(Text(LIMITS.point), 1, 5),
    sections: List(Obj({ title: Text(LIMITS.sectionTitle), lines: List(BASIS_LINE, 1, 10) }), 1, 8)
});

const BOARD_PAGE = Obj({ role: Text(LIMITS.role), decisionsHeadline: Text(LIMITS.headline), decisionsRole: Text(LIMITS.role) });

const TASK = Refine(Obj({
    id: TaskId(),
    title: Text(LIMITS.cardTitle),
    area: PageRef(),
    column: OneOf(COLUMNS),
    verify: OneOf(VERIFY_STATES),
    criteria: Text(LIMITS.criteria),
    reason: Nullable(Text(LIMITS.reason)),
    done: Nullable(DateText()),
    deadline: Nullable(Text(LIMITS.deadline, true)),
    depends: List(TaskId(), 0, 8),
    evidence: Nullable(Href()),
    kind: OneOf(TASK_KINDS)
}), (task, path) =>
{
    if (task.column === "blocked" && task.reason === null)
    {
        Fail(Child(path, "reason"), "a blocked card needs the reason or the question to the user");
    }

    if (task.column !== "done" && task.done !== null)
    {
        Fail(Child(path, "done"), "done is the completion date and stays null until the card is in the done column");
    }

    if (task.depends.includes(task.id))
    {
        Fail(Child(path, "depends"), "a card cannot depend on itself");
    }
});

const DECISION = Obj({
    date: DateText(),
    text: Text(LIMITS.decision),
    why: Nullable(Text(LIMITS.reason)),
    area: PageRef(),
    task: Nullable(TaskRef())
});

const RECONCILE = Obj({
    unreconciled: List(Obj({ path: Remark(200), reason: Remark(LIMITS.remark) }), 0, 1000)
});

async function ReadSource<T>(file: string, reader: Reader<T>): Promise<T | undefined>
{
    const label = `src/${file}`;
    const absolute = join(PATHS.sourceDirectory, file);

    if (!existsSync(absolute))
    {
        Fail(label, "file is missing");
        return undefined;
    }

    try
    {
        const bytes = await readFile(absolute);
        sSourceHashes.set(file, Sha256Hex(bytes));
        const parsed: unknown = JSON.parse(bytes.toString("utf8").replace(/^\uFEFF/, ""));
        return reader(parsed, label);
    }
    catch (error)
    {
        if (error instanceof SyntaxError)
        {
            Fail(label, `invalid JSON (${error.message})`);
            return undefined;
        }

        throw error;
    }
}

// Reads the view geometry from the generated HTML and its component ids from the Archify spec; both are byte copies of finalize-passed outputs.
async function ReadView(view: string): Promise<{ width: number; height: number } | undefined>
{
    const htmlFile = join(PATHS.stageDirectory, `${view}.html`);
    const specFile = join(PATHS.stageDirectory, `${view}.architecture.json`);

    if (!existsSync(htmlFile) || !existsSync(specFile))
    {
        Fail(`view ${view}`, `stage/${view}.html and stage/${view}.architecture.json must both exist`);
        sViewNodes.set(view, new Set());
        return undefined;
    }

    let nodes = new Set<string>();

    try
    {
        const spec: unknown = JSON.parse(await readFile(specFile, "utf8"));
        const components = IsRecord(spec) ? spec.components : undefined;

        if (!Array.isArray(components))
        {
            Fail(`view ${view}`, `${view}.architecture.json has no components array`);
        }
        else
        {
            nodes = new Set(components.filter(IsRecord).map(component => component.id).filter((id): id is string => typeof id === "string"));
        }
    }
    catch (error)
    {
        Fail(`view ${view}`, `${view}.architecture.json is not valid JSON (${error instanceof Error ? error.message : String(error)})`);
    }

    sViewNodes.set(view, nodes);
    const match = /<svg\b[^>]*?\bviewBox\s*=\s*["']\s*(-?[\d.]+)[\s,]+(-?[\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*["']/i.exec(await readFile(htmlFile, "utf8"));
    const width = match === null ? NaN : Number(match[3]);
    const height = match === null ? NaN : Number(match[4]);

    if (!(width > 0) || !(height > 0))
    {
        Fail(`view ${view}`, `${view}.html has no <svg viewBox="0 0 W H"> with a positive size`);
        return undefined;
    }

    return { width, height };
}

function CheckInventory(files: string[], areas: string[]): void
{
    const allowed = new Set(["map.config.json", "tasks.json", "decisions.json", "pages/overview.json", "pages/verification.json", "pages/basis.json", "pages/board.json", ...areas.map(id => `pages/${id}.json`)]);

    for (const file of files)
    {
        if (!allowed.has(file))
        {
            Fail(`src/${file}`, "unexpected file (src holds map.config.json, tasks.json, decisions.json and pages/<id>.json only; notes stay in the work directory)");
        }
    }
}

function CheckTemplate(template: string): { id: string; version: number }
{
    for (const placeholder of [SNAPSHOT_PLACEHOLDER, DATA_PLACEHOLDER])
    {
        if (template.split(placeholder).length !== 2)
        {
            throw new Error(`template must contain ${placeholder} exactly once`);
        }
    }

    const meta = TEMPLATE_META_PATTERN.exec(template);

    if (meta === null)
    {
        throw new Error(`template has no <meta name="project-map-template" content="<id>/<version>">`);
    }

    const root = /:root\s*\{([\s\S]*?)\n\}/.exec(template);
    sTokenNames = root === null ? [] : [...root[1].matchAll(/(--[a-z0-9-]+)\s*:/g)].map(match => match[1]);

    for (const match of template.matchAll(/url\('fonts\/([^']+)'\)/g))
    {
        if (!existsSync(join(PATHS.stageDirectory, "fonts", match[1])))
        {
            Fail("fonts", `template font fonts/${match[1]} is not in stage/fonts/ (init copies the skill fonts there)`);
        }
    }

    for (const license of ["LINESeed-OFL.txt", "JetBrainsMono-OFL.txt"])
    {
        if (!existsSync(join(PATHS.stageDirectory, "fonts", license)))
        {
            Fail("fonts", `license fonts/${license} is not in stage/fonts/`);
        }
    }

    return { id: meta[1], version: Number(meta[2]) };
}

function OwnersOfNodes(areaPages: Record<string, AreaPageData>): Map<string, Set<string>>
{
    const owners = new Map<string, Set<string>>();

    for (const [id, page] of Object.entries(areaPages))
    {
        for (const row of page.rows)
        {
            for (const node of row.node)
            {
                owners.set(node, (owners.get(node) ?? new Set<string>()).add(id));
            }
        }
    }

    return owners;
}

const PATHS = await ResolvePaths(process.argv.slice(2)).catch((error: unknown) =>
{
    console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
    console.error("Usage: bun build.ts --project <project-root> --map <map-dir-relative-to-project> --work <work-directory>");
    process.exit(2);
});

async function Main(): Promise<void>
{
    if (!existsSync(PATHS.sourceDirectory))
    {
        throw new Error(`stage/src does not exist: ${PATHS.sourceDirectory}`);
    }

    const templateText = await readFile(resolve(import.meta.dir, "../assets/template.html"), "utf8");
    const template = CheckTemplate(templateText);

    // Taken before anything is validated and compared again before anything is written: the bytes checked are the bytes recorded.
    const stageBefore = await HashStage(PATHS.stageDirectory);
    const errorsBeforeConfig = sErrors.length;
    const config = await ReadSource("map.config.json", CONFIG);
    const isConfigValid = config !== undefined && sErrors.length === errorsBeforeConfig;
    const sourceFiles = await WalkFiles(PATHS.sourceDirectory);
    CheckInventory(sourceFiles, config?.areas ?? []);

    let snapshot = "";
    let inputs: Input[] = [];

    if (config !== undefined && isConfigValid)
    {
        try
        {
            await ValidateScope(PATHS.projectRoot, config.scope);
            const computed = await ComputeInputs(PATHS.projectRoot, ScopeForMap(config.scope, PATHS.mapRelative));
            inputs = computed.inputs;
            snapshot = computed.snapshot;
            sAllowedSnapshot = snapshot;

            for (const pattern of config.scope.include)
            {
                const normalized = pattern.trim().replace(/^(?:\.\/)+/, "");
                const glob = new Bun.Glob(normalized);

                if (!inputs.some(input => input.path === normalized || glob.match(input.path)))
                {
                    Fail("src/map.config.json:scope.include", `pattern "${pattern}" matches no input file (a directory needs /**, e.g. "src/**")`);
                }
            }
        }
        catch (error)
        {
            Fail("src/map.config.json:scope", `cannot compute the freshness inputs: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    const views: Record<string, { name: string; width: number; height: number }> = {};

    for (const [view, entry] of Object.entries(config?.views ?? {}))
    {
        const geometry = await ReadView(view);

        if (geometry !== undefined)
        {
            views[view] = { name: entry.name, ...geometry };
        }
    }

    for (const id of config?.areas ?? [])
    {
        sPageIds.add(id);
    }

    const tasks = (await ReadSource("tasks.json", List(TASK, 0, 200))) ?? [];

    // An empty id or date is the fallback of a field already reported as invalid: comparing it would only add follow-on errors.
    for (const [index, task] of tasks.entries())
    {
        if (task.id === "")
        {
            continue;
        }

        if (sTaskIds.has(task.id))
        {
            Fail(`src/tasks.json[${index}]:id`, `duplicate task id ${task.id}`);
        }

        sTaskIds.add(task.id);
    }

    const decisions = (await ReadSource("decisions.json", List(DECISION, 0, 200))) ?? [];

    for (const [index, decision] of decisions.entries())
    {
        const previous = index > 0 ? decisions[index - 1].date : "";

        if (decision.date !== "" && previous !== "" && decision.date > previous)
        {
            Fail(`src/decisions.json[${index}]:date`, `decisions are listed newest first (${decision.date} follows ${previous})`);
        }
    }

    for (const task of tasks.filter(entry => entry.kind === "decision"))
    {
        if (!decisions.some(decision => decision.task === task.id))
        {
            Fail("src/decisions.json", `decision card ${task.id} has no entry with task ${task.id}`);
        }
    }

    for (const [index, task] of tasks.entries())
    {
        for (const dependency of task.depends)
        {
            if (!sTaskIds.has(dependency))
            {
                sWarnings.push(`src/tasks.json[${index}]: dependency ${dependency} is not a card`);
            }
        }
    }

    const areaPages: Record<string, AreaPageData> = {};

    for (const id of config?.areas ?? [])
    {
        const page = await ReadSource(`pages/${id}.json`, AreaPage(id));

        if (page !== undefined)
        {
            areaPages[id] = page;
        }
    }

    const overview = await ReadSource("pages/overview.json", OVERVIEW_PAGE);
    const verification = await ReadSource("pages/verification.json", VERIFICATION_PAGE);
    const basis = await ReadSource("pages/basis.json", BASIS_PAGE);
    const board = existsSync(join(PATHS.sourceDirectory, "pages/board.json")) ? await ReadSource("pages/board.json", BOARD_PAGE) : undefined;

    const owners = OwnersOfNodes(areaPages);

    for (const [view, nodes] of sViewNodes)
    {
        for (const node of nodes)
        {
            const owning = owners.get(`${view}:${node}`);

            if (owning === undefined)
            {
                Fail(`view ${view}`, `component ${view}:${node} is not referenced by any row`);
            }
            else if (owning.size > 1)
            {
                Fail(`view ${view}`, `component ${view}:${node} is referenced by rows of ${[...owning].join(", ")}; exactly one area owns a component`);
            }
        }
    }

    await CheckPendingPaths();

    for (const file of existsSync(join(PATHS.stageDirectory, "media")) ? await WalkFiles(join(PATHS.stageDirectory, "media")) : [])
    {
        if (!sUsedMedia.has(`media/${file}`))
        {
            sWarnings.push(`media/${file} is not used by any page`);
        }
    }

    const reconcileFile = join(PATHS.workDirectory, "reconcile.json");
    let unreconciled: Array<{ path: string; reason: string }> = [];

    if (!existsSync(reconcileFile))
    {
        Fail("reconcile.json", `file is missing in the work directory (write {"unreconciled": []} when every changed input is reconciled)`);
    }
    else
    {
        try
        {
            unreconciled = RECONCILE(JSON.parse((await readFile(reconcileFile, "utf8")).replace(/^\uFEFF/, "")), "reconcile.json").unreconciled;
        }
        catch (error)
        {
            if (!(error instanceof SyntaxError))
            {
                throw error;
            }

            Fail("reconcile.json", `invalid JSON (${error.message})`);
        }

        for (const entry of unreconciled)
        {
            const glob = new Bun.Glob(entry.path);

            if (inputs.length > 0 && !inputs.some(input => input.path === entry.path || glob.match(input.path)))
            {
                sWarnings.push(`reconcile.json: ${entry.path} matches no freshness input`);
            }
        }
    }

    if (sErrors.length === 0 && (sourceFiles.length !== sSourceHashes.size || sourceFiles.some(file => !sSourceHashes.has(file))))
    {
        Fail("src", "files changed while the build was reading them; run the build again");
    }

    if (sErrors.length === 0 && await HashStage(PATHS.stageDirectory) !== stageBefore)
    {
        Fail("stage", "files in stage/ changed while the build was running; run the build again");
    }

    const rootPrefix = "../".repeat(PATHS.mapRelative.split("/").length);
    const data =
    {
        site:
        {
            project: config?.project,
            links: config?.links,
            basis: config === undefined ? undefined : { label: config.basis.label, written: config.basis.written, snapshot },
            root: rootPrefix,
            areas: config?.areas,
            views,
            tokens: config?.tokens
        },
        pages:
        {
            overview,
            ...areaPages,
            verification,
            basis,
            ...(board === undefined ? {} : { board: { role: board.role }, decisions: { headline: board.decisionsHeadline, role: board.decisionsRole } })
        },
        tasks,
        decisions
    };

    const summary = { errors: sErrors.length, warnings: sWarnings.length, areas: config?.areas.length ?? 0, views: Object.keys(views).length, tasks: tasks.length, decisions: decisions.length, inputs: inputs.length, snapshot };

    console.log(JSON.stringify(summary, null, 2));

    for (const warning of sWarnings)
    {
        console.log(`WARN ${warning}`);
    }

    if (sErrors.length > 0)
    {
        for (const error of sErrors)
        {
            console.error(`ERROR ${error}`);
        }

        process.exit(1);
    }

    // "<" is escaped so the JSON can neither close the script element nor open a comment inside it.
    const json = JSON.stringify(data).replaceAll("<", "\\u003c");
    const html = templateText.replace(SNAPSHOT_PLACEHOLDER, () => snapshot).replace(DATA_PLACEHOLDER, () => json);
    const sourceLines = [...sSourceHashes.keys()].sort().map(file => `${file}\t${sSourceHashes.get(file)}\n`);

    await writeFile(join(PATHS.stageDirectory, "index.html"), html);
    await mkdir(join(PATHS.workDirectory, "build"), { recursive: true });
    await WriteJson(join(PATHS.workDirectory, "build", "build.json"), {
        template,
        stageIndexSha256: Sha256Hex(html),
        srcSha256: Sha256Hex(sourceLines.join("")),
        stageSha256: stageBefore,
        snapshot,
        inputs,
        unreconciled,
        errors: 0,
        warnings: sWarnings
    }, "w");

    console.log(`wrote ${join(PATHS.stageDirectory, "index.html")} and ${join(PATHS.workDirectory, "build", "build.json")}`);
}

await RunCli(Main);
