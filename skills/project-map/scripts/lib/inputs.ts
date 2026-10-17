// Freshness inputs of a project map: which files the map was built from and their fingerprints.
// Shared by build.ts (records them), publish.ts (writes them to the manifest) and status.ts (compares them).
import { isUtf8 } from "node:buffer";
import { readFile, realpath } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { AssertNoLinks, CompareText, FoldName, GetEntry, IsInside, IsWithin, MapLimit, RelativePosix, SamePath, Sha256Hex } from "./files.ts";

export interface Input
{
    path: string;
    mode: "sha256-text-lf" | "sha256-bytes";
    sha256: string;
}

export interface Scope
{
    include: string[];
    exclude: string[];
    // project-relative map directory whose files are never inputs (set by ScopeForMap)
    mapDirectory?: string;
}

export interface InputDifference
{
    changed: string[];
    added: string[];
    removed: string[];
}

// Task work directories are never map inputs.
const ALWAYS_EXCLUDE = ["**/.omp-artifacts/**"];
const GLOB_CHARS = /[*?[\]{}]/;
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;
const PARENT_IN_GLOB = /(?:^|[/{,(|])\.\.(?:$|[/},)|])/;
const BINARY_PROBE_BYTES = 8000;
const HASH_CONCURRENCY = 32;

// Every git call runs without repository-controlled command execution: a committed config could name an fsmonitor
// command, and a bare repository embedded in the tree could be picked up implicitly.
const GIT_HARDENING = ["-c", "core.fsmonitor=false", "-c", "safe.bareRepository=explicit"];

// The map directory holds the built entry, which embeds the snapshot; it can never be an input of that snapshot. It is not an
// exclude glob: git lists tracked files in the index spelling, which on Windows and macOS can differ in case or Unicode form
// from the on-disk spelling --map has to use, so ComputeInputs decides membership on real paths (see there).
export function ScopeForMap(scope: Scope, mapRelative: string): Scope
{
    return { include: scope.include, exclude: scope.exclude, mapDirectory: mapRelative.replace(/\/+$/, "") };
}

// First 12 hex characters of the sha256 over the sorted "path<TAB>mode<TAB>sha256<LF>" lines.
export function SnapshotId(inputs: Input[]): string
{
    const lines = [...inputs].sort((left, right) => CompareText(left.path, right.path)).map(input => `${input.path}\t${input.mode}\t${input.sha256}\n`);
    return Sha256Hex(lines.join("")).slice(0, 12);
}

export function CompareInputs(recorded: Input[], current: Input[]): InputDifference
{
    const previous = new Map(recorded.map(input => [input.path, input]));
    const present = new Map(current.map(input => [input.path, input]));
    const difference: InputDifference = { changed: [], added: [], removed: [] };

    for (const input of current)
    {
        const prior = previous.get(input.path);

        if (prior === undefined)
        {
            difference.added.push(input.path);
        }
        else if (prior.mode !== input.mode || prior.sha256 !== input.sha256)
        {
            difference.changed.push(input.path);
        }
    }

    for (const input of recorded)
    {
        if (!present.has(input.path))
        {
            difference.removed.push(input.path);
        }
    }

    return difference;
}

interface PatternShape
{
    pattern: string;
    segments: string[];
    isLiteral: boolean;
    hasBrace: boolean;
    // name of the sibling repository directory for "../<name>/..." patterns, otherwise null
    sibling: string | null;
}

