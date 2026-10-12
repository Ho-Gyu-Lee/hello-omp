import { constants } from "node:fs";
import { copyFile, lstat, mkdir, readdir, realpath } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

// Shell-neutral helpers for the knowledge-sync skill. Each subcommand prints a summary and exits non-zero when it finds a problem.
//   snapshot <configdir> <repo> <workdir>      hash and copy local knowledge (<configdir>/okf/learned and legacy <repo>/okf/learned)
//   verify <workdir> [--restore-missing]        compare local knowledge with the snapshot; restore only missing files, never overwrite
//   save-worktree <repo> <workdir>              write staged and unstaged binary diffs and copies of untracked files before stashing
//   incoming-collisions <repo> <upstream>       list paths the upstream adds that already exist locally untracked (ignored or not)
//   links <okfdir>                              check bundle-root links (/path.md#anchor) in every Markdown file
//   config-diff <before.json> <after.json>      list settings whose value changed between two `omp config list --json` outputs
//   mark-applied <repo> <configdir> <workdir>   record that the current HEAD was applied to this config folder (<workdir>/applied.json)
//   is-applied <repo> <configdir>               exit 0 only if a knowledge-sync run applied the current HEAD to this same config folder

const OS_METADATA_PATTERN = /^(?:\.DS_Store|desktop\.ini|Thumbs\.db|\._.*)$/i;
const FORMAT_VERSION = 1;
const SNAPSHOT_NAME = "learned-snapshot.json";
const APPLIED_NAME = "applied.json";

type Snapshot = { version: number; configDir: string; repoRoot: string; config: Record<string, string>; repo: Record<string, string> };

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

// Regular files below root keyed by "/"-separated relative path. The root index.md of a learned/ directory is managed by setup and skipped.
async function ListFiles(root: string, skipRootIndex: boolean): Promise<Map<string, string>>
{
    const files = new Map<string, string>();

    if (!(await GetEntry(root))?.isDirectory())
    {
        return files;
    }

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

            if (skipRootIndex && rel === "index.md")
            {
                continue;
            }

            if (entry.isDirectory())
            {
                await Visit(path, rel);
            }
            else if (entry.isFile())
            {
                files.set(rel, path);
            }
            else
            {
                throw new Error(`unexpected link or special entry (not followed): ${path}`);
            }
        }
    }

    await Visit(root, "");
    return files;
}

function RunGit(repoRoot: string, args: string[]): Buffer
{
    const result = Bun.spawnSync({ cmd: ["git", "-C", repoRoot, ...args], stdout: "pipe", stderr: "pipe" });

    if (result.exitCode !== 0)
    {
        throw new Error(`git ${args.join(" ")} failed: ${result.stderr.toString().trim()}`);
    }

    return result.stdout;
}

async function TakeSnapshot(configDir: string, repoRoot: string, workDir: string): Promise<void>
{
    const snapshot: Snapshot = { version: FORMAT_VERSION, configDir: resolve(configDir), repoRoot: resolve(repoRoot), config: {}, repo: {} };
    const sides = [["config", join(snapshot.configDir, "okf", "learned")], ["repo", join(snapshot.repoRoot, "okf", "learned")]] as const;

    for (const [side, root] of sides)
    {
        for (const [rel, path] of await ListFiles(root, true))
        {
            const backup = join(workDir, "learned-backup", side, ...rel.split("/"));
            await mkdir(dirname(backup), { recursive: true });
            await copyFile(path, backup, constants.COPYFILE_EXCL);
            const hash = await HashFile(backup);

            if (hash !== await HashFile(path))
            {
                throw new Error(`file changed while it was being backed up, rerun the snapshot: ${path}`);
            }

            snapshot[side][rel] = hash;
        }
    }

    await Bun.write(join(workDir, SNAPSHOT_NAME), `${JSON.stringify(snapshot, null, 2)}\n`);
    console.log(`snapshot: ${Object.keys(snapshot.config).length} local file(s) in ${sides[0][1]}, ${Object.keys(snapshot.repo).length} legacy file(s) in ${sides[1][1]}; backup in ${join(workDir, "learned-backup")}`);
}

