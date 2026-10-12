import { constants, realpathSync } from "node:fs";
import { copyFile, lstat, mkdir, readdir, realpath, rename, rmdir, unlink } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

// Deploys the public OKF bundle into <configdir>/okf while preserving local knowledge in <configdir>/okf/learned/.
// Nothing under learned/ is moved, overwritten or deleted, except learned/index.md, which always comes from the repository.

const OS_METADATA_PATTERN = /^(?:\.DS_Store|desktop\.ini|Thumbs\.db|\._.*)$/i;
const FORMAT_VERSION = 1;
const LEARNED_DIR = "learned";
const LEARNED_INDEX = "index.md";
const MARKER_NAME = ".deploy-okf.json";
const STATE_DIR_NAME = ".okf-local";

type LocalFile = { rel: string; path: string; hash: string };

type HistoryManifest = { version: number; updatedAt: string; files: Record<string, string> };

type MigrationRecord = { version: number; files: Record<string, string[]> };

type Paths = {
    configDir: string;
    okfSource: string;
    repoRoot: string;
    okfDestination: string;
    learnedDestination: string;
    stateDir: string;
};

type DeployPlan = {
    paths: Paths;
    localFiles: LocalFile[];
    legacyFiles: LocalFile[];
    legacyToCopy: LocalFile[];
    legacyRecordOnly: LocalFile[];
    migration: MigrationRecord;
    warnings: string[];
};

class DeployStop extends Error
{
}

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

async function HashFile(path: string): Promise<string>
{
    return new Bun.CryptoHasher("sha256").update(await Bun.file(path).arrayBuffer()).digest("hex");
}

// Case- and Unicode-normalization-insensitive key, so names that collide on APFS/NTFS are compared as one path.
function ToKey(rel: string): string
{
    return rel.normalize("NFC").toLowerCase();
}

function ToNativePath(root: string, rel: string): string
{
    return join(root, ...rel.split("/"));
}

async function RequireDirectoryOrMissing(path: string, label: string): Promise<boolean>
{
    const entry = await GetEntry(path);

    if (!entry)
    {
        return false;
    }

    if (!entry.isDirectory())
    {
        throw new DeployStop(`refusing linked or non-directory ${label}: ${path}`);
    }

    return true;
}

// Lists regular files below a learned/ root, excluding the root index.md and OS metadata. Links are refused, never followed.
async function ListLearnedFiles(root: string, label: string): Promise<LocalFile[]>
{
    const files: LocalFile[] = [];

    if (!(await RequireDirectoryOrMissing(root, label)))
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

            const rel = prefix === "" ? name : `${prefix}/${name}`;
            const path = join(directory, name);
            const entry = await lstat(path);

            // The root index.md is managed by setup but is still type-checked, so deploy never writes through a link.
            if (entry.isDirectory())
            {
                await Visit(path, rel);
            }
            else if (!entry.isFile())
            {
                throw new DeployStop(`unsupported entry in ${label} (links are not followed): ${path}`);
            }
            else if (rel !== LEARNED_INDEX)
            {
                files.push({ rel, path, hash: await HashFile(path) });
            }
        }
    }

    await Visit(root, "");
    return files;
}

// Public bundle files: everything in the repository okf/ except learned/*, plus learned/index.md.
async function ListPublicFiles(okfSource: string): Promise<Map<string, string>>
{
    const files = new Map<string, string>();

    async function Visit(directory: string, prefix: string): Promise<void>
    {
        for (const name of (await readdir(directory)).sort())
        {
            if (OS_METADATA_PATTERN.test(name))
            {
                continue;
            }

            const rel = prefix === "" ? name : `${prefix}/${name}`;
            const path = join(directory, name);
            const entry = await lstat(path);

            if (entry.isDirectory())
            {
                if (rel === LEARNED_DIR)
                {
                    const indexPath = join(path, LEARNED_INDEX);

                    if ((await GetEntry(indexPath))?.isFile())
                    {
                        files.set(`${LEARNED_DIR}/${LEARNED_INDEX}`, indexPath);
                    }

                    continue;
                }

                await Visit(path, rel);
            }
            else if (entry.isFile())
            {
                files.set(rel, path);
            }
            else
            {
                throw new DeployStop(`unsupported source entry (links are not followed): ${path}`);
            }
        }
    }

    await Visit(okfSource, "");
    return files;
}

