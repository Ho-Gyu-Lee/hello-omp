import { cp, lstat, mkdir, mkdtemp, readdir, realpath, rename, rmdir } from "node:fs/promises";
import { basename, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const OS_METADATA_PATTERN = /^(?:\.DS_Store|desktop\.ini|Thumbs\.db|\._.*)$/i;

async function GetEntry(path: string)
{
    try
    {
        return await lstat(path);
    }
    catch (error)
    {
        if ((error as NodeJS.ErrnoException).code === "ENOENT")
        {
            return null;
        }

        throw error;
    }
}

function IsWithin(path: string, root: string): boolean
{
    const child = relative(root, path);
    return child === "" || (child !== ".." && !child.startsWith(`..${sep}`) && !isAbsolute(child));
}

async function ReadTree(root: string, source: boolean): Promise<string>
{
    const entries: [string, string, string][] = [];

    async function Visit(directory: string): Promise<void>
    {
        for (const name of (await readdir(directory)).sort())
        {
            if (OS_METADATA_PATTERN.test(name))
            {
                continue;
            }

            const path = join(directory, name);
            const entry = await lstat(path);
            const key = relative(root, path);

            if (entry.isDirectory())
            {
                entries.push([key, "directory", ""]);
                await Visit(path);
            }
            else if (entry.isFile())
            {
                const hash = new Bun.CryptoHasher("sha256").update(await Bun.file(path).arrayBuffer()).digest("hex");
                entries.push([key, "file", hash]);
            }
            else
            {
                if (source)
                {
                    throw new Error(`unsupported source entry (links are not followed): ${path}`);
                }

                entries.push([key, "other", ""]);
            }
        }
    }

    await Visit(root);
    return JSON.stringify(entries);
}

const checkOnly = process.argv[2] === "--check";
const configArgument = process.argv[checkOnly ? 3 : 2];

if (!configArgument)
{
    console.error("Usage: bun scripts/deploy-skills.ts [--check] <omp-config-directory>");
    process.exit(2);
}

try
{
    const configDir = await realpath(resolve(configArgument));
    const sourceRoot = await realpath(fileURLToPath(new URL("../skills", import.meta.url)));
    const okfSource = await realpath(fileURLToPath(new URL("../okf", import.meta.url)));
    const okfDestination = join(configDir, "okf");
    const okfTarget = await GetEntry(okfDestination) ? await realpath(okfDestination) : okfDestination;

    if (IsWithin(okfTarget, okfSource) || IsWithin(okfSource, okfTarget))
    {
        throw new Error("source and destination OKF directories must not overlap");
    }

    const skillsRoot = join(configDir, "skills");

    if (IsWithin(skillsRoot, sourceRoot) || IsWithin(sourceRoot, skillsRoot))
    {
        throw new Error("source and destination skills directories must not overlap");
    }

    const skillsEntry = await GetEntry(skillsRoot);

    if (skillsEntry && !skillsEntry.isDirectory())
    {
        throw new Error(`refusing linked or non-directory skills root: ${skillsRoot}`);
    }

    if (!checkOnly)
    {
        await mkdir(skillsRoot, { recursive: true });
    }

    for (const name of (await readdir(sourceRoot)).sort())
    {
        if (OS_METADATA_PATTERN.test(name))
        {
            continue;
        }

        const source = join(sourceRoot, name);
        const sourceEntry = await lstat(source);

        if (!sourceEntry.isDirectory() || !(await GetEntry(join(source, "SKILL.md")))?.isFile())
        {
            throw new Error(`expected a real skill directory with SKILL.md: ${source}`);
        }

        const destination = join(skillsRoot, name);
        const destinationEntry = await GetEntry(destination);

        if (destinationEntry && !destinationEntry.isDirectory())
        {
            throw new Error(`refusing linked or non-directory skill: ${destination}`);
        }

        if (checkOnly)
        {
            continue;
        }

        const sourceTree = await ReadTree(source, true);

        if (destinationEntry && sourceTree === await ReadTree(destination, false))
        {
            console.log(`  unchanged skill: ${name}`);
            continue;
        }

        const stageRoot = await mkdtemp(join(configDir, ".skill-stage-"));
        const staged = join(stageRoot, name);
        let backup: string | undefined;

        try
        {
            await cp(source, staged, { recursive: true, force: false, errorOnExist: true, filter: path => !OS_METADATA_PATTERN.test(basename(path)) });

            if (destinationEntry)
            {
                const backupRoot = await mkdtemp(join(configDir, ".skill-backup-"));
                const previous = join(backupRoot, name);
                await rename(destination, previous);
                backup = previous;
                console.log(`  preserved previous skill: ${backup}`);
            }

            await rename(staged, destination);
        }
        catch (error)
        {
            let previousState = backup ? `previous skill retained at ${backup}` : "previous skill was not moved";

            try
            {
                if (backup && !(await GetEntry(destination)))
                {
                    await rename(backup, destination);
                    previousState = `previous skill restored at ${destination}`;
                }
            }
            catch (restoreError)
            {
                throw new AggregateError([error, restoreError], `skill deployment and restoration failed; staging retained at ${stageRoot}; previous skill backup: ${backup}; active path: ${destination}`);
            }

            throw new Error(`skill deployment failed; staging retained at ${stageRoot}; ${previousState}`, { cause: error });
        }

        await rmdir(stageRoot);
        console.log(`  deployed skill: ${name}`);
    }
}
catch (error)
{
    console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
    console.error(error);
    process.exit(1);
}
