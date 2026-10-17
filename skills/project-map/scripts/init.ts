// Prepares a project-map work directory.
// Usage: bun init.ts --project <root> --map <map-rel> --work <root>/.omp-artifacts/<task-id> [--name <project name>]
//   before/  copy of the durable map directory; before.sha256.txt (next to it, so a map file named sha256.txt cannot collide) lists its hashes, empty when the map has no files yet
//   stage/   candidate map. Mode by what the map directory holds:
//              new     no files (the directory is absent or empty): the full examples/minimal scaffold
//              update  src/map.config.json exists: a full copy of the map
//              adopt   files but no src/map.config.json (a map made by another tool): a full copy plus only the scaffold's src/
//            and the skill fonts in stage/fonts in every mode
import { isUtf8 } from "node:buffer";
import { mkdir, readdir, readFile, rename, rmdir, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { CopyVerified, FormatHashLines, GetEntry, OS_METADATA_PATTERN, ParseArguments, RunCli, Sha256File, WalkFiles } from "./lib/files.ts";
import { ResolveMap, ResolveWork } from "./lib/location.ts";
import { MANIFEST_FILE, ReadManifestFile } from "./lib/manifest.ts";

const SKILL_ROOT = resolve(import.meta.dir, "..");
const SCAFFOLD_SOURCE_PREFIX = "src/";

interface ScaffoldTokens
{
    name: string;
    logo: string;
    today: string;
}

// Replacer functions, never replacement strings: "$&" and "$'" in a project name are not patterns.
function ReplaceTokens(text: string, tokens: ScaffoldTokens, isJson: boolean): string
{
    // JSON strings must stay valid whatever the project name contains.
    const name = isJson ? JSON.stringify(tokens.name).slice(1, -1) : tokens.name;
    const logo = isJson ? JSON.stringify(tokens.logo).slice(1, -1) : tokens.logo;

    return text.replaceAll("__PROJECT_NAME__", () => name).replaceAll("__PROJECT_LOGO__", () => logo).replaceAll("__TODAY__", () => tokens.today);
}

async function PlanScaffold(onlySource: boolean): Promise<string[]>
{
    const exampleRoot = join(SKILL_ROOT, "examples", "minimal");

    if (await GetEntry(exampleRoot) === null)
    {
        throw new Error(`scaffold missing: ${exampleRoot}`);
    }

    return (await WalkFiles(exampleRoot)).filter(path => !onlySource || path.startsWith(SCAFFOLD_SOURCE_PREFIX));
}

async function WriteScaffold(stage: string, paths: string[], tokens: ScaffoldTokens): Promise<void>
{
    const exampleRoot = join(SKILL_ROOT, "examples", "minimal");

    for (const path of paths)
    {
        const bytes = await readFile(join(exampleRoot, path));
        const destination = join(stage, path);
        await mkdir(dirname(destination), { recursive: true });

        if (!bytes.subarray(0, 8000).includes(0) && isUtf8(bytes))
        {
            await writeFile(destination, ReplaceTokens(bytes.toString("utf8"), tokens, path.endsWith(".json")), { flag: "wx" });
        }
        else
        {
            await writeFile(destination, bytes, { flag: "wx" });
        }
    }
}

async function CopyFonts(stage: string): Promise<{ name: string; replaced: boolean }[]>
{
    const source = join(SKILL_ROOT, "assets", "fonts");
    const copied: { name: string; replaced: boolean }[] = [];

    for (const name of (await readdir(source)).sort())
    {
        if (OS_METADATA_PATTERN.test(name))
        {
            continue;
        }

        const destination = join(stage, "fonts", name);
        const existing = await GetEntry(destination);

        if (existing !== null && !existing.isFile())
        {
            throw new Error(`stage/fonts/${name} exists and is not a file`);
        }

        const replaced = existing !== null && await Sha256File(destination) !== await Sha256File(join(source, name));
        await CopyVerified(join(source, name), destination, false);
        copied.push({ name, replaced });
    }

    return copied;
}

const MODE_NOTES: Record<string, string> = {
    new: "the map has no files yet: stage is the examples/minimal scaffold with the project name filled in; replace the example content",
    update: "the map has src/map.config.json: stage is a full copy of it; edit stage/src by field replacement",
    adopt: "the map has files but no src/map.config.json (made by another tool): stage keeps those files and only src/ is scaffolded; publish stops on views that have no matching finalize summary unless it is run with --adopt, which records them with receipt null"
};

async function Main(): Promise<void>
{
    const args = ParseArguments(Bun.argv.slice(2), ["project", "map", "work"], ["name"]);
    const location = await ResolveMap(args.project, args.map);
    const work = await ResolveWork(location, args.work);

    // stage/ is renamed into place last, so it exists only when init finished
    const present: string[] = [];

    for (const name of ["init.tmp", "before", "before.sha256.txt", "stage"])
    {
        if (await GetEntry(join(work, name)) !== null)
        {
            present.push(name);
        }
    }

    if (present.includes("stage") && !present.includes("init.tmp"))
    {
        throw new Error(`${work} is already initialised (it has stage/); use a new work directory for a new task`);
    }

    if (present.length > 0)
    {
        throw new Error(`an earlier init in ${work} did not finish (found ${present.join(", ")} but no complete stage/); it left only its own partial copy there, so run init again with a new --work directory`);
    }

    const mapEntry = await GetEntry(location.mapDirectory);

    if (mapEntry !== null && !mapEntry.isDirectory())
    {
        throw new Error(`map path exists and is not a directory: ${location.mapDirectory}`);
    }

    // an existing sources.json that publish would refuse (unparseable, another version, invalid) is reported now, before init
    // creates anything, so the repair happens before the work directory is made
    await ReadManifestFile(join(location.mapDirectory, MANIFEST_FILE), location.mapRelative, "init");

    // an existing but empty map directory is a new map; the walk refuses links inside the map
    const existing = mapEntry === null ? [] : await WalkFiles(location.mapDirectory);
    const mode = existing.length === 0 ? "new" : existing.includes("src/map.config.json") ? "update" : "adopt";
    const scaffoldPaths = mode === "update" ? [] : await PlanScaffold(mode === "adopt");
    const conflicts = scaffoldPaths.filter(path => existing.includes(path));

    if (conflicts.length > 0)
    {
        throw new Error(`the map has no src/map.config.json but already holds files at scaffold paths; move them away or add a map.config.json first (nothing was written):\n  ${conflicts.join("\n  ")}`);
    }

    const name = args.name ?? basename(location.projectRoot);
    const tokens: ScaffoldTokens = { name, logo: (Array.from(name)[0] ?? "P").toUpperCase(), today: new Date().toLocaleDateString("sv-SE") };
    const temporary = join(work, "init.tmp");
    const beforeTemporary = join(temporary, "before");
    const stageTemporary = join(temporary, "stage");
    await mkdir(work, { recursive: true });
    await mkdir(temporary);
    await mkdir(beforeTemporary);
    await mkdir(stageTemporary);

    const hashes = new Map<string, string>();

    for (const path of existing)
    {
        hashes.set(path, await CopyVerified(join(location.mapDirectory, path), join(beforeTemporary, path), true));
        await CopyVerified(join(location.mapDirectory, path), join(stageTemporary, path), true);
    }

    await WriteScaffold(stageTemporary, scaffoldPaths, tokens);

    const fonts = await CopyFonts(stageTemporary);
    await writeFile(join(temporary, "before.sha256.txt"), FormatHashLines(hashes), { flag: "wx" });

    // before.sha256.txt and before/ first, stage/ last: stage/ marks a finished init
    await rename(join(temporary, "before.sha256.txt"), join(work, "before.sha256.txt"));
    await rename(beforeTemporary, join(work, "before"));
    await rename(stageTemporary, join(work, "stage"));
    await rmdir(temporary);

    console.log(JSON.stringify({ mode, modeNote: MODE_NOTES[mode], map: location.mapRelative, work, before: hashes.size, scaffolded: scaffoldPaths, fonts }, null, 2));
}

await RunCli(Main);