// Deployed entries outside the top-level learned/ directory and the marker. Directories are returned children first.
async function ListDeployedPublicEntries(okfDestination: string): Promise<{ files: string[]; directories: string[] }>
{
    const files: string[] = [];
    const directories: string[] = [];

    async function Visit(directory: string, prefix: string): Promise<void>
    {
        for (const name of await readdir(directory))
        {
            const rel = prefix === "" ? name : `${prefix}/${name}`;

            if (ToKey(rel) === LEARNED_DIR || rel === MARKER_NAME)
            {
                continue;
            }

            const path = join(directory, name);
            const entry = await lstat(path);

            if (entry.isDirectory())
            {
                await Visit(path, rel);
                directories.push(rel);
            }
            else if (entry.isFile())
            {
                files.push(rel);
            }
            else
            {
                throw new DeployStop(`refusing to remove a link or special entry from the deployed OKF bundle: ${path}`);
            }
        }
    }

    await Visit(okfDestination, "");
    return { files, directories };
}

// Reads a state file written by this script. Content without a "files" mapping is reported, never silently replaced.
async function LoadStateFile<T extends { files: object }>(path: string): Promise<T | null>
{
    if (!(await GetEntry(path)))
    {
        return null;
    }

    let state: unknown;

    try
    {
        state = JSON.parse(await Bun.file(path).text());
    }
    catch (error)
    {
        throw new DeployStop(`cannot read ${path}: ${error instanceof Error ? error.message : String(error)}; fix or move the file, then rerun setup`);
    }

    const files = (state as { files?: unknown } | null)?.files;

    if (files === null || typeof files !== "object" || Array.isArray(files))
    {
        throw new DeployStop(`unexpected content in ${path} (no "files" mapping); fix or move the file, then rerun setup`);
    }

    return state as T;
}

async function WriteJsonAtomic(path: string, value: unknown): Promise<void>
{
    const temporary = `${path}.tmp-${process.pid}`;
    await mkdir(dirname(path), { recursive: true });
    await Bun.write(temporary, `${JSON.stringify(value, null, 2)}\n`);
    await rename(temporary, path);
}

function RunValidator(directory: string): boolean
{
    const validator = fileURLToPath(new URL("./validate-okf.ts", import.meta.url));
    const result = Bun.spawnSync({ cmd: [process.execPath, validator, directory], stdout: "inherit", stderr: "inherit" });
    return result.exitCode === 0;
}

// Returns tracked paths under okf/learned/ other than index.md, or null when the repository is not a git checkout of its own.
function ListTrackedLegacyFiles(repoRoot: string, warnings: string[]): string[] | null
{
    try
    {
        const topLevel = Bun.spawnSync({ cmd: ["git", "-C", repoRoot, "rev-parse", "--show-toplevel"], stdout: "pipe", stderr: "pipe" });
        const topLevelPath = topLevel.stdout.toString().trim();

        if (topLevel.exitCode !== 0 || topLevelPath === "")
        {
            warnings.push(`not a git checkout (${repoRoot}); skipped the check for tracked files under okf/learned/`);
            return null;
        }

        let realTopLevel: string;

        try
        {
            realTopLevel = realpathSync.native(topLevelPath);
        }
        catch
        {
            realTopLevel = topLevelPath;
        }

        if (realTopLevel !== repoRoot)
        {
            warnings.push(`repository root ${repoRoot} is inside another git work tree (${topLevelPath}); skipped the check for tracked files under okf/learned/`);
            return null;
        }

        const listed = Bun.spawnSync({ cmd: ["git", "-C", repoRoot, "ls-files", "-z", "--", "okf/learned"], stdout: "pipe", stderr: "pipe" });

        if (listed.exitCode !== 0)
        {
            throw new DeployStop(`git ls-files failed in ${repoRoot}: ${listed.stderr.toString().trim()}`);
        }

        return listed.stdout.toString().split("\0").filter(path => path !== "" && path !== `okf/${LEARNED_DIR}/${LEARNED_INDEX}`);
    }
    catch (error)
    {
        if (error instanceof DeployStop)
        {
            throw error;
        }

        warnings.push(`git is not available (${error instanceof Error ? error.message : String(error)}); skipped the check for tracked files under okf/learned/`);
        return null;
    }
}

