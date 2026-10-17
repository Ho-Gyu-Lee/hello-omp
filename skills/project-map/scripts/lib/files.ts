import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { copyFile, lstat, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import type { Stats } from "node:fs";
import { dirname, isAbsolute, join, relative, sep } from "node:path";

export const OS_METADATA_PATTERN = /^(?:\.DS_Store|desktop\.ini|Thumbs\.db|\._.*)$/i;

export function Sha256Hex(bytes: string | Uint8Array): string
{
    return createHash("sha256").update(bytes).digest("hex");
}

export async function Sha256File(path: string): Promise<string>
{
    return Sha256Hex(await readFile(path));
}

export function ToPosix(path: string): string
{
    return path.split("\\").join("/");
}

export function RelativePosix(from: string, to: string): string
{
    return ToPosix(relative(from, to));
}

export function IsWithin(path: string, root: string): boolean
{
    const child = relative(root, path);
    return child === "" || (child !== ".." && !child.startsWith(`..${sep}`) && !isAbsolute(child));
}

// IsWithin for real paths: case-insensitive on Windows and macOS, where one directory has several spellings.
export function IsInside(path: string, root: string): boolean
{
    const isCaseInsensitive = process.platform === "win32" || process.platform === "darwin";
    return isCaseInsensitive ? IsWithin(path.toLowerCase(), root.toLowerCase()) : IsWithin(path, root);
}

// lstat that maps a missing path to null; links are reported as links and never followed.
export async function GetEntry(path: string): Promise<Stats | null>
{
    try
    {
        return await lstat(path);
    }
    catch (error)
    {
        if (error instanceof Error && "code" in error && (error.code === "ENOENT" || error.code === "ENOTDIR"))
        {
            return null;
        }

        throw error;
    }
}

// Lists the regular files below root as sorted POSIX paths relative to root. Links and special files are rejected, never followed.
export async function WalkFiles(root: string): Promise<string[]>
{
    const files: string[] = [];

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

            if (entry.isDirectory())
            {
                await Visit(path);
            }
            else if (entry.isFile())
            {
                files.push(RelativePosix(root, path));
            }
            else
            {
                throw new Error(`unsupported entry (links are not followed): ${path}`);
            }
        }
    }

    await Visit(root);
    return files.sort();
}

export async function ReadJson<T>(path: string): Promise<T>
{
    return JSON.parse(await readFile(path, "utf8")) as T;
}

export async function WriteJson(path: string, value: unknown, flag: "w" | "wx"): Promise<void>
{
    await writeFile(path, JSON.stringify(value, null, 2) + "\n", { flag });
}

// Runs fn over items with at most limit calls in flight; results keep the item order.
export async function MapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]>
{
    const results: R[] = new Array(items.length);
    let next = 0;

    async function Worker(): Promise<void>
    {
        while (next < items.length)
        {
            const index = next;
            next += 1;
            results[index] = await fn(items[index]);
        }
    }

    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => Worker()));
    return results;
}

// Copies one file and re-hashes the destination. An exclusive copy refuses to replace an existing file.
// With expectedSha256 the source must have exactly those bytes before it is copied, and the copy must too.
export async function CopyVerified(from: string, to: string, exclusive: boolean, expectedSha256?: string): Promise<string>
{
    const expected = await Sha256File(from);

    if (expectedSha256 !== undefined && expected !== expectedSha256)
    {
        throw new Error(`${from} changed while publishing (expected ${expectedSha256.slice(0, 12)}, found ${expected.slice(0, 12)}); nothing more was copied`);
    }

    await mkdir(dirname(to), { recursive: true });
    await copyFile(from, to, exclusive ? constants.COPYFILE_EXCL : 0);
    const actual = await Sha256File(to);

    if (actual !== expected)
    {
        throw new Error(`copied bytes differ for ${to}`);
    }

    return actual;
}

