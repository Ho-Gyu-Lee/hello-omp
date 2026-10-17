// Resolves and validates the three locations every script works with: project root, durable map directory, work directory.
// Links (symbolic links and Windows junctions) are never followed: every existing path segment from the project root down to
// the map directory (and to the work directory when it lies inside the project) is lstat-checked and a link is refused.
import { readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { AssertNoLinks, FoldName, GetEntry, IsWithin, ToPosix } from "./files.ts";
import { AssertGitToplevel } from "./inputs.ts";

export interface MapLocation
{
    projectRoot: string;
    // project-relative POSIX path of the durable map directory, no leading "./" and no trailing "/"
    mapRelative: string;
    mapDirectory: string;
}

export async function ResolveMap(project: string, map: string): Promise<MapLocation>
{
    const projectRoot = resolve(project);
    const projectEntry = await GetEntry(projectRoot);

    if (projectEntry === null || !projectEntry.isDirectory())
    {
        throw new Error(`project root is not a directory: ${projectRoot}`);
    }

    await AssertGitToplevel(projectRoot);

    const mapRelative = ToPosix(map).replace(/^(?:\.\/)+/, "").replace(/\/+$/, "");
    const segments = mapRelative.split("/");

    if (mapRelative.length === 0 || mapRelative.startsWith("/") || /^[A-Za-z]:/.test(mapRelative) || segments.some(segment => segment === ".." || segment === "." || segment === ""))
    {
        throw new Error(`--map must be a project-relative path without ".." segments: "${map}"`);
    }

    // Windows tools drop a trailing dot or space and read ":" as an alternate data stream, so such a segment opens another entry
    // than it shows ("<name>::$INDEX_ALLOCATION" is the directory <name> itself).
    if (segments.some(segment => /[. ]$/.test(segment) || segment.includes(":")))
    {
        throw new Error(`--map segments must not end with "." or " " or contain ":" (Windows does not keep them as written): "${map}"`);
    }

    if ([".omp-artifacts", ".git"].includes(FoldName(segments[0])))
    {
        throw new Error(`--map must not be inside ${segments[0]}: "${map}"`);
    }

    const mapDirectory = join(projectRoot, ...segments);

    if (!IsWithin(mapDirectory, projectRoot))
    {
        throw new Error(`--map leaves the project root: "${map}"`);
    }

    await AssertNoLinks(projectRoot, mapDirectory, `--map ${mapRelative}`);
    await AssertDiskSpelling(projectRoot, segments, map);

    // A map below a nested repository, submodule or worktree is also reachable as --project <that root>, which is a git top level
    // too and would lock in its own .omp-artifacts; only that root is accepted.
    let ancestor = projectRoot;

    for (const segment of segments.slice(0, -1))
    {
        ancestor = join(ancestor, segment);

        if (await GetEntry(ancestor) === null)
        {
            break;
        }

        if (await GetEntry(join(ancestor, ".git")) !== null)
        {
            throw new Error(`--map "${map}" lies inside the nested repository ${ancestor}; use that directory as --project`);
        }
    }

    return { projectRoot, mapRelative, mapDirectory };
}

// Every existing segment must be spelled as its directory entry. Windows and macOS also open a directory by another letter case
// and Windows by its 8.3 short name; such a spelling would give one map a second identity in the publish lock and in
// sources.json. NFC and NFD of one name count as the same spelling (git on macOS lists NFC). Segments that do not exist yet
// cannot be checked; the publish lock folds their case instead (lock.ts).
async function AssertDiskSpelling(projectRoot: string, segments: string[], map: string): Promise<void>
{
    let parent = projectRoot;

    for (const segment of segments)
    {
        const current = join(parent, segment);

        if (await GetEntry(current) === null)
        {
            return;
        }

        const names = await readdir(parent);

        if (!names.some(name => name.normalize("NFC") === segment.normalize("NFC")))
        {
            const onDisk = names.find(name => FoldName(name) === FoldName(segment));
            throw new Error(`--map "${map}" reaches the existing ${current} under another spelling; write the path as it is on disk${onDisk === undefined ? "" : ` ("${onDisk}")`}`);
        }

        parent = current;
    }
}

// The work directory is normally <project>/.omp-artifacts/<task-id>/ (always excluded from the freshness inputs); it only must
// not overlap the map directory and must not be reached through a link.
export async function ResolveWork(location: MapLocation, work: string): Promise<string>
{
    const workDirectory = resolve(work);

    if (IsWithin(workDirectory, location.mapDirectory) || IsWithin(location.mapDirectory, workDirectory))
    {
        throw new Error(`--work must not contain or lie inside the map directory ${location.mapDirectory}: ${workDirectory}`);
    }

    if (IsWithin(workDirectory, location.projectRoot))
    {
        await AssertNoLinks(location.projectRoot, workDirectory, "--work");
    }
    else if ((await GetEntry(workDirectory))?.isSymbolicLink() === true)
    {
        throw new Error(`--work is a link (links are never followed): ${workDirectory}`);
    }

    return workDirectory;
}
