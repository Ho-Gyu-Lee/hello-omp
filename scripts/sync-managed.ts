import { lstat, mkdir, readdir, realpath, rename } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Final setup step. Applies removals from the repository to the config dir, verifies the applied settings and records what setup deployed.
// Only items recorded as deployed by an earlier setup are retired. Files are moved aside, never deleted, and only when unchanged since deployment.

const OS_METADATA_PATTERN = /^(?:\.DS_Store|desktop\.ini|Thumbs\.db|\._.*)$/i;
const FORMAT_VERSION = 1;
const RECORD_NAME = ".hello-omp-managed.json";
// `source` is the repository directory; deployed files live in <configdir>/<kind>.
const FILE_KINDS = [
    { kind: "extensions", source: "extensions", pattern: /\.(?:js|ts)$/ },
    { kind: "agents", source: "agents", pattern: /\.md$/ },
    { kind: "commands", source: "commands", pattern: /\.md$/ },
    { kind: "rules", source: "ttsr", pattern: /\.md$/ },
] as const;

type FileKind = (typeof FILE_KINDS)[number]["kind"];

type ManagedRecord = {
    version: number;
    settings: Record<string, string>;
    extensions: Record<string, string>;
    agents: Record<string, string>;
    commands: Record<string, string>;
    rules: Record<string, string>;
    skills: Record<string, string>;
};

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

async function HashFile(path: string): Promise<string>
{
    return new Bun.CryptoHasher("sha256").update(await Bun.file(path).arrayBuffer()).digest("hex");
}

// Hash of a directory tree (relative paths, entry kinds and file hashes). Links are recorded, not followed, so a linked tree never matches.
async function HashTree(root: string): Promise<string>
{
    const entries: string[] = [];

    async function Visit(directory: string, prefix: string): Promise<void>
    {
        for (const name of (await readdir(directory)).sort())
        {
            if (OS_METADATA_PATTERN.test(name))
            {
                continue;
            }

            const path = join(directory, name);
            const rel = prefix === "" ? name : `${prefix}/${name}`;
            const entry = await lstat(path);

            if (entry.isDirectory())
            {
                entries.push(`${rel}/`);
                await Visit(path, rel);
            }
            else if (entry.isFile())
            {
                entries.push(`${rel} ${await HashFile(path)}`);
            }
            else
            {
                entries.push(`${rel} link`);
            }
        }
    }

    await Visit(root, "");
    return new Bun.CryptoHasher("sha256").update(entries.join("\n")).digest("hex");
}

// Same format as setup: "<key><whitespace><value>", blank lines and # comments ignored.
async function ReadSettings(path: string): Promise<Map<string, string>>
{
    const settings = new Map<string, string>();

    for (const line of (await Bun.file(path).text()).split(/\r?\n/))
    {
        const trimmed = line.trim();

        if (trimmed === "" || trimmed.startsWith("#"))
        {
            continue;
        }

        const match = trimmed.match(/^(\S+)\s+(.*)$/);

        if (match)
        {
            settings.set(match[1], match[2]);
        }
    }

    return settings;
}

async function ListRepoFiles(directory: string, pattern: RegExp): Promise<string[]>
{
    if (!(await GetEntry(directory))?.isDirectory())
    {
        return [];
    }

    const names: string[] = [];

    for (const name of (await readdir(directory)).sort())
    {
        if (pattern.test(name) && (await lstat(join(directory, name))).isFile())
        {
            names.push(name);
        }
    }

    return names;
}

async function ListRepoSkills(directory: string): Promise<string[]>
{
    const names: string[] = [];

    for (const name of (await readdir(directory)).sort())
    {
        if (!OS_METADATA_PATTERN.test(name) && (await GetEntry(join(directory, name, "SKILL.md")))?.isFile())
        {
            names.push(name);
        }
    }

    return names;
}

// `omp config list --json` returns typed values; settings.conf holds the raw text passed to `omp config set`.
function IsSameSetting(raw: string, value: unknown): boolean
{
    if (typeof value === "string")
    {
        return value === raw;
    }

    try
    {
        return Bun.deepEquals(JSON.parse(raw), value);
    }
    catch
    {
        return false;
    }
}