async function ResolvePaths(configArgument: string): Promise<Paths>
{
    const configDir = await realpath(resolve(configArgument));
    const okfSource = await realpath(fileURLToPath(new URL("../okf", import.meta.url)));
    const okfDestination = join(configDir, "okf");

    return {
        configDir,
        okfSource,
        repoRoot: dirname(okfSource),
        okfDestination,
        learnedDestination: join(okfDestination, LEARNED_DIR),
        stateDir: join(configDir, STATE_DIR_NAME),
    };
}

// Read-only inspection shared by --check and deploy. Throws DeployStop before anything is changed.
async function Inspect(paths: Paths): Promise<DeployPlan>
{
    const warnings: string[] = [];
    const okfTarget = await GetEntry(paths.okfDestination) ? await realpath(paths.okfDestination) : paths.okfDestination;

    if (IsWithin(okfTarget, paths.okfSource) || IsWithin(paths.okfSource, okfTarget))
    {
        throw new DeployStop("source and destination OKF directories must not overlap");
    }

    if (await RequireDirectoryOrMissing(paths.okfDestination, "deployed OKF root"))
    {
        // On case-insensitive volumes "Learned" resolves to learned/ for reads; require the exact name so no path can treat it as public.
        const misspelled = (await readdir(paths.okfDestination)).filter(name => ToKey(name) === LEARNED_DIR && name !== LEARNED_DIR);

        if (misspelled.length > 0)
        {
            throw new DeployStop(`the local knowledge directory must be named exactly "${LEARNED_DIR}": rename ${misspelled.map(name => join(paths.okfDestination, name)).join(", ")} to ${paths.learnedDestination}, then rerun setup. Nothing was changed.`);
        }
    }

    await RequireDirectoryOrMissing(paths.stateDir, "local knowledge state directory");

    const localFiles = await ListLearnedFiles(paths.learnedDestination, "local knowledge directory");
    const localByKey = new Map<string, LocalFile>();

    for (const file of localFiles)
    {
        localByKey.set(ToKey(file.rel), file);
    }

    // Old-setup wipe detection: an older setup removes <configdir>/okf, and with it the marker this script writes.
    const manifest = await LoadStateFile<HistoryManifest>(join(paths.stateDir, "manifest.json"));
    const markerPresent = (await GetEntry(join(paths.okfDestination, MARKER_NAME)))?.isFile() ?? false;

    if (manifest && !markerPresent)
    {
        const lost = FindLostFiles(manifest, localByKey);

        if (lost.length > 0)
        {
            const lines = lost.map(item => `  ${item.state}: learned/${item.rel}`);
            throw new DeployStop([
                `local knowledge recorded in ${join(paths.stateDir, "manifest.json")} is missing or was replaced in ${paths.learnedDestination},`,
                `and the deploy marker ${join(paths.okfDestination, MARKER_NAME)} is absent. A setup from a checkout older than this script may have replaced the OKF bundle. Nothing was changed.`,
                ...lines,
                `Restore with: bun "${fileURLToPath(import.meta.url)}" --restore "${paths.configDir}" (current versions of replaced files are kept under ${join(paths.stateDir, "displaced")}), then rerun setup.`,
                `If these files were removed on purpose, move ${join(paths.stateDir, "manifest.json")} out of the way and rerun setup.`,
            ].join("\n"));
        }

        warnings.push(`deploy marker missing; every file in the local knowledge history is still present, continuing`);
    }

    // Legacy migration: repository okf/learned/ files are copied into this config folder once, never moved.
    const legacyRoot = join(paths.okfSource, LEARNED_DIR);
    const legacyFiles = await ListLearnedFiles(legacyRoot, "legacy repository learned directory");
    const tracked = ListTrackedLegacyFiles(paths.repoRoot, warnings);

    if (tracked && tracked.length > 0)
    {
        throw new DeployStop([
            `tracked files under okf/learned/ in ${paths.repoRoot}; local knowledge must not be committed. Nothing was changed.`,
            ...tracked.map(path => `  ${path}`),
            `Move the content to a public concept or to ${paths.learnedDestination}, remove the files from the repository, then rerun setup.`,
        ].join("\n"));
    }

    const migration = await LoadStateFile<MigrationRecord>(join(paths.stateDir, "migration.json")) ?? { version: FORMAT_VERSION, files: {} };
    const firstMigration = Object.keys(migration.files).length === 0;
    const legacyToCopy: LocalFile[] = [];
    const legacyRecordOnly: LocalFile[] = [];
    const conflicts: string[] = [];
    const legacyKeys = new Map<string, LocalFile>();

    for (const file of legacyFiles)
    {
        const key = ToKey(file.rel);
        const sameKey = legacyKeys.get(key);

        if (sameKey)
        {
            conflicts.push(`  learned/${file.rel} and learned/${sameKey.rel} differ only in case or Unicode normalization in ${legacyRoot}`);
            continue;
        }

        legacyKeys.set(key, file);

        if (migration.files[key]?.includes(file.hash))
        {
            continue;
        }

        const local = localByKey.get(key);

        if (!local)
        {
            legacyToCopy.push(file);
        }
        else if (local.hash === file.hash)
        {
            legacyRecordOnly.push(file);
        }
        else
        {
            conflicts.push([
                `  learned/${file.rel}`,
                `    repository: ${file.path} (sha256 ${file.hash.slice(0, 12)})`,
                `    config:     ${local.path} (sha256 ${local.hash.slice(0, 12)})`,
            ].join("\n"));
        }
    }

    if (conflicts.length > 0)
    {
        throw new DeployStop([
            `local knowledge exists in both ${legacyRoot} and ${paths.learnedDestination} with different content. Setup overwrites neither copy and has changed nothing.`,
            ...conflicts,
            "Before local knowledge moved to the config folder, setup copied the repository files into the config folder, so the repository copy is usually the newer one unless the config copy was edited directly.",
            `For each file, put the content you want to keep in ${paths.learnedDestination}, then make the repository copy identical or move it out of ${legacyRoot} (for example into ${join(paths.repoRoot, ".omp-artifacts")}), and rerun setup.`,
        ].join("\n"));
    }

    if (firstMigration && legacyFiles.length > 0)
    {
        for (const file of localFiles)
        {
            if (!legacyKeys.has(ToKey(file.rel)))
            {
                warnings.push(`learned/${file.rel} exists only in the config folder; if it is a stale copy of a concept renamed or deleted in the repository, move it out of ${paths.learnedDestination}`);
            }
        }
    }

    if (localFiles.length > 0 && !RunValidator(paths.learnedDestination))
    {
        throw new DeployStop(`local knowledge in ${paths.learnedDestination} failed OKF validation (paths above are relative to that folder). Fix the files there, then rerun setup. Nothing was changed.`);
    }

    return { paths, localFiles, legacyFiles, legacyToCopy, legacyRecordOnly, migration, warnings };
}

