// sources.json (manifest v1): what the published map was built from and which files it consists of.
// Format reference: references/manifest.md. publish.ts writes it, status.ts reads it.
import { GetEntry } from "./files.ts";
import type { Input } from "./inputs.ts";
import { RecordedPathProblem } from "./inputs.ts";
import { ParseProvenance, PROVENANCE_KEYS } from "./media.ts";
import { AsArray, AsBoolean, AsNumber, AsObject, AsSha256, AsString, AsStringArray } from "./validate.ts";

export const MANIFEST_SCHEMA = "project-map/sources-1";
export const MANIFEST_FILE = "sources.json";
export const RECEIPT_SCHEMA = "project-map/publication-1";
export const REQUIRED_GATES = ["validate", "deliver", "check", "browser-check"];

// Roles of the fonts the skill ships in assets/fonts; any other font file has role null.
export const BUNDLED_FONT_ROLES: Record<string, string> = {
    "LINESeedKR-Rg.woff2": "text 400",
    "LINESeedKR-Bd.woff2": "text 700",
    "JetBrainsMono-Regular.woff2": "code 400"
};

export const FONT_EXTENSIONS = [".woff2", ".woff", ".ttf", ".otf"];

// Every path in a manifest is a project-relative POSIX path.
export interface FileRecord
{
    path: string;
    sha256: string;
}

// How a visual came to be: what it shows, its source type, when, from which snapshot/build/commit and by what method.
export interface MediaProvenance
{
    subject: string;
    // source type, e.g. 실제 실행 화면, 목업, 컨셉 아트, 레퍼런스, 생성 이미지
    source: string;
    // YYYY-MM-DD
    capturedAt: string;
    // snapshot id, build id or commit the visual was captured from; null when it was not captured from the project
    identity: string | null;
    // why identity is null; null otherwise
    identityReason: string | null;
    method: string;
    // evidence receipt, project-relative path (usually inside the work directory); null when there is none
    evidence: string | null;
}

export interface MediaRecord extends FileRecord, MediaProvenance
{
    bytes: number;
}

export interface FontRecord extends FileRecord
{
    role: string | null;
    // true when the bytes equal the font file the skill ships
    bundled: boolean;
}

export interface ViewRecord
{
    json: FileRecord;
    html: FileRecord;
    // finalize summary in the work directory that passed for these bytes; null when none is known
    receipt: string | null;
    gates: Record<string, string> | null;
}

export interface Unreconciled
{
    path: string;
    reason: string;
}

export interface UpdateRecord
{
    number: number;
    // work directory name, i.e. the task id
    id: string;
    date: string;
    publishedAt: string;
    work: string;
    receipt: string;
    build: string;
    browserGate: string;
    browserScope: string;
    snapshotBefore: string | null;
    snapshotAfter: string;
    copied: number;
    leftInPlace: number;
}

export interface Manifest
{
    schema: typeof MANIFEST_SCHEMA;
    project: { name: string };
    // project-relative path of the durable map directory
    map: string;
    basis: { label: string; written: string };
    snapshot: string;
    scope: { include: string[]; exclude: string[] };
    inputs: Input[];
    unreconciled: Unreconciled[];
    published: {
        entry: FileRecord;
        src: FileRecord[];
        views: Record<string, ViewRecord>;
        fonts: FontRecord[];
        fontLicenses: FileRecord[];
        media: MediaRecord[];
    };
    design: { template: { id: string; version: string | number }; tokens: Record<string, unknown> };
    updates: UpdateRecord[];
}

// Every file whose raw hash the manifest records, in a stable order.
export function CollectPublishedFiles(manifest: Manifest): FileRecord[]
{
    const published = manifest.published;
    const views = Object.keys(published.views).sort().flatMap(view => [published.views[view].json, published.views[view].html]);

    return [published.entry, ...published.src, ...views, ...published.fonts, ...published.fontLicenses, ...published.media];
}

export function IsManifest(value: unknown): value is Manifest
{
    return typeof value === "object" && value !== null && "schema" in value && value.schema === MANIFEST_SCHEMA;
}

function ParseFileRecord(value: unknown, label: string, mapRelative: string): FileRecord
{
    const record = AsObject(value, label);
    const path = AsString(record.path, `${label}.path`);
    const problem = RecordedPathProblem(path, false);

    if (problem !== null)
    {
        throw new Error(`${label}: ${problem}`);
    }

    if (!path.startsWith(`${mapRelative}/`))
    {
        throw new Error(`${label}: published path is outside the map directory ${mapRelative}/: "${path}"`);
    }

    return { path, sha256: AsSha256(record.sha256, `${label}.sha256`) };
}