function RunOmp(ompPath: string, args: string[]): string
{
    const result = Bun.spawnSync({ cmd: [ompPath, ...args], stdout: "pipe", stderr: "pipe" });

    if (result.exitCode !== 0)
    {
        throw new Error(`omp ${args.join(" ")} failed: ${result.stderr.toString().trim() || result.stdout.toString().trim()}`);
    }

    return result.stdout.toString();
}

async function LoadRecord(path: string): Promise<ManagedRecord | null>
{
    if (!(await GetEntry(path)))
    {
        return null;
    }

    const recovery = "move it aside to record the current deployment again (removals since the last setup will then not be applied)";
    let record: Record<string, unknown>;

    try
    {
        record = JSON.parse(await Bun.file(path).text()) as Record<string, unknown>;
    }
    catch (error)
    {
        throw new Error(`cannot read ${path} (${error instanceof Error ? error.message : String(error)}); ${recovery}`);
    }

    // Records written before TTSR rules were managed lack the key; nothing was deployed under it then. Other shapes fail the check below.
    if (record !== null && typeof record === "object" && !Array.isArray(record) && !("rules" in record))
    {
        record.rules = {};
    }

    if (["settings", ...FILE_KINDS.map(item => item.kind), "skills"].some(kind => typeof record[kind] !== "object" || record[kind] === null || Array.isArray(record[kind])))
    {
        throw new Error(`unexpected content in ${path}; ${recovery}`);
    }

    return record as unknown as ManagedRecord;
}

// A recorded name is still shipped when it resolves to the same file as the repository name that differs only in case or Unicode normalization
// (case-insensitive APFS/NTFS). On a case-sensitive volume they are different files, and the old one is retired like any removed item.
async function IsShippedUnderOtherName(deployed: string, deployedDir: string, recordedName: string, repoNames: string[]): Promise<boolean>
{
    const recordedKey = recordedName.normalize("NFC").toLowerCase();
    const repoName = repoNames.find(name => name.normalize("NFC").toLowerCase() === recordedKey);

    if (!repoName)
    {
        return false;
    }

    const [recorded, shipped] = await Promise.all([GetEntry(deployed), GetEntry(join(deployedDir, repoName))]);
    return recorded !== null && shipped !== null && recorded.dev === shipped.dev && recorded.ino === shipped.ino;
}

async function MoveAside(source: string, retireRoot: string, kind: string, name: string): Promise<string>
{
    const destination = join(retireRoot, kind, name);
    await mkdir(join(retireRoot, kind), { recursive: true });
    await rename(source, destination);
    return destination;
}

const configArgument = process.argv[2];

if (!configArgument)
{
    console.error("Usage: bun scripts/sync-managed.ts <omp-config-directory>");
    process.exit(2);
}