function FindLostFiles(manifest: HistoryManifest, localByKey: Map<string, LocalFile>): { rel: string; state: "missing" | "replaced" }[]
{
    const lost: { rel: string; state: "missing" | "replaced" }[] = [];

    for (const [rel, hash] of Object.entries(manifest.files))
    {
        const local = localByKey.get(ToKey(rel));

        if (!local)
        {
            lost.push({ rel, state: "missing" });
        }
        else if (local.hash !== hash)
        {
            lost.push({ rel, state: "replaced" });
        }
    }

    return lost;
}

async function StoreHistory(stateDir: string, files: LocalFile[], warnings: string[]): Promise<void>
{
    const objectsDir = join(stateDir, "objects");
    const manifestFiles: Record<string, string> = {};
    await mkdir(objectsDir, { recursive: true });

    for (const file of files)
    {
        const objectPath = join(objectsDir, file.hash);

        // An existing object is trusted only while its content still matches its name; a truncated copy from an interrupted run is replaced.
        if ((await GetEntry(objectPath))?.isFile() && await HashFile(objectPath) === file.hash)
        {
            manifestFiles[file.rel] = file.hash;
            continue;
        }

        const temporary = `${objectPath}.tmp-${process.pid}`;
        await copyFile(file.path, temporary);

        if (await HashFile(temporary) !== file.hash)
        {
            // The file changed after it was inventoried; drop only this run's temporary copy and store it next time.
            await unlink(temporary);
            warnings.push(`learned/${file.rel} changed during deployment; its history copy will be stored by the next setup`);
            continue;
        }

        await rename(temporary, objectPath);

        manifestFiles[file.rel] = file.hash;
    }

    await WriteJsonAtomic(join(stateDir, "manifest.json"), { version: FORMAT_VERSION, updatedAt: new Date().toISOString(), files: manifestFiles });
}

