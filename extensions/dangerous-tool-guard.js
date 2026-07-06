const DB_TOOL_RE = /(?:postgres|postgre|psql|mysql|mariadb|sqlite|duckdb|database|\bdb\b|supabase|neon|planetscale|prisma)/i;
const DB_CODE_RE = /(?:psycopg|pymysql|mysql2|sqlite3|sqlalchemy|sequelize|knex|prisma|drizzle|kysely|better-sqlite3|\bpg\b|createPool|createConnection|\.query\s*\(|\.execute\s*\(|cursor\.execute\s*\(|db\.exec\s*\()/i;
const SQL_DROP_RE = /\bDROP\s+(?:DATABASE|SCHEMA|TABLE|VIEW|INDEX|SEQUENCE|EXTENSION)\b/i;
const SQL_TRUNCATE_RE = /\bTRUNCATE\b/i;
const SQL_DELETE_RE = /\bDELETE\s+FROM\b/i;
const SQL_UPDATE_RE = /\bUPDATE\s+[\w."`\[\]-]+\s+SET\b/i;
const BROWSER_DELETE_RE = /\bmethod\s*:\s*["']DELETE["']/i;
const SHELL_RUNNER_RE = /(?:subprocess\.|child_process|execFile|spawn\s*\(|exec\s*\(|Bun\.\$|os\.system\s*\()/i;
const EVAL_DIRECT_REMOVE_RE = /(?:shutil\.rmtree\s*\(|(?:\bfs(?:\.promises)?|fsp)\s*\.\s*rm(?:dir)?(?:Sync)?\s*\(|\bos\.(?:remove|unlink|rmdir)\s*\()/i;
const EVAL_SHELL_RM_RE = /(?:rm\s+-[\w-]*r|\brm\s+)/i;
const DESTRUCTIVE_MCP_NAME_RE = /(?:^|[_-])(?:delete|drop|destroy|terminate|purge|truncate|reset|remove)(?:$|[_-])/i;

const DB_COMMANDS = new Set([
  "psql",
  "mysql",
  "mariadb",
  "sqlite3",
  "duckdb",
  "prisma",
  "supabase",
  "rails",
  "rake",
  "django-admin",
  "alembic",
  "sequelize",
  "knex",
]);
const SHELL_WRAPPERS = new Set(["sudo", "command", "builtin", "noglob", "nohup", "time", "nice"]);
const SHELL_KEYWORDS = new Set(["if", "then", "else", "elif", "fi", "for", "while", "until", "do", "done", "case", "esac", "select", "function", "{", "}", "(", ")"]);
const XARGS_FLAGS_WITH_VALUE = new Set(["-I", "-i", "-n", "-d", "-P", "-L", "-s", "-E", "-a", "-e"]);
const SUDO_FLAGS_WITH_VALUE = new Set(["-u", "--user", "-g", "--group", "-h", "--host", "-p", "--prompt", "-C", "--close-from", "-T", "--command-timeout", "-R", "--chroot", "-r", "--role", "-t", "--type"]);
const TIME_FLAGS_WITH_VALUE = new Set(["-f", "--format", "-o", "--output"]);
const NICE_FLAGS_WITH_VALUE = new Set(["-n", "--adjustment"]);
const ENV_FLAGS_WITH_VALUE = new Set(["-u", "--unset", "-C", "--chdir"]);
const SHELLS = new Set(["sh", "bash", "zsh", "fish"]);

export default function dangerousToolGuard(pi) {
  pi.setLabel?.("Dangerous tool guard");

  pi.on("tool_call", async (event, ctx) => {
    const finding = findDangerousToolCall(event);
    if (!finding) return;

    const title = "Dangerous tool call";
    const details = `${finding.reason}\n\nTool: ${event.toolName}\n${finding.snippet}`;
    const decision = await confirmDangerousCall(ctx, title, details);
    if (!decision.ok) return { block: true, reason: `${finding.reason} (${decision.reason})` };
  });
}

async function confirmDangerousCall(ctx, title, details) {
  if (!ctx?.hasUI || typeof ctx.ui?.confirm !== "function") {
    return { ok: false, reason: "no UI; blocked fail-closed" };
  }

  let timeout;
  try {
    const result = await Promise.race([
      ctx.ui.confirm(title, details),
      new Promise((resolve) => {
        timeout = setTimeout(() => resolve(undefined), 25000);
      }),
    ]);
    clearTimeout(timeout);
    if (result === true) return { ok: true };
    return { ok: false, reason: result === undefined ? "confirmation timed out; blocked fail-closed" : "denied" };
  } catch {
    clearTimeout(timeout);
    return { ok: false, reason: "confirmation failed; blocked fail-closed" };
  }
}

function findDangerousToolCall(event) {
  const input = event.input ?? {};
  switch (event.toolName) {
    case "bash":
      return inspectBash(String(input.command ?? ""));
    case "eval":
      return inspectEvalInput(input);
    case "browser":
      return inspectBrowser(String(input.code ?? ""));
    case "debug":
      return inspectDebug(input);
    default:
      if (String(event.toolName).startsWith("mcp__")) return inspectMcp(event.toolName, input);
      return undefined;
  }
}

function inspectBash(command) {
  if (!command.trim()) return undefined;
  return inspectShellScript(command);
}

function inspectEvalInput(input) {
  const cells = Array.isArray(input.cells) ? input.cells : undefined;
  if (cells) {
    for (const cell of cells) {
      const found = inspectEval(String(cell?.code ?? ""), String(cell?.language ?? ""));
      if (found) return found;
    }
    return undefined;
  }

  return inspectEval(String(input.code ?? ""), String(input.language ?? ""));
}

function inspectEval(code, language) {
  if (!code.trim()) return undefined;

  const sql = destructiveSqlReason(code);
  if (sql && (DB_CODE_RE.test(code) || language.toLowerCase() === "sql")) {
    return finding(`destructive SQL detected in eval code: ${sql}`, code);
  }

  if (EVAL_DIRECT_REMOVE_RE.test(code) || (SHELL_RUNNER_RE.test(code) && EVAL_SHELL_RM_RE.test(code))) {
    return finding("destructive file removal detected in eval code", code);
  }

  return undefined;
}

function inspectBrowser(code) {
  if (!code.trim()) return undefined;

  const sql = destructiveSqlReason(code);
  if (sql && DB_CODE_RE.test(code)) return finding(`destructive SQL detected in browser code: ${sql}`, code);
  if (BROWSER_DELETE_RE.test(code)) return finding("HTTP DELETE detected in browser automation code", code);
  return undefined;
}

function inspectDebug(input) {
  const action = String(input.action ?? "");
  if (action === "write_memory") return finding("debug write_memory can mutate a running process", JSON.stringify(input));
  if (action === "terminate") return finding("debug terminate can stop a running process", JSON.stringify(input));
  return undefined;
}

function inspectMcp(toolName, input) {
  const payload = safeJson(input);
  const toolSegment = mcpToolSegment(toolName);
  const sql = destructiveSqlReason(payload);
  if (sql && (DB_TOOL_RE.test(String(toolName ?? "")) || DB_TOOL_RE.test(payload))) {
    return finding(`destructive SQL detected in MCP DB tool call: ${sql}`, payload);
  }

  if (DESTRUCTIVE_MCP_NAME_RE.test(toolSegment)) {
    return finding("destructive MCP tool name detected", `${toolName}\n${payload}`);
  }

  return undefined;
}

function inspectShellScript(script) {
  const heredoc = stripAndInspectHeredocs(script);
  if (heredoc.finding) return heredoc.finding;

  const nested = [];
  for (const segment of splitShellSegments(heredoc.script, nested)) {
    const segmentFinding = inspectShellSegment(segment);
    if (segmentFinding) return segmentFinding;
  }

  for (const inner of nested) {
    const nestedFinding = inspectShellScript(inner);
    if (nestedFinding) return nestedFinding;
  }

  return undefined;
}

function stripAndInspectHeredocs(script) {
  const lines = script.split(/\r?\n/);
  const kept = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const spec = parseHeredocSpec(line);
    if (!spec) {
      kept.push(line);
      continue;
    }

    const body = [];
    let end = i + 1;
    for (; end < lines.length; end += 1) {
      if (lines[end].trim() === spec.delimiter) break;
      body.push(lines[end]);
    }

    const tokens = shellWords(line);
    const commandIndex = effectiveCommandIndex(tokens);
    const command = commandIndex >= 0 ? commandName(tokens[commandIndex]) : "";
    const args = commandIndex >= 0 ? tokens.slice(commandIndex + 1) : [];
    const bodyText = body.join("\n");
    const heredocInspection = inspectHeredocBody(command, args, line, bodyText);
    if (heredocInspection.finding) return { script: "", finding: heredocInspection.finding };

    kept.push(line);
    if (!heredocInspection.consumed) kept.push(...body);
    i = end;
  }

  return { script: kept.join("\n") };
}

function parseHeredocSpec(line) {
  const tokens = shellWords(line);
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (token === "<<" || token === "<<-") {
      const delimiter = tokens[i + 1];
      if (delimiter) return { delimiter };
      continue;
    }
    if (/^<<-?[^<]/.test(token)) return { delimiter: token.replace(/^<<-?/, "") };
  }
  return undefined;
}

function inspectHeredocBody(command, args, line, bodyText) {
  const sql = destructiveSqlReason(bodyText);
  if (isDbShellExecution(command, args, line)) {
    return { consumed: true, finding: sql ? finding(`destructive SQL detected in shell heredoc DB execution: ${sql}`, `${line}\n${bodyText}`) : undefined };
  }

  if (isShellHeredocExecution(command, args)) return { consumed: true, finding: inspectShellScript(bodyText) };

  const evalLanguage = heredocEvalLanguage(command, args);
  if (evalLanguage) return { consumed: true, finding: inspectEval(bodyText, evalLanguage) };

  return { consumed: false };
}

function isShellHeredocExecution(command, args) {
  if (SHELLS.has(command)) return true;
  return args.some((arg) => SHELLS.has(commandName(arg)));
}

function heredocEvalLanguage(command, args) {
  const names = [command, ...args.map((arg) => commandName(arg))];
  if (names.some((name) => name === "python" || name === "python3")) return "python";
  if (names.some((name) => name === "node" || name === "bun" || name === "deno")) return "js";
  return undefined;
}


function inspectShellSegment(segment) {
  const tokens = shellWords(segment);
  if (tokens.length === 0) return undefined;

  const commandIndex = effectiveCommandIndex(tokens);
  if (commandIndex < 0 || commandIndex >= tokens.length) return undefined;
  const command = commandName(tokens[commandIndex]);
  const args = tokens.slice(commandIndex + 1);

  if (command === "eval") return inspectShellScript(args.join(" "));

  if (command === "rm") return finding("rm command detected", segment);
  if (command === "find" && args.includes("-delete")) return finding("find -delete detected", segment);
  if (command === "truncate") return finding("truncate command detected", segment);
  if (command === "dd" && args.some((arg) => /^of=/.test(arg))) return finding("dd writing to output file detected", segment);
  if (command === "rsync" && args.some((arg) => arg === "--delete" || arg.startsWith("--delete-"))) return finding("rsync --delete detected", segment);

  if (command === "git") {
    if (args[0] === "clean" && args.some((arg) => /^-[A-Za-z]*f/.test(arg)) && args.some((arg) => /^-[A-Za-z]*[dxX]/.test(arg))) {
      return finding("git clean force-delete detected", segment);
    }
    if (args[0] === "reset" && args.includes("--hard")) return finding("git reset --hard detected", segment);
    if (args[0] === "push" && args.some((arg) => arg === "--force" || arg === "-f" || arg.startsWith("--force-"))) return finding("git push force detected", segment);
  }

  if (command === "docker" && isDangerousDocker(args)) return finding("destructive docker command detected", segment);
  if (command === "kubectl" && args[0] === "delete") return finding("kubectl delete detected", segment);
  if (command === "helm" && args[0] === "uninstall") return finding("helm uninstall detected", segment);
  if (command === "terraform" && args[0] === "destroy") return finding("terraform destroy detected", segment);

  if (SHELLS.has(command)) {
    const inline = inlineShellCommand(args);
    if (inline) return inspectShellScript(inline);
  }

  const sql = destructiveSqlReason(segment);
  if (sql && isDbShellExecution(command, args, segment)) {
    return finding(`destructive SQL detected in shell DB execution: ${sql}`, segment);
  }

  return undefined;
}

function isDangerousDocker(args) {
  if (args[0] === "volume" && args[1] === "rm") return true;
  if (args[0] === "system" && args[1] === "prune" && args.includes("--volumes")) return true;
  if (args[0] === "compose" && args[1] === "down" && (args.includes("-v") || args.includes("--volumes"))) return true;
  return false;
}

function inlineShellCommand(args) {
  for (let i = 0; i < args.length; i += 1) {
    if (/^-[A-Za-z]*c[A-Za-z]*$/.test(args[i]) && typeof args[i + 1] === "string") return args[i + 1];
  }
  return undefined;
}

function isDbShellExecution(command, args, segment) {
  if (DB_COMMANDS.has(command)) return true;
  if (args.some((arg) => DB_COMMANDS.has(commandName(arg)))) return true;
  if (["python", "python3", "node", "bun", "deno"].includes(command) && DB_CODE_RE.test(segment)) return true;
  return false;
}

function destructiveSqlReason(text) {
  if (SQL_DROP_RE.test(text)) return "DROP";
  if (SQL_TRUNCATE_RE.test(text)) return "TRUNCATE";
  if (SQL_DELETE_RE.test(text)) return "DELETE FROM";

  const update = text.match(SQL_UPDATE_RE);
  if (update) {
    const tail = text.slice(update.index ?? 0, Math.min(text.length, (update.index ?? 0) + 500));
    const statement = tail.split(";")[0] ?? tail;
    if (!/\bWHERE\b/i.test(statement)) return "UPDATE without WHERE";
  }

  return undefined;
}

function splitShellSegments(script, nested) {
  const segments = [];
  let current = "";
  let quote = undefined;
  let escaped = false;

  for (let i = 0; i < script.length; i += 1) {
    const ch = script[i];
    const next = script[i + 1];

    if (escaped) {
      current += ch;
      escaped = false;
      continue;
    }

    if (ch === "\\") {
      current += ch;
      escaped = true;
      continue;
    }

    if (quote === "'") {
      current += ch;
      if (ch === "'") quote = undefined;
      continue;
    }

    if (quote === '"') {
      if (ch === "$" && next === "(") {
        const collected = collectBalanced(script, i + 2);
        if (collected) {
          nested.push(collected.value);
          current += "$(...)";
          i = collected.end;
          continue;
        }
      }
      current += ch;
      if (ch === '"') quote = undefined;
      continue;
    }

    if (ch === "'") {
      current += ch;
      quote = "'";
      continue;
    }

    if (ch === '"') {
      current += ch;
      quote = '"';
      continue;
    }

    if (ch === "`") {
      const end = findClosingBacktick(script, i + 1);
      if (end >= 0) {
        nested.push(script.slice(i + 1, end));
        current += "`...`";
        i = end;
        continue;
      }
    }

    if (ch === "$" && next === "(") {
      const collected = collectBalanced(script, i + 2);
      if (collected) {
        nested.push(collected.value);
        current += "$(...)";
        i = collected.end;
        continue;
      }
    }

    if (ch === "\n" || ch === ";" || ch === "|" || (ch === "&" && script[i - 1] !== ">")) {
      pushSegment(segments, current);
      current = "";
      if ((ch === "|" && next === "|") || (ch === "&" && next === "&")) i += 1;
      continue;
    }

    current += ch;
  }

  pushSegment(segments, current);
  return segments;
}

function pushSegment(segments, segment) {
  const trimmed = segment.trim();
  if (trimmed) segments.push(trimmed);
}

function collectBalanced(text, start) {
  let depth = 1;
  let quote = undefined;
  let escaped = false;

  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      escaped = true;
      continue;
    }
    if (quote) {
      if (ch === quote) quote = undefined;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") {
      quote = ch;
      continue;
    }
    if (ch === "(") depth += 1;
    if (ch === ")") depth -= 1;
    if (depth === 0) return { value: text.slice(start, i), end: i };
  }

  return undefined;
}

function findClosingBacktick(text, start) {
  let escaped = false;
  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      escaped = true;
      continue;
    }
    if (ch === "`") return i;
  }
  return -1;
}

function shellWords(segment) {
  const words = [];
  let current = "";
  let quote = undefined;
  let escaped = false;

  for (let i = 0; i < segment.length; i += 1) {
    const ch = segment[i];
    if (escaped) {
      current += ch;
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      escaped = true;
      continue;
    }
    if (quote) {
      if (ch === quote) quote = undefined;
      else current += ch;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      continue;
    }
    if (/\s/.test(ch)) {
      if (current) {
        words.push(current);
        current = "";
      }
      continue;
    }
    current += ch;
  }

  if (current) words.push(current);
  return words;
}

function effectiveCommandIndex(tokens) {
  let i = 0;
  while (i < tokens.length && isAssignment(tokens[i])) i += 1;

  while (i < tokens.length) {
    if (isAssignment(tokens[i])) {
      i += 1;
      continue;
    }
    const cmd = commandName(tokens[i]);
    if (!cmd || SHELL_KEYWORDS.has(cmd)) {
      i += 1;
      continue;
    }
    if (SHELL_WRAPPERS.has(cmd)) {
      i = skipWrapperOptions(tokens, i + 1, cmd);
      continue;
    }
    if (cmd === "env") {
      i = skipEnvOptions(tokens, i + 1);
      continue;
    }
    if (cmd === "xargs") return xargsCommandIndex(tokens, i + 1);
    return i;
  }

  return -1;
}

function skipWrapperOptions(tokens, start, command) {
  if (command === "command") return skipCommandOptions(tokens, start);

  let i = start;
  if (command === "sudo") {
    while (i < tokens.length) {
      const token = tokens[i];
      if (token === "--") return i + 1;
      if (!token.startsWith("-") || token === "-") return i;
      i += 1;
      if (takesOptionValue(token, SUDO_FLAGS_WITH_VALUE)) i += 1;
    }
    return i;
  }

  if (command === "time") {
    while (i < tokens.length) {
      const token = tokens[i];
      if (token === "--") return i + 1;
      if (!token.startsWith("-") || token === "-") return i;
      i += 1;
      if (takesOptionValue(token, TIME_FLAGS_WITH_VALUE)) i += 1;
    }
    return i;
  }

  if (command === "nice") {
    while (i < tokens.length) {
      const token = tokens[i];
      if (token === "--") return i + 1;
      if (/^-\d+$/.test(token)) {
        i += 1;
        continue;
      }
      if (!token.startsWith("-") || token === "-") return i;
      i += 1;
      if (takesOptionValue(token, NICE_FLAGS_WITH_VALUE)) i += 1;
    }
    return i;
  }

  if (tokens[i] === "--") return i + 1;
  return i;
}

function skipCommandOptions(tokens, start) {
  let i = start;
  while (i < tokens.length) {
    const token = tokens[i];
    if (token === "--") return i + 1;
    if (token === "-p") {
      i += 1;
      continue;
    }
    if (token === "-v" || token === "-V") return tokens.length;
    if (token.startsWith("-") && token !== "-") return tokens.length;
    return i;
  }
  return i;
}

function takesOptionValue(token, flagsWithValue) {
  const flag = token.includes("=") ? token.slice(0, token.indexOf("=")) : token;
  if (!flagsWithValue.has(flag)) return false;
  if (token.includes("=")) return false;
  if (/^-[A-Za-z].+/.test(token) && !token.startsWith("--")) return false;
  return true;
}

function skipEnvOptions(tokens, start) {
  let i = start;
  while (i < tokens.length) {
    const token = tokens[i];
    if (token === "--") return i + 1;
    if (isAssignment(token)) {
      i += 1;
      continue;
    }
    if (!token.startsWith("-") || token === "-") return i;
    i += 1;
    if (takesOptionValue(token, ENV_FLAGS_WITH_VALUE)) i += 1;
  }
  return i;
}

function xargsCommandIndex(tokens, start) {
  for (let i = start; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (token === "{}") continue;
    if (token.startsWith("-")) {
      const flag = token.length > 2 ? token.slice(0, 2) : token;
      if (XARGS_FLAGS_WITH_VALUE.has(flag) && token.length === 2) i += 1;
      continue;
    }
    return i;
  }
  return -1;
}


function isAssignment(token) {
  return /^[A-Za-z_][A-Za-z0-9_]*=.*/.test(token);
}

function commandName(token) {
  const raw = String(token ?? "").replace(/^['"]|['"]$/g, "").trim();
  const cleaned = raw.replace(/^[({]+/, "").replace(/[)}]+$/, "") || raw;
  const parts = cleaned.split(/[\\/]/);
  return (parts[parts.length - 1] ?? cleaned).toLowerCase();
}

function finding(reason, raw) {
  return { reason, snippet: snippet(raw) };
}

function snippet(raw) {
  const text = String(raw ?? "").replace(/\s+/g, " ").trim();
  return text.length > 1000 ? `${text.slice(0, 1000)}...` : text;
}

function mcpToolSegment(toolName) {
  return String(toolName ?? "").replace(/^mcp__/, "");
}

function safeJson(value) {
  try {
    return JSON.stringify(value ?? {});
  } catch {
    return String(value ?? "");
  }
}