// Pure syntax check of one scope pattern: a project-relative POSIX glob with at most one leading "..", which must be
// followed by a literal sibling directory name. No absolute paths, backslashes, control characters or ".." elsewhere.
function ShapePattern(raw: unknown, label: string): PatternShape
{
    if (typeof raw !== "string")
    {
        throw new Error(`${label} must be a string`);
    }

    const pattern = raw.trim().replace(/^(?:\.\/)+/, "");

    if (pattern.length === 0 || pattern.includes("\\") || pattern.startsWith("/") || /^[A-Za-z]:/.test(pattern) || CONTROL_CHARS.test(pattern))
    {
        throw new Error(`${label} must be a project-relative POSIX glob: "${raw}"`);
    }

    const segments = pattern.split("/");
    const leading = segments[0] === ".." ? 1 : 0;

    if (leading === 1 && segments[1] === "..")
    {
        throw new Error(`${label} may start with at most one "..": "${raw}"`);
    }

    if (leading === 1 && (segments.length < 3 || segments[1].length === 0 || GLOB_CHARS.test(segments[1])))
    {
        throw new Error(`${label} reaches a sibling repository only as "../<sibling directory name>/<pattern>" with a literal name: "${raw}"`);
    }

    const rest = segments.slice(leading);

    if (rest.some(segment => segment === ".." || segment === "." || segment.length === 0) || PARENT_IN_GLOB.test(rest.join("/")))
    {
        throw new Error(`${label} must not contain "..", "." or empty path segments (a directory needs "/**"): "${raw}"`);
    }

    return { pattern, segments, isLiteral: !GLOB_CHARS.test(pattern), hasBrace: pattern.includes("{"), sibling: leading === 1 ? segments[1] : null };
}

// Problem text for a path recorded in build.json or sources.json, or null when it is a well-formed project-relative
// POSIX path (one leading "../<sibling>/" is allowed for inputs, never for published files).
export function RecordedPathProblem(path: unknown, allowSibling: boolean): string | null
{
    if (typeof path !== "string" || path.length === 0)
    {
        return "path is not a non-empty string";
    }

    if (path.includes("\\") || path.startsWith("/") || /^[A-Za-z]:/.test(path) || CONTROL_CHARS.test(path))
    {
        return `path is not project-relative POSIX: "${path}"`;
    }

    const segments = path.split("/");
    const leading = allowSibling && segments[0] === ".." ? 1 : 0;

    if (leading === 1 && (segments.length < 3 || segments[1] === ".." || segments[1].length === 0))
    {
        return `path leaves the project in an unsupported way: "${path}"`;
    }

    if (segments.slice(leading).some(segment => segment === ".." || segment === "." || segment.length === 0))
    {
        return `path contains "..", "." or empty segments: "${path}"`;
    }

    return null;
}

// The directory git runs in. Never the project and never a directory the project controls: on Windows a bare "git" is looked up
// in the current directory before PATH (a git.bat, git.cmd or git.exe at the root of a repository would run instead of git).
const NEUTRAL_DIRECTORY = resolve(import.meta.dir, "..", "..");
let sGitExecutable: Promise<{ path: string; real: string }> | null = null;

// Resolves git once from PATH. The result must be an absolute path (PATH entries such as "." are refused).
async function FindGit(): Promise<{ path: string; real: string }>
{
    const found = Bun.which("git");

    if (found === null)
    {
        throw new Error("git was not found on PATH; install git and make sure it is on PATH");
    }

    if (!isAbsolute(found))
    {
        throw new Error(`git resolved to the relative path ${found}; remove relative entries (such as ".") from PATH`);
    }

    return { path: found, real: await realpath(found) };
}

