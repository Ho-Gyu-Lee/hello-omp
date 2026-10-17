// Read-only freshness report of a published project map.
// Usage: bun status.ts --project <root> --map <map-rel> [--out <file>]
// Compares the scope inputs recorded in sources.json with the working tree and every recorded published file with the disk.
// Prints JSON; --out additionally writes it to a new file (exclusive create). Nothing else is written.
// Only bad arguments or an unreadable map directory exit 1. A missing, legacy, foreign or invalid sources.json, an invalid
// scope or a missing sibling repository are reported in problems[] with fresh: false and exit 0.
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { AssertNoLinks, GetEntry, ParseArguments, RunCli, Sha256File, WriteJson } from "./lib/files.ts";
import { CompareInputs, ComputeInputs, ScopeForMap } from "./lib/inputs.ts";
import type { Input, InputDifference } from "./lib/inputs.ts";
import { ResolveMap } from "./lib/location.ts";
import type { MapLocation } from "./lib/location.ts";
import { CollectPublishedFiles, HasTemplateMarker, IsManifest, MANIFEST_FILE, MANIFEST_SCHEMA, ParseManifest } from "./lib/manifest.ts";
import type { Manifest } from "./lib/manifest.ts";

const STATUS_SCHEMA = "project-map/status-1";
const NOTE = "fingerprints only: fresh means no recorded input or published file changed and nothing is reported in problems; it is not a check that the map is semantically correct";

function Describe(error: unknown): string
{
    return error instanceof Error ? error.message : String(error);
}

// Reads and validates sources.json; returns the manifest or the reason it cannot be used.
async function LoadManifest(location: MapLocation): Promise<{ manifest: Manifest | null; problem: string | null }>
{
    const path = join(location.mapDirectory, MANIFEST_FILE);
    const entry = await GetEntry(path);

    if (entry === null)
    {
        if (await HasTemplateMarker(location.mapDirectory))
        {
            return { manifest: null, problem: "sources.json is missing although project-map built this map (index.html carries the project-map template marker); restore it from version control or the last published copy, do not adopt the map. If it cannot be restored, the next publish starts the history over and needs a finalize summary for every view and a media.json entry for every media file" };
        }

        return { manifest: null, problem: "no sources.json: this map has not been published with project-map yet" };
    }

    if (!entry.isFile())
    {
        return { manifest: null, problem: "sources.json is not a regular file (links are not followed)" };
    }

    let parsed: unknown;

    try
    {
        parsed = JSON.parse(await readFile(path, "utf8"));
    }
    catch (error)
    {
        return { manifest: null, problem: `sources.json cannot be read as JSON: ${Describe(error)}` };
    }

    if (!IsManifest(parsed))
    {
        if (await HasTemplateMarker(location.mapDirectory))
        {
            return { manifest: null, problem: `sources.json was replaced by another format although project-map built this map (index.html carries the project-map template marker); restore the ${MANIFEST_SCHEMA} manifest from version control or the last published copy, do not adopt the map. If it cannot be restored, the next publish starts the history over and needs a finalize summary for every view and a media.json entry for every media file` };
        }

        return { manifest: null, problem: `sources.json is not a ${MANIFEST_SCHEMA} manifest (a legacy or foreign format); publish with project-map to replace it` };
    }

    try
    {
        const manifest = ParseManifest(parsed);

        if (manifest.map !== location.mapRelative)
        {
            return { manifest: null, problem: `sources.json records map "${manifest.map}" but --map is "${location.mapRelative}"` };
        }

        return { manifest, problem: null };
    }
    catch (error)
    {
        return { manifest: null, problem: `sources.json is not valid: ${Describe(error)}` };
    }
}

async function CheckPublished(location: MapLocation, manifest: Manifest, problems: string[]): Promise<{ checked: number; missing: string[]; changed: string[] }>
{
    const missing: string[] = [];
    const changed: string[] = [];
    const records = CollectPublishedFiles(manifest);

    for (const record of records)
    {
        const path = join(location.projectRoot, ...record.path.split("/"));

        try
        {
            await AssertNoLinks(location.mapDirectory, path, record.path);
            const entry = await GetEntry(path);

            if (entry === null)
            {
                missing.push(record.path);
            }
            else if (!entry.isFile() || await Sha256File(path) !== record.sha256)
            {
                changed.push(record.path);
            }
        }
        catch (error)
        {
            changed.push(record.path);
            problems.push(`${record.path} could not be checked: ${Describe(error)}`);
        }
    }

    return { checked: records.length, missing, changed };
}

async function Main(): Promise<void>
{
    const args = ParseArguments(Bun.argv.slice(2), ["project", "map"], ["out"]);
    const location = await ResolveMap(args.project, args.map);
    const mapEntry = await GetEntry(location.mapDirectory);

    if (mapEntry !== null && !mapEntry.isDirectory())
    {
        throw new Error(`map path exists and is not a directory: ${location.mapDirectory}`);
    }

    const checkedAt = new Date().toISOString();
    const problems: string[] = [];
    const { manifest, problem } = await LoadManifest(location);
    let result: Record<string, unknown>;

    if (manifest === null)
    {
        problems.push(problem ?? "sources.json cannot be used");
        result = { schema: STATUS_SCHEMA, checkedAt, map: location.mapRelative, manifest: null, inputs: null, unreconciled: [], published: null, problems, fresh: false, note: NOTE };
    }
    else
    {
        let current: { inputs: Input[]; snapshot: string } | null = null;

        try
        {
            current = await ComputeInputs(location.projectRoot, ScopeForMap(manifest.scope, location.mapRelative));
        }
        catch (error)
        {
            problems.push(`the scope inputs could not be recomputed: ${Describe(error)}`);
        }

        const difference: InputDifference = current === null ? { changed: [], added: [], removed: [] } : CompareInputs(manifest.inputs, current.inputs);
        const published = await CheckPublished(location, manifest, problems);
        const lastUpdate = manifest.updates.at(-1);
        const isUnchanged = difference.changed.length + difference.added.length + difference.removed.length + published.missing.length + published.changed.length === 0;

        result = {
            schema: STATUS_SCHEMA,
            checkedAt,
            map: location.mapRelative,
            manifest: {
                path: `${location.mapRelative}/${MANIFEST_FILE}`,
                project: manifest.project.name,
                snapshot: manifest.snapshot,
                basis: manifest.basis,
                lastUpdate: lastUpdate === undefined ? null : { number: lastUpdate.number, id: lastUpdate.id, date: lastUpdate.date }
            },
            inputs: { recorded: manifest.inputs.length, current: current?.inputs.length ?? null, snapshotNow: current?.snapshot ?? null, ...difference },
            unreconciled: manifest.unreconciled,
            published,
            problems,
            fresh: isUnchanged && problems.length === 0,
            note: NOTE
        };
    }

    if (args.out !== undefined)
    {
        await WriteJson(resolve(args.out), result, "wx");
    }

    console.log(JSON.stringify(result, null, 2));
}

await RunCli(Main);
