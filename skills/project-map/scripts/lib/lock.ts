// One publish per map at a time: an exclusive lock file in <project>/.omp-artifacts/ (created with wx).
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { GetEntry, Sha256Hex } from "./files.ts";

export function LockPath(projectRoot: string, mapRelative: string): string
{
    return join(projectRoot, ".omp-artifacts", `project-map-publish-${Sha256Hex(mapRelative).slice(0, 12)}.lock`);
}

// Returns the function that removes the lock; call it in a finally block. It removes the file only while the file still is this
// process's lock, so a lock cleared by hand and taken by another publish is never deleted from under it.
export async function AcquireLock(projectRoot: string, mapRelative: string, work: string): Promise<() => Promise<void>>
{
    const directory = join(projectRoot, ".omp-artifacts");
    const entry = await GetEntry(directory);

    if (entry !== null && !entry.isDirectory())
    {
        throw new Error(`${directory} must be a real directory (links are not followed)`);
    }

    await mkdir(directory, { recursive: true });

    const path = LockPath(projectRoot, mapRelative);
    const text = JSON.stringify({ map: mapRelative, work, pid: process.pid, startedAt: new Date().toISOString() }, null, 2) + "\n";

    try
    {
        await writeFile(path, text, { flag: "wx" });
    }
    catch (error)
    {
        if (!(error instanceof Error) || !("code" in error) || error.code !== "EEXIST")
        {
            throw error;
        }

        const holder = await readFile(path, "utf8").catch(() => "(unreadable)");
        throw new Error(`another publish of ${mapRelative} holds the lock ${path}\n${holder.trim()}\nCheck that no project-map publish is running for this map (the lock names the process id and work directory). If none is, the lock is left over from an interrupted run: delete that file and publish again.`);
    }

    return async () =>
    {
        if (await readFile(path, "utf8").catch(() => null) === text)
        {
            await unlink(path);
        }
    };
}