async function VerifySnapshot(workDir: string, restoreMissing: boolean): Promise<boolean>
{
    const snapshot = JSON.parse(await Bun.file(join(workDir, SNAPSHOT_NAME)).text()) as Snapshot;
    const configLearned = join(snapshot.configDir, "okf", "learned");
    const repoLearned = join(snapshot.repoRoot, "okf", "learned");
    const problems: string[] = [];
    let intact = 0;
    let restored = 0;

    // A legacy file counts as intact if it is unchanged in the repository or present unchanged in the config folder after migration.
    const checks = [
        ...Object.entries(snapshot.config).map(([rel, hash]) => ({ side: "config", rel, hash, candidates: [join(configLearned, ...rel.split("/"))] })),
        ...Object.entries(snapshot.repo).map(([rel, hash]) => ({ side: "repo", rel, hash, candidates: [join(repoLearned, ...rel.split("/")), join(configLearned, ...rel.split("/"))] })),
    ];

    for (const { side, rel, hash, candidates } of checks)
    {
        const existing: string[] = [];
        let matched = false;

        for (const candidate of candidates)
        {
            if ((await GetEntry(candidate))?.isFile())
            {
                existing.push(candidate);
                matched ||= await HashFile(candidate) === hash;
            }
        }

        if (matched)
        {
            intact++;
            continue;
        }

        const backup = join(workDir, "learned-backup", side, ...rel.split("/"));

        if (existing.length > 0)
        {
            problems.push(`changed: learned/${rel} (${existing.join(", ")}); snapshot copy: ${backup}`);
            continue;
        }

        // Missing everywhere. Local knowledge now lives in the config folder, so a restore always targets it.
        const target = join(configLearned, ...rel.split("/"));

        if (!restoreMissing)
        {
            problems.push(`missing: learned/${rel}; snapshot copy: ${backup}`);
            continue;
        }

        await mkdir(dirname(target), { recursive: true });
        await copyFile(backup, target, constants.COPYFILE_EXCL);

        if (await HashFile(target) !== hash)
        {
            throw new Error(`restored file does not match the snapshot: ${target}`);
        }

        console.log(`  restored learned/${rel} -> ${target}`);
        restored++;
    }

    for (const problem of problems)
    {
        console.log(`  ${problem}`);
    }

    console.log(`verify: ${intact} intact, ${restored} restored, ${problems.length} problem(s) of ${checks.length} snapshot file(s)`);
    return problems.length === 0;
}

async function SaveWorktree(repoRoot: string, workDir: string): Promise<void>
{
    // Plain patches regardless of user diff settings (external diff, textconv, forced colour, custom prefixes), so `git apply` can use them.
    const diffArgs = ["diff", "--binary", "--no-ext-diff", "--no-textconv", "--no-color", "--src-prefix=a/", "--dst-prefix=b/"];
    await mkdir(workDir, { recursive: true });
    await Bun.write(join(workDir, "worktree.patch"), RunGit(repoRoot, [...diffArgs, "HEAD"]));
    await Bun.write(join(workDir, "index.patch"), RunGit(repoRoot, [...diffArgs, "--cached"]));

    const untracked = RunGit(repoRoot, ["ls-files", "--others", "--exclude-standard", "-z"]).toString().split("\0").filter(path => path !== "");
    const skipped: string[] = [];

    for (const rel of untracked)
    {
        const source = join(repoRoot, ...rel.split("/"));

        if (!(await GetEntry(source))?.isFile())
        {
            skipped.push(rel);
            continue;
        }

        const destination = join(workDir, "untracked", ...rel.split("/"));
        await mkdir(dirname(destination), { recursive: true });
        await copyFile(source, destination, constants.COPYFILE_EXCL);
    }

    console.log(`saved ${join(workDir, "worktree.patch")} (staged + unstaged vs HEAD), ${join(workDir, "index.patch")} (staged only) and ${untracked.length - skipped.length} untracked file(s) in ${join(workDir, "untracked")}`);

    if (skipped.length > 0)
    {
        console.log(`  not copied (not a regular file): ${skipped.join(", ")}`);
    }
}