async function Deploy(plan: DeployPlan): Promise<void>
{
    const { paths, warnings } = plan;
    const publicFiles = await ListPublicFiles(paths.okfSource);
    await mkdir(paths.okfDestination, { recursive: true });

    // Remove stale public files first, so a directory replaced by a file in the repository can be recreated.
    const deployed = await ListDeployedPublicEntries(paths.okfDestination);
    let removed = 0;

    for (const rel of deployed.files)
    {
        if (!publicFiles.has(rel))
        {
            await unlink(ToNativePath(paths.okfDestination, rel));
            removed++;
        }
    }

    for (const rel of deployed.directories)
    {
        try
        {
            await rmdir(ToNativePath(paths.okfDestination, rel));
        }
        catch (error)
        {
            const code = (error as NodeJS.ErrnoException).code;

            if (code !== "ENOTEMPTY" && code !== "EEXIST" && code !== "ENOENT")
            {
                throw error;
            }
        }
    }

    for (const [rel, source] of publicFiles)
    {
        const destination = ToNativePath(paths.okfDestination, rel);
        await mkdir(dirname(destination), { recursive: true });
        await copyFile(source, destination);
    }

    // Copy legacy files that the config folder does not have yet. COPYFILE_EXCL never overwrites a file that appeared meanwhile.
    const migrated: LocalFile[] = [...plan.legacyRecordOnly];

    for (const file of plan.legacyToCopy)
    {
        const destination = ToNativePath(paths.learnedDestination, file.rel);
        await mkdir(dirname(destination), { recursive: true });

        try
        {
            await copyFile(file.path, destination, constants.COPYFILE_EXCL);
        }
        catch (error)
        {
            if ((error as NodeJS.ErrnoException).code === "EEXIST")
            {
                warnings.push(`learned/${file.rel} appeared in the config folder during deployment; the repository copy was not copied, compare ${file.path} and ${destination}`);
                continue;
            }

            throw error;
        }

        migrated.push({ ...file, hash: await HashFile(destination) });
    }

    if (!RunValidator(paths.okfDestination))
    {
        throw new DeployStop(`deployed OKF bundle ${paths.okfDestination} failed validation; local files were not changed. Fix the reported files and rerun setup.`);
    }

    const currentLocal = await ListLearnedFiles(paths.learnedDestination, "local knowledge directory");
    await StoreHistory(paths.stateDir, currentLocal, warnings);

    for (const file of migrated)
    {
        const key = ToKey(file.rel);
        const hashes = plan.migration.files[key] ?? [];

        if (!hashes.includes(file.hash))
        {
            hashes.push(file.hash);
        }

        plan.migration.files[key] = hashes;
    }

    await WriteJsonAtomic(join(paths.stateDir, "migration.json"), { version: FORMAT_VERSION, files: plan.migration.files });
    await WriteJsonAtomic(join(paths.okfDestination, MARKER_NAME), { version: FORMAT_VERSION, deployedAt: new Date().toISOString(), localFiles: currentLocal.length });

    console.log(`  deployed ${publicFiles.size} public file(s), removed ${removed} stale file(s)`);
    console.log(`  local knowledge preserved: ${currentLocal.length} file(s) in ${paths.learnedDestination}`);

    if (plan.legacyToCopy.length > 0 || plan.legacyRecordOnly.length > 0)
    {
        console.log(`  migrated from ${join(paths.okfSource, LEARNED_DIR)}: ${migrated.length} file(s) (copied ${migrated.length - plan.legacyRecordOnly.length}, already present ${plan.legacyRecordOnly.length})`);
    }

    if (plan.legacyFiles.length > 0)
    {
        console.log(`  note: ${plan.legacyFiles.length} legacy file(s) remain in ${join(paths.okfSource, LEARNED_DIR)} (ignored by git, already copied); archive them when convenient`);
    }
}