function ParseFileRecords(value: unknown, label: string, mapRelative: string): FileRecord[]
{
    return AsArray(value, label).map((item, index) => ParseFileRecord(item, `${label}[${index}]`, mapRelative));
}

function ParseInputRecords(value: unknown): Input[]
{
    return AsArray(value, "sources.json inputs").map((item, index) =>
    {
        const label = `sources.json inputs[${index}]`;
        const input = AsObject(item, label);
        const path = AsString(input.path, `${label}.path`);
        const problem = RecordedPathProblem(path, true);

        if (problem !== null)
        {
            throw new Error(`${label}: ${problem}`);
        }

        if (input.mode !== "sha256-text-lf" && input.mode !== "sha256-bytes")
        {
            throw new Error(`${label}.mode is not a known hash mode`);
        }

        return { path, mode: input.mode, sha256: AsSha256(input.sha256, `${label}.sha256`) };
    });
}

// Reads a sources.json of this format and checks everything the scripts rely on: shape, hashes, and that every recorded path is
// a project-relative POSIX path (published files inside the map directory, inputs optionally in one sibling repository).
// Throws on the first problem; a file of another schema is the caller's case (IsManifest).
export function ParseManifest(value: unknown): Manifest
{
    const manifest = AsObject(value, "sources.json");

    if (manifest.schema !== MANIFEST_SCHEMA)
    {
        throw new Error(`sources.json schema is not ${MANIFEST_SCHEMA}`);
    }

    const mapRelative = AsString(manifest.map, "sources.json map");
    const project = AsObject(manifest.project, "sources.json project");
    const basis = AsObject(manifest.basis, "sources.json basis");
    const scope = AsObject(manifest.scope, "sources.json scope");
    const published = AsObject(manifest.published, "sources.json published");
    const rawViews = AsObject(published.views, "sources.json published.views");
    const design = AsObject(manifest.design, "sources.json design");
    const template = AsObject(design.template, "sources.json design.template");
    const version = template.version;

    if (typeof version !== "string" && typeof version !== "number")
    {
        throw new Error("sources.json design.template.version must be a string or number");
    }

    const views: Record<string, ViewRecord> = {};

    for (const id of Object.keys(rawViews))
    {
        const label = `sources.json published.views.${id}`;
        const view = AsObject(rawViews[id], label);
        const gates = view.gates === null ? null : AsObject(view.gates, `${label}.gates`);

        views[id] = {
            json: ParseFileRecord(view.json, `${label}.json`, mapRelative),
            html: ParseFileRecord(view.html, `${label}.html`, mapRelative),
            receipt: view.receipt === null ? null : AsString(view.receipt, `${label}.receipt`),
            gates: gates === null ? null : Object.fromEntries(Object.entries(gates).map(([name, result]) => [name, AsString(result, `${label}.gates.${name}`)]))
        };
    }

    return {
        schema: MANIFEST_SCHEMA,
        project: { name: AsString(project.name, "sources.json project.name") },
        map: mapRelative,
        basis: { label: AsString(basis.label, "sources.json basis.label"), written: AsString(basis.written, "sources.json basis.written") },
        snapshot: AsString(manifest.snapshot, "sources.json snapshot"),
        scope: { include: AsStringArray(scope.include, "sources.json scope.include"), exclude: AsStringArray(scope.exclude, "sources.json scope.exclude") },
        inputs: ParseInputRecords(manifest.inputs),
        unreconciled: AsArray(manifest.unreconciled, "sources.json unreconciled").map((item, index) =>
        {
            const entry = AsObject(item, `sources.json unreconciled[${index}]`);
            return { path: AsString(entry.path, `sources.json unreconciled[${index}].path`), reason: AsString(entry.reason, `sources.json unreconciled[${index}].reason`) };
        }),
        published: {
            entry: ParseFileRecord(published.entry, "sources.json published.entry", mapRelative),
            src: ParseFileRecords(published.src, "sources.json published.src", mapRelative),
            views,
            fonts: AsArray(published.fonts, "sources.json published.fonts").map((item, index) =>
            {
                const label = `sources.json published.fonts[${index}]`;
                const font = AsObject(item, label);
                return { ...ParseFileRecord(font, label, mapRelative), role: font.role === null ? null : AsString(font.role, `${label}.role`), bundled: AsBoolean(font.bundled, `${label}.bundled`) };
            }),
            fontLicenses: ParseFileRecords(published.fontLicenses, "sources.json published.fontLicenses", mapRelative),
            media: AsArray(published.media, "sources.json published.media").map((item, index) =>
            {
                const label = `sources.json published.media[${index}]`;
                const fields = Object.fromEntries(Object.entries(AsObject(item, label)).filter(([key]) => PROVENANCE_KEYS.includes(key)));
                return { ...ParseFileRecord(item, label, mapRelative), bytes: AsNumber(AsObject(item, label).bytes, `${label}.bytes`), ...ParseProvenance(fields, label) };
            })
        },
        design: { template: { id: AsString(template.id, "sources.json design.template.id"), version }, tokens: AsObject(design.tokens, "sources.json design.tokens") },
        updates: AsArray(manifest.updates, "sources.json updates").map((item, index) =>
        {
            const label = `sources.json updates[${index}]`;
            const update = AsObject(item, label);
            AsNumber(update.number, `${label}.number`);
            AsString(update.id, `${label}.id`);
            AsString(update.date, `${label}.date`);

            // the remaining fields are history for people; they are carried forward unchanged
            const record = update as unknown as UpdateRecord;
            return record;
        })
    };
}

