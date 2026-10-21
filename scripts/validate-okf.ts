import { stat } from "node:fs/promises";
import { join, posix, resolve } from "node:path";

// Validates an Open Knowledge Format v0.2 bundle (SPEC §11) and this repository's index policy.
//   concepts  YAML frontmatter with a non-empty `type` (OKF) and a non-empty `description` (index entries are built from it);
//             an optional `apply_on_edit` list of file globs (deploy-okf injects the concept when a session edits such a file)
//   index.md  no frontmatter (the bundle root may declare only okf_version); every concept entry `* [title](path) - description`
//             repeats the target's frontmatter title (or file name) and description; every concept is listed by an index.md
//             reachable from the root index.md through directory entries
//   log.md    no frontmatter; `## YYYY-MM-DD` date headings, newest first
// Concepts under learned/ are local knowledge. A repository checkout may still hold untracked legacy copies there, which
// deploy-okf migrates into the config folder, so they need an index entry only in a deployed bundle, where deploy-okf has
// generated learned/index.md from them.
// Usage: bun scripts/validate-okf.ts [--fix | --concepts-only] [--deployed] <okf-directory>
//   --fix            rewrite index entry titles and descriptions from the concepts' frontmatter, then validate
//   --concepts-only  check concept files only (deploy-okf checks local concepts this way before generating learned/index.md)
//   --deployed       the directory is a deployed bundle: concepts under learned/ must be listed as well

const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;
const ENTRY_START_PATTERN = /^[*-]\s+\[/;
const ENTRY_PATTERN = /^([*-])\s+\[(.+?)\]\((<[^<>]+>|[^\s()<>]+)\)\s+-\s+(.*?)(\r?)$/;
const URL_SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/i;
const HEADING_PATTERN = /^(#{1,6})\s+(.*?)\s*$/;
const ROOT_INDEX = "index.md";
const LOCAL_PREFIX = "learned/";

type Concept = { title: string; description: string };

function Collapse(text: string): string
{
    return text.replace(/\s+/g, " ").trim();
}

function IsIsoDate(text: string): boolean
{
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text))
    {
        return false;
    }

    const time = Date.parse(`${text}T00:00:00Z`);
    return !Number.isNaN(time) && new Date(time).toISOString().slice(0, 10) === text;
}

function ParseFrontmatter(content: string): { metadata: Record<string, unknown> } | { error: string } | null
{
    const match = content.match(FRONTMATTER_PATTERN);

    if (!match)
    {
        return null;
    }

    let metadata: unknown;

    try
    {
        metadata = Bun.YAML.parse(match[1]);
    }
    catch (error)
    {
        return { error: `invalid YAML frontmatter: ${error instanceof Error ? error.message : String(error)}` };
    }

    if (metadata === null || typeof metadata !== "object" || Array.isArray(metadata))
    {
        return { error: "YAML frontmatter must be a mapping" };
    }

    return { metadata: metadata as Record<string, unknown> };
}

// Bundle-relative target of an index link, or null for an external URL. Absolute links start at the bundle root.
function ResolveLink(indexRel: string, rawLink: string): string | null
{
    const link = rawLink.startsWith("<") ? rawLink.slice(1, -1) : rawLink;

    if (URL_SCHEME_PATTERN.test(link))
    {
        return null;
    }

    // Split the fragment first, so an encoded "#" (%23) in a file name survives as part of the path.
    let path = link.split("#")[0];

    try
    {
        path = decodeURIComponent(path);
    }
    catch
    {
        // Keep the raw path; a malformed escape simply fails the existence check below.
    }

    const base = posix.dirname(indexRel);
    let target = path.startsWith("/") ? path.slice(1) : posix.join(base === "." ? "" : base, path);
    target = posix.normalize(target);

    if (target === "." || target.endsWith("/"))
    {
        target = posix.join(target, ROOT_INDEX);
    }

    return target;
}

const KNOWN_FLAGS: Record<string, true> = { "--fix": true, "--concepts-only": true, "--deployed": true };
const argumentsList = process.argv.slice(2);
const fix = argumentsList.includes("--fix");
const conceptsOnly = argumentsList.includes("--concepts-only");
const deployed = argumentsList.includes("--deployed");
const unknownFlags = argumentsList.filter(argument => argument.startsWith("--") && KNOWN_FLAGS[argument] !== true);
const positional = argumentsList.filter(argument => !argument.startsWith("--"));

if (unknownFlags.length > 0 || positional.length !== 1 || (fix && conceptsOnly))
{
    console.error("Usage: bun scripts/validate-okf.ts [--fix | --concepts-only] [--deployed] <okf-directory>");
    process.exit(2);
}

const root = resolve(positional[0]);