// `git merge --no-overwrite-ignore` guards only fast-forwards; a true merge overwrites ignored files silently.
// So before merging, report every path the upstream adds that HEAD does not track but that exists locally, as a file or as a non-directory parent.
async function FindIncomingCollisions(repoRoot: string, upstream: string): Promise<boolean>
{
    const added = RunGit(repoRoot, ["diff", "--name-only", "-z", "--no-renames", "--diff-filter=A", `HEAD...${upstream}`]).toString().split("\0").filter(path => path !== "");
    const tracked = new Set(RunGit(repoRoot, ["ls-tree", "-r", "-z", "--name-only", "HEAD"]).toString().split("\0").filter(path => path !== "").map(path => path.normalize("NFC").toLowerCase()));
    const collisions: string[] = [];

    for (const path of added)
    {
        if (tracked.has(path.normalize("NFC").toLowerCase()))
        {
            continue;
        }

        const parts = path.split("/");

        for (let index = 1; index <= parts.length; index++)
        {
            const entry = await GetEntry(join(repoRoot, ...parts.slice(0, index)));

            if (!entry)
            {
                break;
            }

            // A tracked file the upstream turns into a directory: git replaces it or reports a conflict, it never overwrites it silently.
            if (index < parts.length && !entry.isDirectory() && tracked.has(parts.slice(0, index).join("/").normalize("NFC").toLowerCase()))
            {
                break;
            }

            if (index === parts.length || !entry.isDirectory())
            {
                collisions.push(`${path} (local: ${parts.slice(0, index).join("/")})`);
                break;
            }
        }
    }

    for (const collision of collisions)
    {
        console.log(`  collision: ${collision}`);
    }

    console.log(`incoming-collisions: ${added.length} added path(s) checked, ${collisions.length} collision(s)`);
    return collisions.length === 0;
}

// GitHub-style heading slug: lower case, keep letters, digits, spaces, "_" and "-", then spaces become "-".
function ToSlug(heading: string): string
{
    return heading.trim().toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, "").replace(/\s/g, "-");
}