// Hashes every stage file once; callers use the same hashes for the stageSha256 check and for copying, so no file can change in between unnoticed.
export async function HashStageFiles(stage: string): Promise<{ path: string; sha256: string }[]>
{
    const entries: { path: string; sha256: string }[] = [];

    for (const path of await WalkFiles(stage))
    {
        entries.push({ path, sha256: await Sha256File(join(stage, path)) });
    }

    return entries;
}

// Code-unit order, never locale order: hashes over sorted lines must be the same on every machine.
export function CompareText(left: string, right: string): number
{
    if (left < right)
    {
        return -1;
    }

    return left > right ? 1 : 0;
}

// stageSha256: sha256 over the lines "<stage-relative POSIX path>\t<raw sha256>\n", sorted by path, for every stage file
// except the root index.html (bound by stageIndexSha256) and the root sources.json (written by publish only).
export function DigestStage(entries: { path: string; sha256: string }[]): string
{
    const lines = entries.filter(entry => entry.path !== "index.html" && entry.path !== "sources.json").sort((left, right) => CompareText(left.path, right.path)).map(entry => `${entry.path}\t${entry.sha256}\n`);
    return Sha256Hex(lines.join(""));
}

export async function HashStage(stage: string): Promise<string>
{
    return DigestStage(await HashStageFiles(stage));
}

// Case-insensitive on Windows and macOS, where one directory has several spellings.
export function SamePath(left: string, right: string): boolean
{
    const isCaseInsensitive = process.platform === "win32" || process.platform === "darwin";
    return isCaseInsensitive ? left.toLowerCase() === right.toLowerCase() : left === right;
}

// Refuses links (symbolic links and Windows junctions): lstat every existing segment from base (exclusive) down to target.
// A segment that does not exist ends the walk: nothing below it can be a link. target must be inside base.
export async function AssertNoLinks(base: string, target: string, label: string): Promise<void>
{
    if (!IsWithin(target, base))
    {
        throw new Error(`${label} leaves ${base}: ${target}`);
    }

    let current = base;

    for (const segment of relative(base, target).split(sep).filter(part => part.length > 0))
    {
        current = join(current, segment);
        const entry = await GetEntry(current);

        if (entry === null)
        {
            return;
        }

        if (entry.isSymbolicLink())
        {
            throw new Error(`${label} passes through a link (links are never followed): ${current}`);
        }
    }
}

// "<sha256>  ./<relative path>" per line, raw bytes; the format of W/before.sha256.txt.
export function FormatHashLines(hashes: Map<string, string>): string
{
    return [...hashes.keys()].sort().map(path => `${hashes.get(path)}  ./${path}\n`).join("");
}

export function ParseHashLines(text: string): Map<string, string>
{
    const hashes = new Map<string, string>();

    for (const line of text.split(/\r?\n/))
    {
        const match = /^([0-9a-f]{64})\s+\.\/(.+)$/.exec(line.trim());

        if (match !== null)
        {
            hashes.set(match[2], match[1]);
        }
    }

    return hashes;
}

// Parses "--name value" pairs and bare "--flag" switches. Unknown names, repeated names, and missing required names are errors.
// A switch is stored as "true".
export function ParseArguments(argv: string[], required: string[], optional: string[], switches: string[] = []): Record<string, string>
{
    const values: Record<string, string> = {};

    for (let index = 0; index < argv.length; index += 1)
    {
        const name = argv[index];
        const key = name.slice(2);

        if (!name.startsWith("--") || ![...required, ...optional, ...switches].includes(key))
        {
            throw new Error(`unknown argument: ${name}`);
        }

        if (values[key] !== undefined)
        {
            throw new Error(`${name} given twice`);
        }

        if (switches.includes(key))
        {
            values[key] = "true";
            continue;
        }

        const value = argv[index + 1];

        if (value === undefined || value.startsWith("--"))
        {
            throw new Error(`${name} needs a value`);
        }

        values[key] = value;
        index += 1;
    }

    for (const name of required)
    {
        if (values[name] === undefined)
        {
            throw new Error(`--${name} is required`);
        }
    }

    return values;
}

export async function RunCli(main: () => Promise<void>): Promise<void>
{
    try
    {
        await main();
    }
    catch (error)
    {
        console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
}