async function Restore(paths: Paths): Promise<void>
{
    const manifest = await LoadStateFile<HistoryManifest>(join(paths.stateDir, "manifest.json"));

    if (!manifest)
    {
        console.log(`nothing to restore: no local knowledge history in ${paths.stateDir}`);
        return;
    }

    if ((await GetEntry(join(paths.okfDestination, MARKER_NAME)))?.isFile())
    {
        console.log("nothing to restore: the deploy marker is present, so differences from the history are treated as intentional local edits");
        return;
    }

    const localFiles = await ListLearnedFiles(paths.learnedDestination, "local knowledge directory");
    const localByKey = new Map(localFiles.map(file => [ToKey(file.rel), file] as const));
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const unavailable: string[] = [];
    let restored = 0;

    for (const { rel, state } of FindLostFiles(manifest, localByKey))
    {
        const hash = manifest.files[rel];
        const objectPath = join(paths.stateDir, "objects", hash);

        // Check the history copy before touching the destination, so a corrupt object never replaces or creates a file.
        if (!(await GetEntry(objectPath))?.isFile() || await HashFile(objectPath) !== hash)
        {
            unavailable.push(rel);
            continue;
        }

        const local = localByKey.get(ToKey(rel));
        const destination = local ? local.path : ToNativePath(paths.learnedDestination, rel);

        if (state === "replaced" && local)
        {
            const displaced = ToNativePath(join(paths.stateDir, "displaced", stamp), local.rel);
            await mkdir(dirname(displaced), { recursive: true });
            await copyFile(local.path, displaced, constants.COPYFILE_EXCL);
            await copyFile(objectPath, destination);
            console.log(`  restored learned/${rel} (current version kept at ${displaced})`);
        }
        else
        {
            await mkdir(dirname(destination), { recursive: true });
            await copyFile(objectPath, destination, constants.COPYFILE_EXCL);
            console.log(`  restored learned/${rel}`);
        }

        if (await HashFile(destination) !== hash)
        {
            throw new DeployStop(`restored file does not match its history copy: ${destination}`);
        }

        restored++;
    }

    console.log(`restored ${restored} file(s) into ${paths.learnedDestination}; rerun setup to finish`);

    if (unavailable.length > 0)
    {
        throw new DeployStop(`no history copy for: ${unavailable.map(rel => `learned/${rel}`).join(", ")}`);
    }
}

const argumentsList = process.argv.slice(2);
const MODES: Record<string, "check" | "record" | "restore"> = { "--check": "check", "--record": "record", "--restore": "restore" };
const mode = MODES[argumentsList[0]] ?? "deploy";
const configArgument = mode === "deploy" ? argumentsList[0] : argumentsList[1];

if (!configArgument || configArgument.startsWith("--"))
{
    console.error("Usage: bun scripts/deploy-okf.ts [--check | --record | --restore] <omp-config-directory>");
    process.exit(2);
}

try
{
    const paths = await ResolvePaths(configArgument);

    if (mode === "restore")
    {
        await Restore(paths);
    }
    else
    {
        const plan = await Inspect(paths);

        for (const warning of plan.warnings)
        {
            console.log(`  warning: ${warning}`);
        }

        if (mode === "check")
        {
            console.log(`OKF local knowledge check OK: ${plan.localFiles.length} local file(s); legacy to copy ${plan.legacyToCopy.length}, already present ${plan.legacyRecordOnly.length}`);
        }
        else
        {
            const reported = plan.warnings.length;

            if (mode === "record" && !(await GetEntry(join(paths.okfDestination, MARKER_NAME)))?.isFile())
            {
                // Without a deploy marker a history manifest would look like a wipe to the next check; the first new setup records everything.
                console.log(`OKF local knowledge validated: ${plan.localFiles.length} local file(s); no deploy marker yet, so history is recorded by the next setup`);
            }
            else if (mode === "record")
            {
                // After a local concept is written: validate it (done by Inspect) and add it to the history, so a later wipe can be restored without waiting for setup.
                await StoreHistory(paths.stateDir, plan.localFiles, plan.warnings);
                console.log(`OKF local knowledge recorded: ${plan.localFiles.length} local file(s) validated and stored in ${join(paths.stateDir, "objects")}`);
            }
            else
            {
                await Deploy(plan);
            }

            for (const warning of plan.warnings.slice(reported))
            {
                console.log(`  warning: ${warning}`);
            }
        }
    }
}
catch (error)
{
    if (error instanceof DeployStop)
    {
        console.error(`ERROR: ${error.message}`);
    }
    else
    {
        console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
        console.error(error);
    }

    process.exit(1);
}