// forbidden: real paths of the project and of every sibling repository the scope names. A git executable found inside one of
// them is refused (checked on every call, as the set grows while the scope is validated).
async function RunGit(directory: string, args: string[], forbidden: string[]): Promise<string>
{
    sGitExecutable ??= FindGit();
    const git = await sGitExecutable;
    const inside = forbidden.find(root => IsInside(git.real, root));

    if (inside !== undefined)
    {
        throw new Error(`the git executable on PATH (${git.real}) lies inside ${inside}, a directory this scope reads; refusing to run it. Put the real git ahead of it on PATH and remove directories of the project from PATH.`);
    }

    const child = Bun.spawn([git.path, ...GIT_HARDENING, "-C", directory, ...args], { cwd: NEUTRAL_DIRECTORY, stdout: "pipe", stderr: "pipe", env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" } });
    const [stdout, stderr, exitCode] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);

    if (exitCode !== 0)
    {
        throw new Error(`git ${args[0]} failed in ${directory}: ${stderr.trim()}`);
    }

    return stdout;
}

async function GitToplevel(directory: string, forbidden: string[]): Promise<string>
{
    // only the line end: a top-level path may itself end in whitespace on POSIX
    return resolve((await RunGit(directory, ["rev-parse", "--show-toplevel"], forbidden)).replace(/\r?\n$/, ""));
}

async function GitFiles(directory: string, forbidden: string[]): Promise<string[]>
{
    return (await RunGit(directory, ["ls-files", "-co", "--exclude-standard", "-z"], forbidden)).split("\0").filter(path => path.length > 0);
}

// The project root must be the top level of its git work tree (R in SKILL.md). The publish lock lives in <project>/.omp-artifacts
// and sources.json records the map relative to the project, so the same map reached from a subdirectory of the repository would
// get a second lock folder and a second name.
export async function AssertGitToplevel(projectRoot: string): Promise<void>
{
    const realRoot = await realpath(projectRoot);
    let toplevel: string;

    try
    {
        toplevel = await GitToplevel(projectRoot, [realRoot]);
    }
    catch (error)
    {
        throw new Error(`--project must be the top level of a git work tree: ${error instanceof Error ? error.message : String(error)}`);
    }

    if (!SamePath(await realpath(toplevel), realRoot))
    {
        throw new Error(`--project must be the top level of its git work tree (git reports ${toplevel}): ${projectRoot}`);
    }
}

// A sibling must be a real directory next to the project (not a link), outside the project root and not containing it. Only the
// file system is consulted here (lstat, realpath); no git runs before every named sibling has passed, because the git executable
// must be refused when it lies inside the project or inside any of them, including siblings named later in the scope.
async function CheckSibling(root: string, realRoot: string, name: string): Promise<{ directory: string; realDirectory: string }>
{
    const directory = resolve(root, "..", name);
    const entry = await GetEntry(directory);

    if (entry === null)
    {
        throw new Error(`scope names the sibling repository "${name}", which does not exist next to the project: ${directory}`);
    }

    if (entry.isSymbolicLink() || !entry.isDirectory())
    {
        throw new Error(`scope sibling "${name}" must be a real directory, not a link or file: ${directory}`);
    }

    const realDirectory = await realpath(directory);

    if (IsInside(realDirectory, realRoot) || IsInside(realRoot, realDirectory))
    {
        throw new Error(`scope sibling "${name}" is the project itself or contains it; use plain project-relative patterns for the project: ${directory}`);
    }

    return { directory, realDirectory };
}

// Validates include and exclude of a scope (build, publish and status all call this) and returns the sibling
// repositories it names as name -> directory. Throws on the first problem. Order: pattern syntax and the file-system checks of
// every named sibling first, then git for each sibling (rev-parse must report the sibling itself as its top level) with the
// real paths of the project and of all siblings as the places the git executable must not live.
export async function ValidateScope(projectRoot: string, scope: Scope): Promise<Map<string, string>>
{
    if (typeof scope !== "object" || scope === null || !Array.isArray(scope.include) || !Array.isArray(scope.exclude))
    {
        throw new Error("scope must be { include: string[], exclude: string[] }");
    }

    if (scope.include.length === 0)
    {
        throw new Error("scope.include must name at least one pattern");
    }

    const root = resolve(projectRoot);
    const realRoot = await realpath(root);
    const checked = new Map<string, { directory: string; realDirectory: string }>();
    const patterns = [...scope.include.map((pattern, index) => ({ pattern, label: `scope.include[${index}]` })), ...scope.exclude.map((pattern, index) => ({ pattern, label: `scope.exclude[${index}]` }))];

    for (const { pattern, label } of patterns)
    {
        const shape = ShapePattern(pattern, label);

        if (shape.sibling !== null && !checked.has(shape.sibling))
        {
            checked.set(shape.sibling, await CheckSibling(root, realRoot, shape.sibling));
        }
    }

    const forbidden = [realRoot, ...[...checked.values()].map(sibling => sibling.realDirectory)];
    const siblings = new Map<string, string>();

    for (const [name, { directory, realDirectory }] of checked)
    {
        const toplevel = await GitToplevel(directory, forbidden);

        if (!SamePath(await realpath(toplevel), realDirectory))
        {
            throw new Error(`scope sibling "${name}" is not the top level of a git repository (git reports ${toplevel}): ${directory}`);
        }

        siblings.set(name, directory);
    }

    return siblings;
}

// A directory can hold matches of the pattern when every directory segment is matched by a literal or a glob segment of the pattern.
function CouldReach(directory: string, shape: PatternShape): boolean
{
    if (shape.hasBrace)
    {
        return true;
    }

    const directorySegments = directory.split("/");

    for (let index = 0; index < directorySegments.length; index += 1)
    {
        const segment = shape.segments[index];

        if (segment === undefined)
        {
            return false;
        }

        if (segment === "**")
        {
            return true;
        }

        if (!GLOB_CHARS.test(segment) && segment !== directorySegments[index])
        {
            return false;
        }
    }

    return shape.segments.length > directorySegments.length;
}

// True when no directory from base (exclusive) down to `directory` is a link. Git for Windows lists the files behind a junction
// as if it were an ordinary directory, so the files git lists are checked as well; results are cached per directory.
function IsLinkFree(base: string, directory: string, cache: Map<string, Promise<boolean>>): Promise<boolean>
{
    if (SamePath(directory, base))
    {
        return Promise.resolve(true);
    }

    if (!IsWithin(directory, base))
    {
        return Promise.resolve(false);
    }

    const cached = cache.get(directory);

    if (cached !== undefined)
    {
        return cached;
    }

    const check = (async () =>
    {
        const entry = await GetEntry(directory);
        return entry !== null && !entry.isSymbolicLink() && await IsLinkFree(base, dirname(directory), cache);
    })();

    cache.set(directory, check);
    return check;
}

// Adds the files git lists for one repository, descending into submodules and nested repositories the patterns can reach.
// Files behind a link are skipped: links are never followed.
async function ListRepository(repositoryRoot: string, projectRoot: string, shapes: PatternShape[], candidates: Map<string, string>, forbidden: string[]): Promise<void>
{
    const links = new Map<string, Promise<boolean>>();
    const entries = await MapLimit(await GitFiles(repositoryRoot, forbidden), HASH_CONCURRENCY, async listed =>
    {
        const absolute = join(repositoryRoot, listed.endsWith("/") ? listed.slice(0, -1) : listed);
        return { absolute, stats: await GetEntry(absolute), isLinkFree: await IsLinkFree(repositoryRoot, dirname(absolute), links) };
    });

    for (const { absolute, stats, isLinkFree } of entries)
    {
        if (stats === null || !isLinkFree)
        {
            // tracked but deleted from the working tree, or behind a link: not an input
            continue;
        }

        if (stats.isDirectory())
        {
            // a submodule or a nested repository: git lists the directory itself, not its files
            const directory = RelativePosix(projectRoot, absolute);

            if (shapes.some(shape => CouldReach(directory, shape)) && await GetEntry(join(absolute, ".git")) !== null)
            {
                await ListRepository(absolute, projectRoot, shapes, candidates, forbidden);
            }

            continue;
        }

        if (stats.isFile())
        {
            candidates.set(RelativePosix(projectRoot, absolute), absolute);
        }
    }
}

// Removes CR from every CR LF pair; returns the input itself when it has none.
function NormalizeLineEndings(bytes: Uint8Array): Uint8Array
{
    let pairs = 0;

    for (let index = 0; index + 1 < bytes.length; index += 1)
    {
        if (bytes[index] === 0x0d && bytes[index + 1] === 0x0a)
        {
            pairs += 1;
        }
    }

    if (pairs === 0)
    {
        return bytes;
    }

    const normalized = new Uint8Array(bytes.length - pairs);
    let write = 0;

    for (let index = 0; index < bytes.length; index += 1)
    {
        if (bytes[index] === 0x0d && bytes[index + 1] === 0x0a)
        {
            continue;
        }

        normalized[write] = bytes[index];
        write += 1;
    }

    return normalized;
}

// A file is text when its first 8000 bytes hold no NUL (git's rule) and it is valid UTF-8; no git clean filter is applied.
async function HashFile(path: string, absolute: string): Promise<Input>
{
    const bytes = await readFile(absolute);
    const isText = !bytes.subarray(0, BINARY_PROBE_BYTES).includes(0) && isUtf8(bytes);

    if (isText)
    {
        return { path, mode: "sha256-text-lf", sha256: Sha256Hex(NormalizeLineEndings(bytes)) };
    }

    return { path, mode: "sha256-bytes", sha256: Sha256Hex(bytes) };
}

// Scope patterns are project-root-relative POSIX globs and may start with "../<sibling>/" (see ValidateScope). Candidates are
// the files `git ls-files -co --exclude-standard` lists in the project and in every sibling repository the scope names, plus
// include entries that name an existing file literally (so a git-ignored file the map depends on can still be declared).
// Symbolic links and junctions are never followed, also not on the way to a literal include file.
export async function ComputeInputs(projectRoot: string, scope: Scope): Promise<{ inputs: Input[]; snapshot: string }>
{
    const root = resolve(projectRoot);
    const siblings = await ValidateScope(root, scope);
    const shapes = scope.include.map((pattern, index) => ShapePattern(pattern, `scope.include[${index}]`));
    const include = shapes.map(shape => new Bun.Glob(shape.pattern));
    const exclude = [...ALWAYS_EXCLUDE, ...scope.exclude.map((pattern, index) => ShapePattern(pattern, `scope.exclude[${index}]`).pattern)].map(pattern => new Bun.Glob(pattern));
    const candidates = new Map<string, string>();

    const forbidden = [await realpath(root), ...await Promise.all([...siblings.values()].map(directory => realpath(directory)))];

    for (const repository of [root, ...siblings.values()])
    {
        await ListRepository(repository, root, shapes, candidates, forbidden);
    }

    for (const shape of shapes)
    {
        if (!shape.isLiteral || candidates.has(shape.pattern))
        {
            continue;
        }

        const absolute = resolve(root, ...shape.segments);
        const base = shape.sibling === null ? root : siblings.get(shape.sibling) as string;
        await AssertNoLinks(base, absolute, `scope.include "${shape.pattern}"`);

        if ((await GetEntry(absolute))?.isFile() === true)
        {
            candidates.set(shape.pattern, absolute);
        }
    }

    const scoped = [...candidates.keys()].filter(path => include.some(glob => glob.match(path)) && !exclude.some(glob => glob.match(path)));

    // Files of the map directory: the folded prefix preselects (git may spell the directory as in its index), the real path
    // decides, because FoldName is coarser than file-system equality (ß and ss are two different NTFS names).
    const isCaseInsensitive = process.platform === "win32" || process.platform === "darwin";
    const comparable = (path: string) => isCaseInsensitive ? FoldName(path) : path;
    const mapAbsolute = scope.mapDirectory === undefined ? null : join(root, scope.mapDirectory);
    const realMap = mapAbsolute === null || await GetEntry(mapAbsolute) === null ? null : await realpath(mapAbsolute);
    const mapPrefix = scope.mapDirectory === undefined ? "" : `${comparable(scope.mapDirectory)}/`;
    const isMapFile = await Promise.all(scoped.map(async path => realMap !== null && comparable(path).startsWith(mapPrefix) && IsInside(await realpath(candidates.get(path) as string), realMap)));
    const kept = scoped.filter((_, index) => !isMapFile[index]);
    const inputs = await MapLimit(kept.sort(CompareText), HASH_CONCURRENCY, path => HashFile(path, candidates.get(path) as string));

    return { inputs, snapshot: SnapshotId(inputs) };
}