export type ManifestReader = "init" | "publish";

// What to do with a sources.json that cannot be used; moving it away loses the receipts and media provenance it carried.
const RECOVERY = "repair it, or move it away. Repair it from version control or the last published copy; moving it away starts the history over: publish then needs a passing archify finalize summary in the new work directory for every view and a media.json entry for every media file";

// The one rule for an existing sources.json, shared by init (before it creates anything) and publish (before it writes anything).
// It is replaced only when it parses as JSON and its schema is not project-map/* (a foreign format; its content is not carried
// over): null. A file that does not parse (merge-conflict markers, truncation), a project-map manifest of another version, or a
// project-map/sources-1 manifest that is not valid stops with "repair it, or move it away": replacing it would silently drop its
// history. When publish finds the problem the file changed after init, so a new init (in a new --work) is needed after the repair.
export async function ReadManifestFile(path: string, mapRelative: string, reader: ManifestReader): Promise<Manifest | null>
{
    const entry = await GetEntry(path);

    if (entry === null)
    {
        return null;
    }

    if (!entry.isFile())
    {
        throw new Error(`${path} is not a regular file (links are not followed); ${RECOVERY}`);
    }

    const after = reader === "init" ? " (nothing was created)" : " (nothing was written). It changed after init: once it is repaired or moved away, run init again with a new --work directory and publish from that";
    let parsed: unknown;

    try
    {
        parsed = JSON.parse(await Bun.file(path).text());
    }
    catch (error)
    {
        throw new Error(`${path} is not valid JSON (${error instanceof Error ? error.message : String(error)}), for example it holds merge-conflict markers; ${RECOVERY}${after}`);
    }

    const schema = typeof parsed === "object" && parsed !== null && "schema" in parsed ? parsed.schema : undefined;

    if (typeof schema === "string" && schema.startsWith("project-map/") && schema !== MANIFEST_SCHEMA)
    {
        throw new Error(`${path} is a project-map manifest of another version (${schema}); this project-map writes ${MANIFEST_SCHEMA}. If it comes from a newer project-map, update the skill; otherwise ${RECOVERY}${after}`);
    }

    if (!IsManifest(parsed))
    {
        return null;
    }

    let manifest: Manifest;

    try
    {
        manifest = ParseManifest(parsed);
    }
    catch (error)
    {
        throw new Error(`${path} is a ${MANIFEST_SCHEMA} manifest but is not valid (${error instanceof Error ? error.message : String(error)}); ${RECOVERY}${after}`);
    }

    if (manifest.map !== mapRelative)
    {
        throw new Error(`${path} records map "${manifest.map}" but --map is "${mapRelative}"; ${RECOVERY}${after}`);
    }

    return manifest;
}

const TEMPLATE_MARKER = /<meta\s[^>]*name\s*=\s*["']project-map-template["']/i;

// True when the map directory's index.html carries the template marker <meta name="project-map-template" ...>, i.e. project-map
// built it. Without a valid sources.json that means the manifest is missing or was replaced, not that the map never was published.
export async function HasTemplateMarker(mapDirectory: string): Promise<boolean>
{
    const path = `${mapDirectory}/index.html`;
    const entry = await GetEntry(path);

    if (entry === null || !entry.isFile())
    {
        return false;
    }

    return TEMPLATE_MARKER.test(await Bun.file(path).text());
}