async function CheckLinks(okfDir: string): Promise<boolean>
{
    const root = resolve(okfDir);
    const markdown = [...(await ListFiles(root, false)).entries()].filter(([rel]) => rel.endsWith(".md"));
    const anchors = new Map<string, Set<string>>();
    const bodies = new Map<string, string>();

    for (const [rel, path] of markdown)
    {
        const body = (await Bun.file(path).text()).replace(/```[\s\S]*?```/g, "");
        bodies.set(rel, body);
        anchors.set(`/${rel}`, new Set([...body.matchAll(/^#{1,6}\s+(.+)$/gm)].map(match => ToSlug(match[1]))));
    }

    const broken: string[] = [];
    let count = 0;

    for (const [rel, body] of bodies)
    {
        for (const [, target] of body.matchAll(/\]\((\/[^)\s]*)\)/g))
        {
            count++;
            const [path, anchor] = target.split("#");

            if (!(await GetEntry(join(root, ...path.split("/").filter(part => part !== "")))))
            {
                broken.push(`${rel} -> ${target}`);
            }
            else if (anchor && path.endsWith(".md") && !anchors.get(path)?.has(decodeURIComponent(anchor)))
            {
                broken.push(`${rel} -> ${target} (anchor)`);
            }
        }
    }

    for (const link of broken)
    {
        console.log(`  broken: ${link}`);
    }

    console.log(`links: ${count} bundle-root link(s) in ${markdown.length} file(s), ${broken.length} broken`);
    return broken.length === 0;
}

async function DiffConfig(beforePath: string, afterPath: string): Promise<void>
{
    const before = JSON.parse(await Bun.file(beforePath).text()) as Record<string, { value: unknown }>;
    const after = JSON.parse(await Bun.file(afterPath).text()) as Record<string, { value: unknown }>;
    let changed = 0;

    for (const key of [...new Set([...Object.keys(before), ...Object.keys(after)])].sort())
    {
        if (!Bun.deepEquals(before[key]?.value, after[key]?.value))
        {
            console.log(`  ${key}: ${JSON.stringify(before[key]?.value)} -> ${JSON.stringify(after[key]?.value)}`);
            changed++;
        }
    }

    console.log(`config-diff: ${changed} setting(s) changed`);
}

// One clone can be applied to several OMP profiles (config folders), so a completion record counts only for the same HEAD and the same real config path.
async function MarkApplied(repoRoot: string, configDir: string, workDir: string): Promise<void>
{
    const record = { version: FORMAT_VERSION, head: RunGit(repoRoot, ["rev-parse", "HEAD"]).toString().trim(), configDir: await realpath(resolve(configDir)) };
    await Bun.write(join(workDir, APPLIED_NAME), `${JSON.stringify(record, null, 2)}\n`);
    console.log(`applied: ${record.head} -> ${record.configDir}`);
}

async function IsApplied(repoRoot: string, configDir: string): Promise<boolean>
{
    const head = RunGit(repoRoot, ["rev-parse", "HEAD"]).toString().trim();
    const realConfigDir = await realpath(resolve(configDir));
    const artifacts = join(repoRoot, ".omp-artifacts");
    const runs = (await GetEntry(artifacts))?.isDirectory() ? (await readdir(artifacts)).filter(name => name.startsWith("knowledge-sync-")).sort() : [];

    for (const run of runs)
    {
        const path = join(artifacts, run, APPLIED_NAME);

        if (!(await GetEntry(path))?.isFile())
        {
            continue;
        }

        let record: { head?: unknown; configDir?: unknown };

        try
        {
            record = JSON.parse(await Bun.file(path).text());
        }
        catch
        {
            // An unreadable record never counts as applied, so setup simply runs again.
            continue;
        }

        if (record.head === head && record.configDir === realConfigDir)
        {
            console.log(`applied: ${head} -> ${realConfigDir} (${path})`);
            return true;
        }
    }

    console.log(`not applied: no knowledge-sync record of ${head} for ${realConfigDir}`);
    return false;
}

const [command, ...rest] = process.argv.slice(2);

try
{
    if (command === "snapshot" && rest.length === 3)
    {
        await TakeSnapshot(rest[0], rest[1], rest[2]);
    }
    else if (command === "verify" && (rest.length === 1 || (rest.length === 2 && rest[1] === "--restore-missing")))
    {
        process.exitCode = await VerifySnapshot(rest[0], rest.length === 2) ? 0 : 1;
    }
    else if (command === "save-worktree" && rest.length === 2)
    {
        await SaveWorktree(rest[0], rest[1]);
    }
    else if (command === "links" && rest.length === 1)
    {
        process.exitCode = await CheckLinks(rest[0]) ? 0 : 1;
    }
    else if (command === "config-diff" && rest.length === 2)
    {
        await DiffConfig(rest[0], rest[1]);
    }
    else if (command === "incoming-collisions" && rest.length === 2)
    {
        process.exitCode = await FindIncomingCollisions(rest[0], rest[1]) ? 0 : 1;
    }
    else if (command === "mark-applied" && rest.length === 3)
    {
        await MarkApplied(rest[0], rest[1], rest[2]);
    }
    else if (command === "is-applied" && rest.length === 2)
    {
        process.exitCode = await IsApplied(rest[0], rest[1]) ? 0 : 1;
    }
    else
    {
        console.error("Usage: bun sync-check.ts snapshot <configdir> <repo> <workdir> | verify <workdir> [--restore-missing] | save-worktree <repo> <workdir> | links <okfdir> | config-diff <before.json> <after.json> | incoming-collisions <repo> <upstream> | mark-applied <repo> <configdir> <workdir> | is-applied <repo> <configdir>");
        process.exitCode = 2;
    }
}
catch (error)
{
    console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
}
