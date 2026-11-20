import { readdir, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, join, relative, sep } from "node:path";

const TOP_CONSUMER_COUNT = 12;

type UsageWindow = {
    provider: string;
    label: string;
    usedPercent: number;
    startMs: number;
    durationMs: number;
};

type Tally = {
    calls: number;
    outputTokens: number;
    cost: number;
};

type CallUsage = {
    output?: number;
    cost?: { total?: number };
};

type SessionRecord = {
    type?: string;
    timestamp?: string;
    provider?: string;
    model?: string;
    purpose?: string;
    usage?: CallUsage;
    message?: {
        role?: string;
        provider?: string;
        model?: string;
        timestamp?: number;
        usage?: CallUsage;
    };
};

async function ReadUsageWindows(): Promise<UsageWindow[]>
{
    const child = Bun.spawn(["omp", "usage", "--json"], { stdout: "pipe", stderr: "inherit" });
    const text = await new Response(child.stdout).text();
    const exitCode = await child.exited;

    if (exitCode !== 0)
    {
        throw new Error(`omp usage --json exited with ${exitCode}`);
    }

    const windows: UsageWindow[] = [];

    for (const report of JSON.parse(text).reports ?? [])
    {
        for (const limit of report.limits ?? [])
        {
            if (limit.amount?.unit !== "percent" || typeof limit.window?.resetsAt !== "number")
            {
                continue;
            }

            windows.push({ provider: report.provider, label: limit.label, usedPercent: limit.amount.used, startMs: limit.window.resetsAt - limit.window.durationMs, durationMs: limit.window.durationMs });
        }
    }

    return windows;
}

function GetProviderStarts(windows: UsageWindow[]): Map<string, number>
{
    const longest = new Map<string, UsageWindow>();

    for (const window of windows)
    {
        const current = longest.get(window.provider);

        if (current === undefined || window.durationMs > current.durationMs || (window.durationMs === current.durationMs && window.startMs < current.startMs))
        {
            longest.set(window.provider, window);
        }
    }

    return new Map([...longest].map(([provider, window]) => [provider, window.startMs]));
}

async function CollectSessionFiles(directory: string, sinceMs: number, files: string[]): Promise<void>
{
    for (const entry of await readdir(directory, { withFileTypes: true }))
    {
        const path = join(directory, entry.name);

        if (entry.isDirectory())
        {
            await CollectSessionFiles(path, sinceMs, files);
            continue;
        }

        if (entry.name.endsWith(".jsonl") && (await stat(path)).mtimeMs >= sinceMs)
        {
            files.push(path);
        }
    }
}

function GetConsumerLabel(sessionsRoot: string, file: string, cwd: string): string
{
    const segments = relative(sessionsRoot, file).split(sep);
    const sessionId = segments[1].replace(/\.jsonl$/, "").split("_").pop()?.slice(0, 8) ?? "";
    const agentPath = segments.length > 2 ? segments.slice(2).join("/").replace(/\.jsonl$/, "") : "main";
    return `${basename(cwd)} ${sessionId} ${agentPath}`;
}

function AddTally(tallies: Map<string, Tally>, key: string, outputTokens: number, cost: number): void
{
    const tally = tallies.get(key) ?? { calls: 0, outputTokens: 0, cost: 0 };
    tally.calls++;
    tally.outputTokens += outputTokens;
    tally.cost += cost;
    tallies.set(key, tally);
}

function ReadUsageCall(record: SessionRecord)
{
    if (record.type === "model_usage" && record.usage !== undefined && typeof record.provider === "string" && typeof record.model === "string")
    {
        return { provider: record.provider, model: record.model, usage: record.usage, timestampMs: Date.parse(record.timestamp ?? ""), purpose: record.purpose ?? "model_usage" };
    }

    const message = record.message;

    if (record.type === "message" && message?.role === "assistant" && message.usage !== undefined && typeof message.provider === "string" && typeof message.model === "string")
    {
        return { provider: message.provider, model: message.model, usage: message.usage, timestampMs: typeof message.timestamp === "number" ? message.timestamp : Date.parse(record.timestamp ?? ""), purpose: undefined };
    }

    return null;
}

