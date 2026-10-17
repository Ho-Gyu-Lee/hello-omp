// Publishes the verified stage of a project map into the durable map directory and records it in sources.json.
// Usage: bun publish.ts --project <root> --map <map-rel> --work <root>/.omp-artifacts/<task-id> [--receipt <n>] [--adopt]
// One publish per map at a time (exclusive lock file in <project>/.omp-artifacts/). Every precondition is checked before the
// first write. Durable files are never deleted. Order of writes: fonts, media, src, views, entry (each durable target is re-hashed
// right before it is overwritten), then W/publication-<n>.json (exclusive create), then sources.json last (re-hashed first).
// --receipt asserts the expected publication number. --adopt accepts views of a map made by another tool without a finalize summary.
import { readdir, stat, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { CompareText, CopyVerified, DigestStage, GetEntry, HashStageFiles, MapLimit, ParseArguments, ParseHashLines, ReadJson, RelativePosix, RunCli, Sha256File, Sha256Hex, WalkFiles, WriteJson } from "./lib/files.ts";
import { CompareInputs, ComputeInputs, RecordedPathProblem, ScopeForMap, SnapshotId, ValidateScope } from "./lib/inputs.ts";
import type { Input } from "./lib/inputs.ts";
import { AcquireLock } from "./lib/lock.ts";
import { ResolveMap, ResolveWork } from "./lib/location.ts";
import type { MapLocation } from "./lib/location.ts";
import { CarriedProvenance, MEDIA_FILE, ReadMediaProvenance } from "./lib/media.ts";
import { BUNDLED_FONT_ROLES, FONT_EXTENSIONS, HasTemplateMarker, MANIFEST_FILE, MANIFEST_SCHEMA, ReadManifestFile, RECEIPT_SCHEMA, REQUIRED_GATES } from "./lib/manifest.ts";
import type { FileRecord, Manifest, MediaProvenance, Unreconciled, UpdateRecord, ViewRecord } from "./lib/manifest.ts";
import { AsArray, AsObject, AsSha256, AsString, AsStringArray } from "./lib/validate.ts";

const SKILL_ROOT = resolve(import.meta.dir, "..");
const VIEW_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const HASH_CONCURRENCY = 16;

type FileKind = "fonts" | "media" | "src" | "view" | "entry";

// Copy order: assets first, the entry last, so the published entry never references a missing file.
const PUBLISH_ORDER: FileKind[] = ["fonts", "media", "src", "view", "entry"];

interface BuildReport
{
    stageIndexSha256: string;
    stageSha256: string;
    snapshot: string;
    inputs: Input[];
    unreconciled: Unreconciled[];
    template: { id: string; version: string | number };
}

interface BrowserGate
{
    entrySha256: string;
    stageSha256: string;
    scope: string;
}

interface MapConfig
{
    name: string;
    basisLabel: string;
    basisWritten: string;
    include: string[];
    exclude: string[];
    views: string[];
    tokens: Record<string, unknown>;
}

interface PlannedFile
{
    // relative to the map directory, POSIX
    path: string;
    kind: FileKind;
    stageSha256: string;
    durableSha256: string | null;
}

interface FinalizeMatch
{
    path: string;
    gates: Record<string, string>;
}

function ProjectPath(mapRelative: string, path: string): string
{
    return `${mapRelative}/${path}`;
}

async function HashIfExists(path: string): Promise<string | null>
{
    return await GetEntry(path) === null ? null : Sha256File(path);
}

function ParseInputs(value: unknown): Input[]
{
    return AsArray(value, "build.json inputs").map((item, index) =>
    {
        const input = AsObject(item, `build.json inputs[${index}]`);
        const mode = input.mode;
        const path = AsString(input.path, `build.json inputs[${index}].path`);
        const problem = RecordedPathProblem(path, true);

        if (problem !== null)
        {
            throw new Error(`build.json inputs[${index}]: ${problem}`);
        }

        if (mode !== "sha256-text-lf" && mode !== "sha256-bytes")
        {
            throw new Error(`build.json inputs[${index}].mode is not a known hash mode`);
        }

        return { path, mode, sha256: AsSha256(input.sha256, `build.json inputs[${index}].sha256`) };
    });
}

function ParseUnreconciled(value: unknown): Unreconciled[]
{
    return AsArray(value, "build.json unreconciled").map((item, index) =>
    {
        const entry = AsObject(item, `build.json unreconciled[${index}]`);
        return { path: AsString(entry.path, `build.json unreconciled[${index}].path`), reason: AsString(entry.reason, `build.json unreconciled[${index}].reason`) };
    });
}

async function ReadBuildReport(work: string): Promise<BuildReport>
{
    const path = join(work, "build", "build.json");

    if (await GetEntry(path) === null)
    {
        throw new Error(`no build report: ${path}; run build.ts first`);
    }

    const report = AsObject(await ReadJson<unknown>(path), "build.json");

    if (report.errors !== 0)
    {
        throw new Error(`build.json reports errors: ${String(report.errors)}; publish needs a build with errors 0`);
    }

    const template = AsObject(report.template, "build.json template");
    const version = template.version;

    if (typeof version !== "string" && typeof version !== "number")
    {
        throw new Error("build.json template.version must be a string or number");
    }

    const inputs = ParseInputs(report.inputs);
    const snapshot = AsString(report.snapshot, "build.json snapshot");

    if (SnapshotId(inputs) !== snapshot)
    {
        throw new Error("build.json snapshot does not match its own inputs");
    }

    return {
        stageIndexSha256: AsSha256(report.stageIndexSha256, "build.json stageIndexSha256"),
        stageSha256: AsSha256(report.stageSha256, "build.json stageSha256 (rebuild with the current build.ts)"),
        snapshot,
        inputs,
        unreconciled: ParseUnreconciled(report.unreconciled),
        template: { id: AsString(template.id, "build.json template.id"), version }
    };
}

async function ReadBrowserGate(work: string): Promise<BrowserGate>
{
    const path = join(work, "BrowserGate.json");

    if (await GetEntry(path) === null)
    {
        throw new Error(`no browser gate receipt: ${path}; check the staged entry in a browser and write it`);
    }

    const gate = AsObject(await ReadJson<unknown>(path), "BrowserGate.json");

    if (gate.passed !== true)
    {
        throw new Error("BrowserGate.json: passed is not true");
    }

    return {
        entrySha256: AsSha256(gate.entrySha256, "BrowserGate.json entrySha256"),
        stageSha256: AsSha256(gate.stageSha256, "BrowserGate.json stageSha256"),
        scope: AsString(gate.scope, "BrowserGate.json scope")
    };
}

async function ReadMapConfig(stage: string): Promise<MapConfig>
{
    const config = AsObject(await ReadJson<unknown>(join(stage, "src", "map.config.json")), "map.config.json");
    const project = AsObject(config.project, "map.config.json project");
    const basis = AsObject(config.basis, "map.config.json basis");
    const scope = AsObject(config.scope, "map.config.json scope");
    const views = Object.keys(AsObject(config.views ?? {}, "map.config.json views"));

    for (const view of views)
    {
        if (!VIEW_ID_PATTERN.test(view))
        {
            throw new Error(`map.config.json views: "${view}" is not a valid view id`);
        }
    }

    return {
        name: AsString(project.name, "map.config.json project.name"),
        basisLabel: AsString(basis.label, "map.config.json basis.label"),
        basisWritten: AsString(basis.written, "map.config.json basis.written"),
        include: AsStringArray(scope.include, "map.config.json scope.include"),
        exclude: AsStringArray(scope.exclude ?? [], "map.config.json scope.exclude"),
        views,
        tokens: AsObject(config.tokens ?? {}, "map.config.json tokens")
    };
}

function ClassifyStageFile(path: string, views: string[]): FileKind | "reserved" | null
{
    if (path === "index.html")
    {
        return "entry";
    }

    if (path === MANIFEST_FILE)
    {
        return "reserved";
    }

    const [first] = path.split("/");

    if (path.includes("/") && (first === "src" || first === "fonts" || first === "media"))
    {
        return first;
    }

    return views.some(view => path === `${view}.html` || path === `${view}.architecture.json`) ? "view" : null;
}

// Splits the stage into published files and stray files. A stage file outside the layout is tolerated only
// when the durable map already holds the same bytes (a carried-over file); anything else would be silently dropped.
async function ListPublished(stageHashes: Map<string, string>, mapDirectory: string, views: string[]): Promise<{ path: string; kind: FileKind }[]>
{
    const published: { path: string; kind: FileKind }[] = [];
    const stray: string[] = [];

    for (const [path, sha256] of stageHashes)
    {
        const kind = ClassifyStageFile(path, views);

        if (kind === "reserved")
        {
            continue;
        }

        if (kind !== null)
        {
            published.push({ path, kind });
            continue;
        }

        if (await HashIfExists(join(mapDirectory, path)) !== sha256)
        {
            stray.push(path);
        }
    }

    if (stray.length > 0)
    {
        throw new Error(`stage has files outside the published layout (index.html, src/, fonts/, media/, configured views); move or remove them:\n  ${stray.join("\n  ")}`);
    }

    const missing = ["index.html", "src/map.config.json", ...views.flatMap(view => [`${view}.html`, `${view}.architecture.json`])].filter(path => !published.some(file => file.path === path));

    if (missing.length > 0)
    {
        throw new Error(`stage lacks required files:\n  ${missing.join("\n  ")}`);
    }

    return published;
}

async function PlanFiles(stageHashes: Map<string, string>, mapDirectory: string, published: { path: string; kind: FileKind }[]): Promise<PlannedFile[]>
{
    return MapLimit(published, HASH_CONCURRENCY, async file =>
    {
        const durable = join(mapDirectory, file.path);
        const entry = await GetEntry(durable);

        if (entry !== null && !entry.isFile())
        {
            throw new Error(`durable path exists and is not a file: ${durable}`);
        }

        return { ...file, stageSha256: stageHashes.get(file.path) as string, durableSha256: entry === null ? null : await Sha256File(durable) };
    });
}

// Searches W/archify/<view>/**/<view>.finalize-summary.json (newest first) for a passing summary of exactly these bytes.
async function FindFinalizeSummary(work: string, view: string, jsonSha256: string, htmlSha256: string): Promise<{ match: FinalizeMatch | null; reasons: string[] }>
{
    const root = join(work, "archify", view);

    if (await GetEntry(root) === null)
    {
        return { match: null, reasons: [`${root} does not exist`] };
    }

    const found: { path: string; time: number }[] = [];

    for await (const relative of new Bun.Glob(`**/${view}.finalize-summary.json`).scan({ cwd: root, dot: true }))
    {
        const path = join(root, relative);
        found.push({ path, time: (await stat(path)).mtimeMs });
    }

    if (found.length === 0)
    {
        return { match: null, reasons: [`no ${view}.finalize-summary.json under ${root}`] };
    }

    found.sort((left, right) => right.time - left.time || CompareText(left.path, right.path));

    const reasons: string[] = [];

    for (const { path } of found)
    {
        const summary = AsObject(await ReadJson<unknown>(path), path);
        const gates = AsObject(summary.gates ?? {}, `${path} gates`);
        const failing = [...REQUIRED_GATES.filter(gate => !(gate in gates)), ...Object.keys(gates).filter(gate => gates[gate] !== "pass")];
        const problems: string[] = [];

        if (summary.ok !== true)
        {
            problems.push("ok is not true");
        }

        if (failing.length > 0)
        {
            problems.push(`gates missing or not pass: ${failing.join(", ")}`);
        }

        if (AsObject(summary.specification ?? {}, `${path} specification`).sha256 !== jsonSha256)
        {
            problems.push("specification sha256 differs from the stage JSON");
        }

        if (AsObject(summary.artifact ?? {}, `${path} artifact`).sha256 !== htmlSha256)
        {
            problems.push("artifact sha256 differs from the stage HTML");
        }

        if (problems.length === 0)
        {
            return { match: { path, gates: Object.fromEntries(Object.entries(gates).map(([name, result]) => [name, String(result)])) }, reasons };
        }

        reasons.push(`${path}: ${problems.join("; ")}`);
    }

    return { match: null, reasons };
}

// A view needs a passing finalize summary bound to exactly its staged bytes unless those bytes are the ones the previous
// manifest recorded. Staged bytes that differ from the durable copy, or (with a previous manifest) from the recorded bytes,
// are never recorded as if they had passed: a hand edit or a line-ending conversion of a published view stops publish, and
// restoring the recorded bytes in stage (with their recorded receipt) is accepted and carries that receipt.
// Without any previous v1 manifest, staged bytes equal to the durable files (a map made by another tool) are accepted only with
// a matching summary or with --adopt, which records them with receipt null. A view recorded with receipt null keeps null on
// later publishes (a matching summary upgrades it).
async function ProveViews(work: string, location: MapLocation, files: PlannedFile[], viewIds: string[], previous: Manifest | null, isAdoptAllowed: boolean, isOwnMap: boolean): Promise<{ views: Record<string, ViewRecord>; withoutReceipt: string[]; adopted: string[] }>
{
    const views: Record<string, ViewRecord> = {};
    const withoutReceipt: string[] = [];
    const adopted: string[] = [];
    const unproven: string[] = [];
    const unadopted: string[] = [];

    for (const id of viewIds)
    {
        const json = files.find(file => file.path === `${id}.architecture.json`);
        const html = files.find(file => file.path === `${id}.html`);

        if (json === undefined || html === undefined)
        {
            throw new Error(`stage lacks the files of view ${id}`);
        }

        const changed = json.durableSha256 !== json.stageSha256 || html.durableSha256 !== html.stageSha256;
        const recorded = previous?.published.views[id];
        const matchesRecord = recorded !== undefined && recorded.json.sha256 === json.stageSha256 && recorded.html.sha256 === html.stageSha256;
        const needsProof = !matchesRecord && (changed || previous !== null);
        const isAdoption = previous === null && !changed;
        const hasRecordedReceipt = matchesRecord && recorded.receipt !== null;
        const { match, reasons } = hasRecordedReceipt ? { match: null, reasons: [] } : await FindFinalizeSummary(work, id, json.stageSha256, html.stageSha256);

        if (match === null && needsProof)
        {
            const why = changed ? "the staged bytes differ from the durable files" : "the staged bytes equal the durable files but differ from what sources.json recorded at the last publication (edited by hand, or line endings converted)";
            unproven.push(`view ${id}: ${why}, and no passing finalize summary matches them\n    ${reasons.join("\n    ")}`);
            continue;
        }

        if (match === null && isAdoption)
        {
            if (!isAdoptAllowed)
            {
                unadopted.push(id);
                continue;
            }

            adopted.push(id);
        }

        const receipt = match !== null ? RelativePosix(location.projectRoot, match.path) : matchesRecord ? recorded.receipt : null;

        views[id] = {
            json: { path: ProjectPath(location.mapRelative, json.path), sha256: json.stageSha256 },
            html: { path: ProjectPath(location.mapRelative, html.path), sha256: html.stageSha256 },
            receipt,
            gates: match !== null ? match.gates : matchesRecord ? recorded.gates : null
        };

        if (receipt === null)
        {
            withoutReceipt.push(id);
        }
    }

    if (unproven.length > 0)
    {
        throw new Error(`views changed without a finalize summary (nothing was written):\n  ${unproven.join("\n  ")}`);
    }

    if (unadopted.length > 0)
    {
        throw new Error(isOwnMap
            ? `the durable map has views that no finalize summary vouches for, and its sources.json is missing or was replaced although project-map built it (index.html carries the project-map template marker) (nothing was written): ${unadopted.join(", ")}\n  Restore sources.json from version control (or from the last published copy) and run init again with a new --work directory; --adopt is not for maps project-map published. If it cannot be restored, the history starts over: run archify finalize for every view in this work directory, copy the passing outputs into stage/ and write a media.json entry for every media file.`
            : `the durable map has views that no finalize summary vouches for and no earlier project-map manifest recorded (nothing was written): ${unadopted.join(", ")}\n  Run archify finalize on them and copy the passing outputs into stage/, or, if this map was made by another tool and you accept these views as they are, run publish again with --adopt (they are recorded with receipt null and keep it until a finalize summary matches their bytes).`);
    }

    return { views, withoutReceipt, adopted };
}

async function ListReceiptNumbers(work: string): Promise<number[]>
{
    const numbers: number[] = [];

    for (const name of await readdir(work))
    {
        const match = /^publication-(\d+)\.json$/.exec(name);

        if (match !== null)
        {
            numbers.push(Number(match[1]));
        }
    }

    return numbers.sort((left, right) => left - right);
}

// Hashes of every version of each durable file this task published earlier, read from its publication-<n>.json receipts
// (every published file, copied or unchanged, is listed in `files`; older receipts only list `copies`).
async function ReadWrittenHashes(work: string, numbers: number[]): Promise<Map<string, Set<string>>>
{
    const written = new Map<string, Set<string>>();

    function Remember(path: string, sha256: string): void
    {
        const known = written.get(path) ?? new Set<string>();
        known.add(sha256);
        written.set(path, known);
    }

    for (const number of numbers)
    {
        const label = `publication-${number}.json`;
        const receipt = AsObject(await ReadJson<unknown>(join(work, label)), label);

        for (const key of ["files", "copies"])
        {
            for (const [index, item] of AsArray(receipt[key] ?? [], `${label} ${key}`).entries())
            {
                const file = AsObject(item, `${label} ${key}[${index}]`);
                Remember(AsString(file.path, `${label} ${key}[${index}].path`), AsSha256(file.sha256, `${label} ${key}[${index}].sha256`));
            }
        }

        const manifest = AsObject(receipt.manifest, `${label} manifest`);
        Remember(MANIFEST_FILE, AsSha256(manifest.sha256, `${label} manifest.sha256`));
    }

    return written;
}

// A durable file may be overwritten only while it still has the bytes it had at init or bytes this task published itself.
function FindUnsafeOverwrites(files: PlannedFile[], manifestSha256: string | null, before: Map<string, string>, written: Map<string, Set<string>>): string[]
{
    const problems: string[] = [];
    const targets = [
        ...files.map(file => ({ path: file.path, stage: file.stageSha256, durable: file.durableSha256 })),
        { path: MANIFEST_FILE, stage: null, durable: manifestSha256 }
    ];

    for (const { path, stage, durable } of targets)
    {
        const isPublishedHere = written.has(path);

        if (durable === null)
        {
            if (isPublishedHere || before.has(path))
            {
                problems.push(isPublishedHere ? `${path}: removed by someone else after this task published it` : `${path}: removed since init`);
            }

            continue;
        }

        if (durable === stage || before.get(path) === durable || written.get(path)?.has(durable) === true)
        {
            continue;
        }

        if (isPublishedHere)
        {
            problems.push(`${path}: changed by someone else after this task published it`);
        }
        else
        {
            problems.push(before.has(path) ? `${path}: changed since init` : `${path}: appeared since init (it did not exist at init)`);
        }
    }

    return problems;
}

// Every media file that is new or has new bytes needs an entry in W/media.json whose sha256 equals the staged bytes.
// Unchanged files keep the provenance recorded earlier. All problems stop publish before any write.
async function ResolveMedia(work: string, location: MapLocation, files: PlannedFile[], previous: Manifest | null): Promise<Map<string, MediaProvenance>>
{
    const mediaFiles = files.filter(file => file.kind === "media");
    const authored = await ReadMediaProvenance(work, location.projectRoot);
    const orphans = [...authored.keys()].filter(path => !mediaFiles.some(file => file.path === path));

    if (orphans.length > 0)
    {
        throw new Error(`${MEDIA_FILE} has entries for files that are not in stage/media (nothing was written):\n  ${orphans.join("\n  ")}`);
    }

    const resolved = new Map<string, MediaProvenance>();
    const missing: string[] = [];
    const swapped: string[] = [];

    for (const file of mediaFiles)
    {
        const isUnchanged = file.durableSha256 === file.stageSha256;
        const entry = authored.get(file.path);

        if (entry !== undefined && entry.sha256 !== file.stageSha256)
        {
            swapped.push(`${file.path} (media.json describes ${entry.sha256.slice(0, 12)}, the staged file is ${file.stageSha256.slice(0, 12)})`);
            continue;
        }

        const carried = entry === undefined && isUnchanged ? CarriedProvenance(previous?.published.media, ProjectPath(location.mapRelative, file.path), file.stageSha256) : null;
        const provenance = entry?.provenance ?? carried;

        if (provenance === null)
        {
            missing.push(`${file.path} (${file.durableSha256 === null ? "new" : isUnchanged ? "unchanged, but no provenance is recorded for it" : "bytes changed"})`);
            continue;
        }

        resolved.set(file.path, provenance);
    }

    if (swapped.length > 0)
    {
        throw new Error(`${MEDIA_FILE} sha256 does not match the staged file, so the provenance was written for other bytes (nothing was written):\n  ${swapped.join("\n  ")}`);
    }

    if (missing.length > 0)
    {
        throw new Error(`media files without provenance (nothing was written); add an entry to ${join(work, MEDIA_FILE)} (sha256, subject, source, capturedAt, identity, method, evidence):\n  ${missing.join("\n  ")}`);
    }

    return resolved;
}

// Durable files the stage no longer contains stay in place; they are only reported.
function FindLeftInPlace(durableFiles: string[], stageHashes: Map<string, string>): string[]
{
    return durableFiles.filter(path => path !== MANIFEST_FILE && !stageHashes.has(path));
}

async function BuildPublished(stage: string, location: MapLocation, files: PlannedFile[], views: Record<string, ViewRecord>, media: Map<string, MediaProvenance>): Promise<Manifest["published"]>
{
    const skillFonts = new Map<string, string>();
    const fontDirectory = join(SKILL_ROOT, "assets", "fonts");

    for (const name of await readdir(fontDirectory))
    {
        skillFonts.set(name, await Sha256File(join(fontDirectory, name)));
    }

    const record = (file: PlannedFile): FileRecord => ({ path: ProjectPath(location.mapRelative, file.path), sha256: file.stageSha256 });
    const ofKind = (kind: FileKind) => files.filter(file => file.kind === kind).sort((left, right) => CompareText(left.path, right.path));
    const isFont = (file: PlannedFile) => FONT_EXTENSIONS.some(extension => file.path.toLowerCase().endsWith(extension));
    const entry = files.find(file => file.path === "index.html");

    if (entry === undefined)
    {
        throw new Error("stage lacks index.html");
    }

    return {
        entry: record(entry),
        src: ofKind("src").map(record),
        views,
        fonts: ofKind("fonts").filter(isFont).map(file => ({ ...record(file), role: BUNDLED_FONT_ROLES[basename(file.path)] ?? null, bundled: skillFonts.get(basename(file.path)) === file.stageSha256 })),
        fontLicenses: ofKind("fonts").filter(file => !isFont(file)).map(record),
        media: ofKind("media").map(file =>
        {
            const provenance = media.get(file.path);

            if (provenance === undefined)
            {
                throw new Error(`no provenance resolved for ${file.path}`);
            }

            return { ...record(file), bytes: Bun.file(join(stage, file.path)).size, ...provenance };
        })
    };
}

async function PublishLocked(location: MapLocation, work: string, receiptArgument: string | undefined, isAdoptAllowed: boolean): Promise<void>
{
    const stage = join(work, "stage");
    const workRelative = RelativePosix(location.projectRoot, work);

    // the durable map: links inside it are refused before anything is planned
    const mapEntry = await GetEntry(location.mapDirectory);

    if (mapEntry !== null && !mapEntry.isDirectory())
    {
        throw new Error(`map path exists and is not a directory: ${location.mapDirectory}`);
    }

    const durableFiles = mapEntry === null ? [] : await WalkFiles(location.mapDirectory);

    // build and browser receipts must describe exactly these stage bytes; every stage file is hashed once and those hashes are what gets copied
    const build = await ReadBuildReport(work);
    const stageEntries = await HashStageFiles(stage);
    const stageHashes = new Map(stageEntries.map(entry => [entry.path, entry.sha256]));
    const stageIndexSha256 = stageHashes.get("index.html");

    if (stageIndexSha256 === undefined)
    {
        throw new Error("stage has no index.html");
    }

    if (stageIndexSha256 !== build.stageIndexSha256)
    {
        throw new Error("stage/index.html differs from the last passing build (stale build); run build.ts again");
    }

    if (DigestStage(stageEntries) !== build.stageSha256)
    {
        throw new Error("stage/ (src, fonts, media, views) differs from the last passing build (stale build); run build.ts again");
    }

    const gate = await ReadBrowserGate(work);

    if (gate.entrySha256 !== stageIndexSha256)
    {
        throw new Error("BrowserGate.json describes another entry than stage/index.html; check the current entry in a browser and rewrite it");
    }

    if (gate.stageSha256 !== build.stageSha256)
    {
        throw new Error("BrowserGate.json describes another stage than the one that was built (src, fonts, media or views changed); check the current stage in a browser and rewrite it");
    }

    const config = await ReadMapConfig(stage);
    await ValidateScope(location.projectRoot, { include: config.include, exclude: config.exclude });

    const published = await ListPublished(stageHashes, location.mapDirectory, config.views);
    const files = await PlanFiles(stageHashes, location.mapDirectory, published);

    // nothing durable may have changed behind this task's back
    const beforeHashesPath = join(work, "before.sha256.txt");

    if (await GetEntry(beforeHashesPath) === null)
    {
        throw new Error(`${beforeHashesPath} is missing; run init.ts first`);
    }

    const before = ParseHashLines(await Bun.file(beforeHashesPath).text());
    const receiptNumbers = await ListReceiptNumbers(work);
    const written = await ReadWrittenHashes(work, receiptNumbers);
    const manifestPath = join(location.mapDirectory, MANIFEST_FILE);
    const manifestEntry = await GetEntry(manifestPath);

    if (manifestEntry !== null && !manifestEntry.isFile())
    {
        throw new Error(`durable path exists and is not a file: ${manifestPath}`);
    }

    // an unreadable or invalid sources.json is reported as such first (it changed after init, since init refuses it)
    const previous = await ReadManifestFile(manifestPath, location.mapRelative, "publish");
    const isOwnMap = previous === null && await HasTemplateMarker(location.mapDirectory);

    if (isOwnMap && isAdoptAllowed)
    {
        throw new Error("--adopt is refused: index.html carries the project-map template marker, so this map was published by project-map but its sources.json is missing or was replaced; restore sources.json (from version control or the last published copy), run init again with a new --work directory and publish without --adopt. If it cannot be restored, the history starts over: run archify finalize for every view, copy the passing outputs into stage/ and write a media.json entry for every media file (nothing was written)");
    }

    const manifestSha256 = manifestEntry === null ? null : await Sha256File(manifestPath);
    const unsafe = FindUnsafeOverwrites(files, manifestSha256, before, written);

    if (unsafe.length > 0)
    {
        throw new Error(`changed outside this task, re-integrate before publishing (nothing was written):\n  ${unsafe.join("\n  ")}`);
    }

    // the receipt number is one-time
    const number = (receiptNumbers.at(-1) ?? 0) + 1;

    if (receiptArgument !== undefined && Number(receiptArgument) !== number)
    {
        const isUsed = receiptNumbers.includes(Number(receiptArgument));
        throw new Error(isUsed ? `publication-${receiptArgument}.json already exists; receipts are one-time, the next number is ${number}` : `--receipt ${receiptArgument} is not the next publication number (${number})`);
    }

    const { views, withoutReceipt, adopted } = await ProveViews(work, location, files, config.views, previous, isAdoptAllowed, isOwnMap);
    const media = await ResolveMedia(work, location, files, previous);

    // all guards passed: compute everything that will be written
    const scope = ScopeForMap({ include: config.include, exclude: config.exclude }, location.mapRelative);
    const drift = CompareInputs(build.inputs, (await ComputeInputs(location.projectRoot, scope)).inputs);
    const leftInPlace = FindLeftInPlace(durableFiles, stageHashes);
    const changes = files.filter(file => file.durableSha256 !== file.stageSha256);
    const publishedAt = new Date().toISOString();

    const update: UpdateRecord = {
        number,
        id: basename(work),
        date: new Date().toLocaleDateString("sv-SE"),
        publishedAt,
        work: workRelative,
        receipt: `${workRelative}/publication-${number}.json`,
        build: `${workRelative}/build/build.json`,
        browserGate: `${workRelative}/BrowserGate.json`,
        browserScope: gate.scope,
        snapshotBefore: previous?.snapshot ?? null,
        snapshotAfter: build.snapshot,
        copied: changes.length,
        leftInPlace: leftInPlace.length
    };

    const manifest: Manifest = {
        schema: MANIFEST_SCHEMA,
        project: { name: config.name },
        map: location.mapRelative,
        basis: { label: config.basisLabel, written: config.basisWritten },
        snapshot: build.snapshot,
        scope: { include: config.include, exclude: config.exclude },
        inputs: build.inputs,
        unreconciled: build.unreconciled,
        published: await BuildPublished(stage, location, files, views, media),
        design: { template: build.template, tokens: config.tokens },
        updates: [...(previous?.updates ?? []), update]
    };

    const isSameManifest = previous !== null && JSON.stringify({ ...previous, updates: [] }) === JSON.stringify({ ...manifest, updates: [] });

    if (changes.length === 0 && isSameManifest)
    {
        console.log(JSON.stringify({ published: false, reason: "the durable map and sources.json already match the stage", leftInPlace }, null, 2));
        return;
    }

    const manifestText = JSON.stringify(manifest, null, 2) + "\n";
    const manifestNewSha256 = Sha256Hex(manifestText);
    const copies: { path: string; replacedSha256: string | null; sha256: string }[] = [];

    // last look before the first write: a durable target that changed since it was hashed is another session's work
    for (const file of changes)
    {
        if (await HashIfExists(join(location.mapDirectory, file.path)) !== file.durableSha256)
        {
            throw new Error(`${file.path} changed while publishing; nothing was written, run publish again`);
        }
    }

    for (const kind of PUBLISH_ORDER)
    {
        for (const file of changes.filter(candidate => candidate.kind === kind))
        {
            const target = join(location.mapDirectory, file.path);

            if (await HashIfExists(target) !== file.durableSha256)
            {
                throw new Error(`${file.path} changed while publishing; it was not overwritten (copied so far: ${copies.map(copy => copy.path).join(", ") || "none"}); sources.json was not updated`);
            }

            const sha256 = await CopyVerified(join(stage, file.path), target, file.durableSha256 === null, file.stageSha256);
            copies.push({ path: file.path, replacedSha256: file.durableSha256, sha256 });
        }
    }

    // every published file, copied now or already equal, must carry the staged bytes before the record is written
    const mismatched: string[] = [];

    for (const file of files)
    {
        if (await Sha256File(join(location.mapDirectory, file.path)) !== file.stageSha256)
        {
            mismatched.push(file.path);
        }
    }

    if (mismatched.length > 0)
    {
        throw new Error(`published bytes differ from the stage after copying: ${mismatched.join(", ")}; no receipt and no sources.json were written`);
    }

    const receiptPath = join(work, `publication-${number}.json`);

    await WriteJson(receiptPath, {
        schema: RECEIPT_SCHEMA,
        number,
        publishedAt,
        map: location.mapRelative,
        snapshot: build.snapshot,
        stageIndexSha256,
        stageSha256: build.stageSha256,
        copies,
        files: files.map(file => ({ path: file.path, sha256: file.stageSha256 })),
        unchanged: files.length - copies.length,
        leftInPlace,
        viewsWithoutReceipt: withoutReceipt,
        viewsAdopted: adopted,
        driftSinceBuild: drift,
        manifest: { path: MANIFEST_FILE, replacedSha256: manifestSha256, sha256: manifestNewSha256 }
    }, "wx");

    if (await HashIfExists(manifestPath) !== manifestSha256)
    {
        throw new Error("sources.json changed while publishing; it was not overwritten (the published files and receipt are in place), re-run init and publish");
    }

    await writeFile(manifestPath, manifestText);

    if (await Sha256File(manifestPath) !== manifestNewSha256)
    {
        throw new Error("sources.json bytes differ from the computed manifest after writing");
    }

    const earlier = withoutReceipt.filter(id => !adopted.includes(id));
    const notes: string[] = [];

    if (adopted.length > 0)
    {
        notes.push(`views adopted now with --adopt and recorded with receipt null: ${adopted.join(", ")}`);
    }

    if (earlier.length > 0)
    {
        notes.push(`views still recorded with receipt null (adopted by an earlier publish): ${earlier.join(", ")}`);
    }

    if (notes.length > 0)
    {
        notes.push("a view keeps receipt null until a finalize summary matches its bytes");
    }

    console.log(JSON.stringify({ published: true, number, receipt: receiptPath, snapshot: build.snapshot, copied: copies.map(copy => copy.path), unchanged: files.length - copies.length, leftInPlace, viewsWithoutReceipt: withoutReceipt, viewsAdopted: adopted, notes, driftSinceBuild: drift }, null, 2));
}

async function Main(): Promise<void>
{
    const args = ParseArguments(Bun.argv.slice(2), ["project", "map", "work"], ["receipt"], ["adopt"]);
    const location = await ResolveMap(args.project, args.map);
    const work = await ResolveWork(location, args.work);

    if (args.receipt !== undefined && !/^[1-9]\d*$/.test(args.receipt))
    {
        throw new Error(`--receipt must be a positive integer: "${args.receipt}"`);
    }

    for (const name of ["stage", "before"])
    {
        if (await GetEntry(join(work, name)) === null)
        {
            throw new Error(`${join(work, name)} is missing; run init.ts first`);
        }
    }

    // the lock is taken before any guard is evaluated and removed on every exit
    const release = await AcquireLock(location.projectRoot, location.mapRelative, RelativePosix(location.projectRoot, work));

    try
    {
        await PublishLocked(location, work, args.receipt, args.adopt === "true");
    }
    finally
    {
        await release();
    }
}

await RunCli(Main);
