// Resolves and validates the three locations every script works with: project root, durable map directory, work directory.
// Links (symbolic links and Windows junctions) are never followed: every existing path segment from the project root down to
// the map directory (and to the work directory when it lies inside the project) is lstat-checked and a link is refused.
import { join, resolve } from "node:path";
import { AssertNoLinks, GetEntry, IsWithin, ToPosix } from "./files.ts";

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

    const mapRelative = ToPosix(map).replace(/^(?:\.\/)+/, "").replace(/\/+$/, "");
    const segments = mapRelative.split("/");

    if (mapRelative.length === 0 || mapRelative.startsWith("/") || /^[A-Za-z]:/.test(mapRelative) || segments.some(segment => segment === ".." || segment === "." || segment === ""))
    {
        throw new Error(`--map must be a project-relative path without ".." segments: "${map}"`);
    }

    if (segments[0] === ".omp-artifacts" || segments[0] === ".git")
    {
        throw new Error(`--map must not be inside ${segments[0]}: "${map}"`);
    }

    const mapDirectory = join(projectRoot, ...segments);

    if (!IsWithin(mapDirectory, projectRoot))
    {
        throw new Error(`--map leaves the project root: "${map}"`);
    }

    await AssertNoLinks(projectRoot, mapDirectory, `--map ${mapRelative}`);

    return { projectRoot, mapRelative, mapDirectory };
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