async function TallySessions(sessionsRoot: string, providerStarts: Map<string, number>)
{
    const files: string[] = [];
    const byModel = new Map<string, Tally>();
    const byConsumer = new Map<string, Tally>();
    await CollectSessionFiles(sessionsRoot, Math.min(...providerStarts.values()), files);

    for (const file of files)
    {
        let cwd = "";

        for (const line of (await Bun.file(file).text()).split("\n"))
        {
            if (line.startsWith("{\"type\":\"session\""))
            {
                cwd = JSON.parse(line).cwd ?? "";
                continue;
            }

            if (!line.includes("\"usage\""))
            {
                continue;
            }

            const record: SessionRecord = JSON.parse(line);
            const call = ReadUsageCall(record);

            if (call === null)
            {
                continue;
            }

            const sinceMs = providerStarts.get(call.provider);

            if (sinceMs === undefined || call.timestampMs < sinceMs)
            {
                continue;
            }

            const model = `${call.provider}/${call.model}`;
            const outputTokens = call.usage.output ?? 0;
            const cost = call.usage.cost?.total ?? 0;
            const consumer = call.purpose === undefined ? GetConsumerLabel(sessionsRoot, file, cwd) : `${GetConsumerLabel(sessionsRoot, file, cwd)} [${call.purpose}]`;
            AddTally(byModel, model, outputTokens, cost);
            AddTally(byConsumer, `${consumer}\t${model}`, outputTokens, cost);
        }
    }

    return { byModel, byConsumer };
}

function FormatPercent(value: number): string
{
    return `${value.toFixed(1)}%`;
}

function FormatTallyCells(tally: Tally): string
{
    return `${tally.calls} | ${tally.outputTokens.toLocaleString("en-US")} | $${tally.cost.toFixed(2)}`;
}

function PrintWindows(windows: UsageWindow[], nowMs: number): void
{
    console.log("## 사용률과 경과율\n");
    console.log("| provider | 창 | 사용률 | 경과율 | 판정 |");
    console.log("|---|---|---|---|---|");

    for (const window of windows)
    {
        const elapsedPercent = (nowMs - window.startMs) / window.durationMs * 100;
        const verdict = window.usedPercent > elapsedPercent ? "경과율 초과" : "여유";
        console.log(`| ${window.provider} | ${window.label} | ${FormatPercent(window.usedPercent)} | ${FormatPercent(elapsedPercent)} | ${verdict} |`);
    }
}

function PrintModels(byModel: Map<string, Tally>, providerStarts: Map<string, number>): void
{
    const providerTotals = new Map<string, Tally>();

    for (const [model, tally] of byModel)
    {
        const provider = model.split("/")[0];
        const total = providerTotals.get(provider) ?? { calls: 0, outputTokens: 0, cost: 0 };
        total.calls += tally.calls;
        total.outputTokens += tally.outputTokens;
        total.cost += tally.cost;
        providerTotals.set(provider, total);
    }

    console.log("\n## provider·모델별 소비(각 provider의 가장 긴 창 시작 이후, 비용은 API 단가 환산)\n");
    console.log("| 대상 | 집계 시작 | 호출 | 출력 토큰 | API 환산 |");
    console.log("|---|---|---|---|---|");

    for (const [provider, total] of [...providerTotals].sort((left, right) => right[1].cost - left[1].cost))
    {
        console.log(`| **${provider} 합계** | ${new Date(providerStarts.get(provider) ?? 0).toISOString()} | ${FormatTallyCells(total)} |`);

        for (const [model, tally] of [...byModel].filter(([key]) => key.startsWith(`${provider}/`)).sort((left, right) => right[1].cost - left[1].cost))
        {
            console.log(`| ${model} | | ${FormatTallyCells(tally)} |`);
        }
    }
}

function PrintConsumers(byConsumer: Map<string, Tally>): void
{
    console.log(`\n## 소비처 상위 ${TOP_CONSUMER_COUNT}(프로젝트 세션 에이전트)\n`);
    console.log("| 소비처 | 모델 | 호출 | 출력 토큰 | API 환산 |");
    console.log("|---|---|---|---|---|");

    for (const [key, tally] of [...byConsumer].sort((left, right) => right[1].cost - left[1].cost).slice(0, TOP_CONSUMER_COUNT))
    {
        const [consumer, model] = key.split("\t");
        console.log(`| ${consumer} | ${model} | ${FormatTallyCells(tally)} |`);
    }
}

const nowMs = Date.now();
const windows = await ReadUsageWindows();
const providerStarts = GetProviderStarts(windows);
const sessionsRoot = join(process.env.PI_CODING_AGENT_DIR ?? join(homedir(), ".omp", "agent"), "sessions");
const { byModel, byConsumer } = await TallySessions(sessionsRoot, providerStarts);
PrintWindows(windows, nowMs);
PrintModels(byModel, providerStarts);
PrintConsumers(byConsumer);
