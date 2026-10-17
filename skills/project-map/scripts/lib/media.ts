// Capture provenance of the visuals in media/: what each file shows, where it came from and how it was made.
// The agent authors W/media.json; publish.ts validates it and records the fields in sources.json published.media[].
import { join } from "node:path";
import { GetEntry, ReadJson } from "./files.ts";
import { RecordedPathProblem } from "./inputs.ts";
import type { MediaProvenance } from "./manifest.ts";
import { AsObject, AsSha256, AsString } from "./validate.ts";
import type { JsonObject } from "./validate.ts";

export const MEDIA_FILE = "media.json";

export const PROVENANCE_KEYS = ["subject", "source", "capturedAt", "identity", "identityReason", "method", "evidence"];

// An authored entry: the provenance plus the raw sha256 of the staged file it describes.
export interface AuthoredMedia
{
    provenance: MediaProvenance;
    sha256: string;
}

function AsText(value: unknown, label: string): string
{
    const text = AsString(value, label);

    if (text.trim().length === 0)
    {
        throw new Error(`${label} must not be empty`);
    }

    return text;
}

function AsDate(value: unknown, label: string): string
{
    const text = AsString(value, label);
    const isCalendarDate = /^\d{4}-\d{2}-\d{2}$/.test(text) && new Date(`${text}T00:00:00Z`).toISOString().startsWith(text);

    if (!isCalendarDate)
    {
        throw new Error(`${label} must be a calendar date written YYYY-MM-DD`);
    }

    return text;
}

// A project-relative POSIX path without "..": the evidence receipt lives inside the project (usually in the work directory).
function AsProjectPath(value: unknown, label: string): string
{
    const path = AsText(value, label);
    const problem = RecordedPathProblem(path, false);

    if (problem !== null)
    {
        throw new Error(`${label}: ${problem}`);
    }

    return path;
}

// identity names what the visual was captured from (snapshot id, build id, commit). A visual that was not captured from
// the project (mockup, concept art, reference, generated image) states null and says why in identityReason.
export function ParseProvenance(value: unknown, label: string): MediaProvenance
{
    const entry: JsonObject = AsObject(value, label);
    const unknown = Object.keys(entry).filter(key => !PROVENANCE_KEYS.includes(key) && key !== "sha256");

    if (unknown.length > 0)
    {
        throw new Error(`${label} has unknown keys: ${unknown.join(", ")}`);
    }

    const identity = entry.identity === null ? null : AsText(entry.identity, `${label} identity`);
    const hasReason = entry.identityReason !== undefined && entry.identityReason !== null;

    if (identity === null && !hasReason)
    {
        throw new Error(`${label}: identity is null, so identityReason must say why`);
    }

    if (identity !== null && hasReason)
    {
        throw new Error(`${label}: identityReason is only for a null identity`);
    }

    return {
        subject: AsText(entry.subject, `${label} subject`),
        source: AsText(entry.source, `${label} source`),
        capturedAt: AsDate(entry.capturedAt, `${label} capturedAt`),
        identity,
        identityReason: hasReason ? AsText(entry.identityReason, `${label} identityReason`) : null,
        method: AsText(entry.method, `${label} method`),
        evidence: entry.evidence === null ? null : AsProjectPath(entry.evidence, `${label} evidence`)
    };
}

// W/media.json: { "<path relative to the map directory, e.g. media/x.png>": { sha256, subject, source, capturedAt, identity, [identityReason,] method, evidence } }
// sha256 is the raw hash of the staged file the entry describes, so an entry cannot be reused for swapped bytes.
// A missing file is an empty list. An evidence path must name an existing file.
export async function ReadMediaProvenance(work: string, projectRoot: string): Promise<Map<string, AuthoredMedia>>
{
    const path = join(work, MEDIA_FILE);
    const provenance = new Map<string, AuthoredMedia>();

    if (await GetEntry(path) === null)
    {
        return provenance;
    }

    let parsed: unknown;

    try
    {
        parsed = await ReadJson<unknown>(path);
    }
    catch (error)
    {
        throw new Error(`${path} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
    }

    const entries = AsObject(parsed, MEDIA_FILE);

    for (const key of Object.keys(entries).sort())
    {
        const label = `${MEDIA_FILE} "${key}"`;
        const entry = ParseProvenance(entries[key], label);
        const sha256 = AsSha256(AsObject(entries[key], label).sha256, `${label} sha256`);

        if (entry.evidence !== null)
        {
            const evidence = await GetEntry(join(projectRoot, ...entry.evidence.split("/")));

            if (evidence === null || !evidence.isFile())
            {
                throw new Error(`${MEDIA_FILE} "${key}": evidence file does not exist: ${entry.evidence}`);
            }
        }

        provenance.set(key, { provenance: entry, sha256 });
    }

    return provenance;
}

// Provenance an earlier publication recorded for exactly these bytes of this path; null when none is recorded or it is not valid.
export function CarriedProvenance(media: unknown, projectPath: string, sha256: string): MediaProvenance | null
{
    if (!Array.isArray(media))
    {
        return null;
    }

    for (const item of media)
    {
        if (typeof item !== "object" || item === null || Array.isArray(item) || !("path" in item) || !("sha256" in item) || item.path !== projectPath || item.sha256 !== sha256)
        {
            continue;
        }

        const fields = Object.fromEntries(Object.entries(item).filter(([key]) => PROVENANCE_KEYS.includes(key)));

        try
        {
            return ParseProvenance(fields, `recorded provenance of ${projectPath}`);
        }
        catch
        {
            return null;
        }
    }

    return null;
}