try
{
    const ompPath = Bun.which("omp");

    if (!ompPath)
    {
        throw new Error("omp not found on PATH");
    }

    const configDir = await realpath(resolve(configArgument));
    const repoRoot = await realpath(fileURLToPath(new URL("..", import.meta.url)));
    const recordPath = join(configDir, RECORD_NAME);
    const previous = await LoadRecord(recordPath);
    const settings = await ReadSettings(join(repoRoot, "config", "settings.conf"));
    const current: ManagedRecord = { version: FORMAT_VERSION, settings: Object.fromEntries(settings), extensions: {}, agents: {}, commands: {}, rules: {}, skills: {} };
    const retireRoot = join(configDir, `.managed-retired-${new Date().toISOString().replace(/[:.]/g, "-")}`);
    const applied = JSON.parse(RunOmp(ompPath, ["config", "list", "--json"])) as Record<string, { value: unknown }>;
    const warnings: string[] = [];
    let retired = 0;

    if (!previous)
    {
        console.log(`  first record of managed items; items removed from the repository before this run are not detected`);
    }

    // A removed key is reset only while it still holds the value setup applied, the same rule as for retired files.
    for (const [key, raw] of Object.entries(previous?.settings ?? {}))
    {
        if (settings.has(key))
        {
            continue;
        }

        const entry = applied[key];

        if (!entry)
        {
            warnings.push(`setting ${key} was removed from config/settings.conf and is unknown to this omp version; nothing to reset`);
        }
        else if (!IsSameSetting(raw, entry.value))
        {
            warnings.push(`setting ${key} was removed from config/settings.conf but changed locally since setup applied it (now ${JSON.stringify(entry.value)}); left as is`);
        }
        else
        {
            RunOmp(ompPath, ["config", "reset", key]);
            console.log(`  reset setting removed from config/settings.conf: ${key}`);
            retired++;
        }
    }

    for (const { kind, source, pattern } of FILE_KINDS)
    {
        const names = await ListRepoFiles(join(repoRoot, source), pattern);
        const deployedDir = join(configDir, kind);

        for (const [name, hash] of Object.entries(previous?.[kind] ?? {}))
        {
            const deployed = join(deployedDir, name);
            const entry = names.includes(name) ? null : await GetEntry(deployed);

            if (!entry || await IsShippedUnderOtherName(deployed, deployedDir, name, names))
            {
                continue;
            }

            if (!entry.isFile() || await HashFile(deployed) !== hash)
            {
                warnings.push(`${kind}/${name} was removed from the repository but changed locally since setup deployed it; left in place: ${deployed}`);
                continue;
            }

            console.log(`  retired ${kind}/${name} -> ${await MoveAside(deployed, retireRoot, kind, name)}`);
            retired++;
        }

        for (const name of names)
        {
            const deployed = join(deployedDir, name);

            if ((await GetEntry(deployed))?.isFile())
            {
                current[kind][name] = await HashFile(deployed);
            }
            else
            {
                warnings.push(`${kind}/${name} is in the repository but missing from ${deployedDir}`);
            }
        }
    }

    const skillNames = await ListRepoSkills(join(repoRoot, "skills"));
    const skillsDir = join(configDir, "skills");

    for (const [name, hash] of Object.entries(previous?.skills ?? {}))
    {
        const deployed = join(skillsDir, name);
        const entry = skillNames.includes(name) ? null : await GetEntry(deployed);

        if (!entry || await IsShippedUnderOtherName(deployed, skillsDir, name, skillNames))
        {
            continue;
        }

        if (!entry.isDirectory() || await HashTree(deployed) !== hash)
        {
            warnings.push(`skills/${name} was removed from the repository but changed locally since setup deployed it; left in place: ${deployed}`);
            continue;
        }

        console.log(`  retired skills/${name} -> ${await MoveAside(deployed, retireRoot, "skills", name)}`);
        retired++;
    }

    for (const name of skillNames)
    {
        const deployed = join(skillsDir, name);

        if ((await GetEntry(deployed))?.isDirectory())
        {
            current.skills[name] = await HashTree(deployed);
        }
        else
        {
            warnings.push(`skills/${name} is in the repository but missing from ${skillsDir}`);
        }
    }

    let verified = 0;

    for (const [key, raw] of settings)
    {
        const entry = applied[key];

        if (!entry)
        {
            warnings.push(`setting ${key} from config/settings.conf is not known to this omp version`);
        }
        else if (!IsSameSetting(raw, entry.value))
        {
            warnings.push(`setting ${key} is ${JSON.stringify(entry.value)}, expected ${raw}`);
        }
        else
        {
            verified++;
        }
    }

    const temporary = `${recordPath}.tmp-${process.pid}`;
    await Bun.write(temporary, `${JSON.stringify(current, null, 2)}\n`);
    await rename(temporary, recordPath);

    for (const warning of warnings)
    {
        console.log(`  warning: ${warning}`);
    }

    console.log(`  settings verified: ${verified}/${settings.size}; retired ${retired} item(s) removed from the repository`);
}
catch (error)
{
    console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
}