try
{
    if (!(await stat(root)).isDirectory())
    {
        throw new Error("path is not a directory");
    }
}
catch (error)
{
    console.error(`ERROR: invalid OKF directory ${root}: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(2);
}

const conceptPaths: string[] = [];
const indexPaths: string[] = [];
const logPaths: string[] = [];

for await (const path of new Bun.Glob("**/*.md").scan({ cwd: root, onlyFiles: true }))
{
    const rel = path.replaceAll("\\", "/");
    const name = posix.basename(rel);

    if (name === "index.md")
    {
        indexPaths.push(rel);
    }
    else if (name === "log.md")
    {
        logPaths.push(rel);
    }
    else
    {
        conceptPaths.push(rel);
    }
}

conceptPaths.sort();
indexPaths.sort();
logPaths.sort();

const errors: string[] = [];
const concepts = new Map<string, Concept>();

// Concepts that exist but failed validation; index entries pointing at them are not reported a second time.
const invalidConcepts = new Set<string>();

for (const rel of conceptPaths)
{
    let content: string;

    try
    {
        content = await Bun.file(join(root, rel)).text();
    }
    catch (error)
    {
        errors.push(`${rel}: cannot read UTF-8 Markdown: ${error instanceof Error ? error.message : String(error)}`);
        invalidConcepts.add(rel);
        continue;
    }

    const parsed = ParseFrontmatter(content);

    if (parsed === null)
    {
        errors.push(`${rel}: missing or unterminated YAML frontmatter`);
        invalidConcepts.add(rel);
        continue;
    }

    if ("error" in parsed)
    {
        errors.push(`${rel}: ${parsed.error}`);
        invalidConcepts.add(rel);
        continue;
    }

    const { type, title, description, apply_on_edit: applyOnEdit } = parsed.metadata;
    let valid = true;

    if (typeof type !== "string" || type.trim().length === 0)
    {
        errors.push(`${rel}: required frontmatter field "type" must be a non-empty string`);
        valid = false;
    }

    if (typeof description !== "string" || description.trim().length === 0)
    {
        errors.push(`${rel}: required frontmatter field "description" must be a non-empty string (index entries are built from it)`);
        valid = false;
    }

    if (title !== undefined && (typeof title !== "string" || title.trim().length === 0))
    {
        errors.push(`${rel}: frontmatter field "title" must be a non-empty string when present`);
        valid = false;
    }

    // deploy-okf turns these globs into TTSR scope tokens tool:edit(<glob>), so parentheses, commas and spaces cannot appear.
    if (applyOnEdit !== undefined && (!Array.isArray(applyOnEdit) || applyOnEdit.length === 0 || applyOnEdit.some(glob => typeof glob !== "string" || !/^[^\s(),]+$/.test(glob))))
    {
        errors.push(`${rel}: frontmatter field "apply_on_edit" must be a non-empty list of file globs without spaces, parentheses or commas`);
        valid = false;
    }

    if (!valid)
    {
        invalidConcepts.add(rel);
        continue;
    }

    const displayTitle = typeof title === "string" ? title : posix.basename(rel, ".md");
    concepts.set(rel, { title: Collapse(displayTitle), description: Collapse(description as string) });
}

let fixedEntries = 0;

if (!conceptsOnly)
{
    const indexSet = new Set(indexPaths);
    const childIndexes = new Map<string, string[]>();
    const listedConcepts = new Map<string, Set<string>>();

    for (const rel of indexPaths)
    {
        const path = join(root, rel);
        const content = await Bun.file(path).text();
        const frontmatter = content.match(FRONTMATTER_PATTERN);

        if (frontmatter)
        {
            const parsed = ParseFrontmatter(content);

            if (rel !== ROOT_INDEX)
            {
                errors.push(`${rel}: index.md must not have frontmatter (OKF §8)`);
            }
            else if (parsed === null || "error" in parsed)
            {
                errors.push(`${rel}: ${parsed && "error" in parsed ? parsed.error : "unterminated frontmatter"}`);
            }
            else
            {
                const extraKeys = Object.keys(parsed.metadata).filter(key => key !== "okf_version");

                if (extraKeys.length > 0)
                {
                    errors.push(`${rel}: the root index.md frontmatter may declare only okf_version (OKF §8), found ${extraKeys.join(", ")}`);
                }
            }
        }

        const head = frontmatter ? frontmatter[0] : "";
        const lines = content.slice(head.length).split("\n");
        const lineOffset = head === "" ? 0 : head.split("\n").length - 1;
        const children: string[] = [];
        const listed = new Set<string>();
        let changed = false;
        let seenHeading = false;

        for (let i = 0; i < lines.length; i++)
        {
            const line = lines[i];

            if (HEADING_PATTERN.test(line))
            {
                seenHeading = true;
                continue;
            }

            if (!ENTRY_START_PATTERN.test(line))
            {
                continue;
            }

            const where = `${rel}:${lineOffset + i + 1}`;

            if (!seenHeading)
            {
                errors.push(`${where}: index entry before any section heading; entries are grouped under headings (OKF §8)`);
            }

            const match = line.match(ENTRY_PATTERN);

            if (!match)
            {
                errors.push(`${where}: malformed index entry; expected "* [Title](path) - description" (OKF §8)`);
                continue;
            }

            const [, bullet, entryTitle, rawLink, entryText, carriageReturn] = match;
            const target = ResolveLink(rel, rawLink);

            if (target === null)
            {
                continue;
            }

            if (target.startsWith("../"))
            {
                errors.push(`${where}: entry link ${rawLink} points outside the bundle`);
                continue;
            }

            if (posix.basename(target) === "index.md")
            {
                if (indexSet.has(target))
                {
                    children.push(target);
                }
                else
                {
                    errors.push(`${where}: entry links to ${rawLink}, but ${target} does not exist`);
                }

                continue;
            }

            if (invalidConcepts.has(target))
            {
                listed.add(target);
                continue;
            }

            const concept = concepts.get(target);

            if (!concept)
            {
                errors.push(`${where}: entry links to ${rawLink}, which is not a concept in this bundle`);
                continue;
            }

            listed.add(target);

            if (Collapse(entryTitle) === concept.title && Collapse(entryText) === concept.description)
            {
                continue;
            }

            if (fix)
            {
                lines[i] = `${bullet} [${concept.title}](${rawLink}) - ${concept.description}${carriageReturn}`;
                changed = true;
                fixedEntries++;
            }
            else
            {
                errors.push(`${where}: entry for ${target} differs from its frontmatter title or description; run with --fix`);
            }
        }

        if (!seenHeading)
        {
            errors.push(`${rel}: index.md has no section heading (OKF §8)`);
        }

        if (changed)
        {
            await Bun.write(path, head + lines.join("\n"));
        }

        childIndexes.set(rel, children);
        listedConcepts.set(rel, listed);
    }

    // Progressive disclosure: every concept must be reachable from the root index.md through directory entries.
    if (indexSet.has(ROOT_INDEX))
    {
        const reachable = new Set<string>([ROOT_INDEX]);
        const pending = [ROOT_INDEX];

        while (pending.length > 0)
        {
            for (const child of childIndexes.get(pending.pop()!) ?? [])
            {
                if (!reachable.has(child))
                {
                    reachable.add(child);
                    pending.push(child);
                }
            }
        }

        const covered = new Set<string>();

        for (const index of reachable)
        {
            for (const concept of listedConcepts.get(index) ?? [])
            {
                covered.add(concept);
            }
        }

        for (const rel of conceptPaths)
        {
            if (!covered.has(rel) && (deployed || !rel.startsWith(LOCAL_PREFIX)))
            {
                errors.push(`${rel}: not listed in any index.md reachable from the root index.md`);
            }
        }
    }

    for (const rel of logPaths)
    {
        const content = await Bun.file(join(root, rel)).text();

        if (FRONTMATTER_PATTERN.test(content))
        {
            errors.push(`${rel}: log.md must not have frontmatter (OKF §9)`);
        }

        let previous: string | null = null;
        const lines = content.split("\n");

        for (let i = 0; i < lines.length; i++)
        {
            const match = lines[i].match(HEADING_PATTERN);

            if (!match)
            {
                continue;
            }

            // Second-level headings group one day each; a heading at another level that starts with a digit is read as a date too.
            const [, level, date] = match;

            if (level.length !== 2 && !/^\d/.test(date))
            {
                continue;
            }

            if (!IsIsoDate(date))
            {
                errors.push(`${rel}:${i + 1}: log date heading "${date}" must be a YYYY-MM-DD date (OKF §9)`);
                continue;
            }

            if (previous !== null && date > previous)
            {
                errors.push(`${rel}:${i + 1}: log date ${date} comes after ${previous}; entries must be newest first (OKF §9)`);
            }

            previous = date;
        }
    }
}

if (fixedEntries > 0)
{
    console.log(`fixed ${fixedEntries} index entr${fixedEntries === 1 ? "y" : "ies"} from concept frontmatter`);
}

if (errors.length > 0)
{
    for (const error of errors)
    {
        console.error(`ERROR: ${error}`);
    }

    console.error(`OKF validation failed: ${errors.length} error(s) across ${conceptPaths.length} concept(s)`);
    process.exit(1);
}

const scope = conceptsOnly ? "concepts only" : `${indexPaths.length} index, ${logPaths.length} log`;
console.log(`OKF conformance OK (${conceptPaths.length} concepts; ${scope})`);
