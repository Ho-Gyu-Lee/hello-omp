import { stat } from "node:fs/promises";
import { basename, join, relative, resolve } from "node:path";

const rootArgument = process.argv[2];
if (!rootArgument) {
	console.error("Usage: bun scripts/validate-okf.ts <okf-directory>");
	process.exit(2);
}

const root = resolve(rootArgument);
try {
	if (!(await stat(root)).isDirectory()) throw new Error("path is not a directory");
} catch (error) {
	console.error(`ERROR: invalid OKF directory ${root}: ${error instanceof Error ? error.message : String(error)}`);
	process.exit(2);
}

const conceptPaths: string[] = [];
for await (const path of new Bun.Glob("**/*.md").scan({ cwd: root, onlyFiles: true })) {
	if (basename(path) !== "index.md" && basename(path) !== "log.md") conceptPaths.push(path);
}
conceptPaths.sort();

const errors: string[] = [];
for (const path of conceptPaths) {
	const displayPath = relative(root, join(root, path)).replaceAll("\\", "/");
	let content: string;
	try {
		content = await Bun.file(join(root, path)).text();
	} catch (error) {
		errors.push(`${displayPath}: cannot read UTF-8 Markdown: ${error instanceof Error ? error.message : String(error)}`);
		continue;
	}

	const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
	if (!frontmatter) {
		errors.push(`${displayPath}: missing or unterminated YAML frontmatter`);
		continue;
	}

	let metadata: unknown;
	try {
		metadata = Bun.YAML.parse(frontmatter[1]);
	} catch (error) {
		errors.push(`${displayPath}: invalid YAML frontmatter: ${error instanceof Error ? error.message : String(error)}`);
		continue;
	}

	if (metadata === null || typeof metadata !== "object" || Array.isArray(metadata)) {
		errors.push(`${displayPath}: YAML frontmatter must be a mapping`);
		continue;
	}

	const type = (metadata as Record<string, unknown>).type;
	if (typeof type !== "string" || type.trim().length === 0) {
		errors.push(`${displayPath}: required frontmatter field "type" must be a non-empty string`);
	}
}

if (errors.length > 0) {
	for (const error of errors) console.error(`ERROR: ${error}`);
	console.error(`OKF conformance failed: ${errors.length} error(s) across ${conceptPaths.length} concept(s)`);
	process.exit(1);
}

console.log(`OKF conformance OK (${conceptPaths.length} concepts)`);
