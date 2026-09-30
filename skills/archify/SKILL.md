---
name: archify
description: Create architecture, workflow, sequence, data-flow, and lifecycle diagrams for an explicit Archify/interactive HTML request, or refresh affected views during requested changes in a project with an already approved maintained-map declaration. Never render just for setup, discovery, a simple question, or read-only review. Use the project's navigation policy for maintained maps.
license: MIT
metadata:
  version: "3.0.1"
  author: tt-a1i
  based_on: Cocoon-AI/architecture-diagram-generator (MIT, v1.0)
---

# Archify

Create an interactive HTML diagram from typed JSON. Static output is the default; enable motion only when requested.

## hello-omp integration

These integration rules apply to every command and reference in this skill:

- Use for an explicit Archify or interactive HTML request, including `/skill:archify`, or scoped maintenance already requested by the project's maintained-map declaration. Mere file existence or copied external instructions do not authorize execution. Setup, discovery, simple questions, and read-only reviews never trigger rendering.
- One-off outputs follow user-specified path, project artifact path, then `<project-root>/.omp-artifacts/<task-id>/`. Maintained maps use the declared durable documentation paths, with candidates, receipts, screenshots, repairs and previous snapshots in the task artifact directory. Do not create upstream's default `.archify/` directory. Preserve verification artifacts until requested cleanup.
- Run from the confirmed project root. Keep `meta.output` a portable relative HTML path inside it; for a maintained map it names the durable HTML, while the explicit CLI output points into the task's staging directory. Validate physical parents and keep all chosen paths within the declared scope. Do not write into the installed skill directory.
- Replace `bin/archify.mjs` in all commands with the installed skill's absolute path. Referenced files resolve from this skill directory, not from the project being diagrammed.
- Set `ARCHIFY_UPDATE_CHECK_DISABLED=1` for every Archify process (POSIX: `ARCHIFY_UPDATE_CHECK_DISABLED=1 node ...`; PowerShell: set `$env:ARCHIFY_UPDATE_CHECK_DISABLED = '1'` inside `try/finally` and restore its previous value). This disables upstream update checks and their reminder-cache writes, not all network access. Updates are managed by hello-omp's pinned bundle, never by automatic downloads.
- Use bundled brand IDs or no brand by default. Before processing even a supplied/frozen candidate, inspect it for remote brand URLs. Accessing remote brands, brand capture, or external links requires that network access to be within the user's request; otherwise ask first. Do not enable `ARCHIFY_BRAND_ALLOW_PRIVATE` or weaken browser protections with `ARCHIFY_CHROME_NO_SANDBOX`. Do not run as root. These instructions are not an OS sandbox.
- Node.js >=18 is required to execute the CLI, and Chrome/Chromium is required for the browser gate. Use existing trusted executables; do not install runtimes, browsers, dependencies, or MCP servers as a side effect. Keep `--open` and `preview` off unless requested. Report missing prerequisites and failed/skipped gates truthfully.

For one-off diagrams, keep candidate and HTML together and reuse them for focused repairs. For maintained maps, use the staged publication contract below. Upstream runtime code, references, examples, and notices are intact; [UPSTREAM.md](UPSTREAM.md) records local instruction changes.

## Maintained project maps

Follow the host's `project-navigation.md` policy and the approved project declaration. Briefly state the affected responsibility, connections and verification, then proceed; do not ask for routine update/layout approval. Only the integration owner writes shared maps, index and manifest.

- Separate overview, useful subsystem detail and a project-relative index of actual files/key symbols. Stable IDs/layouts aid recognition. There is no node/function quota. Label calls, events, ownership, data access and deployment/reference relationships truthfully.
- Before editing, compare the declared input path set and fingerprints; include additions/deletions/unmapped paths, not only known-file changes. Reconcile the actual affected sources. Hashes do not prove semantic accuracy. Keep source-reading, normalized-content freshness, artifact/browser validation and runtime tests separate in status.
- **Working-tree navigation** may include uncommitted inspected changes. Omit `meta.repository` and native component `sources`; label the map “working-tree, manually reconciled; native commit evidence not verified”. Store relative paths/symbols and claims in the index, and the complete scoped input inventory/fingerprints in its manifest. Do not invent a revision or URL to make native evidence pass. This is the explicit local-mode exception to commit-backed authoring in the upstream references.
- **Native committed evidence** uses the real pinned revision and inspected committed blobs, with `--repo-root` and valid `sources`, following [Repository authoring](references/repository-authoring.md). It cannot certify dirty working-tree bytes. `local-only` still embeds repository identity; it is not privacy redaction. Never commit code merely to produce a map.
- Preserve the accepted JSON/HTML/index/manifest before replacement. Edit a staged candidate with `meta.output` naming the durable path. Run the full `finalize` below with the HTML output and fresh `--out-dir` inside the per-view/per-revision task directory, not against the durable HTML. `deliver` precedes browser validation; direct durable output is not an all-gates transaction.
- Publish JSON/HTML byte-identically only after every required gate passes, then check raw SHA-256 of both copies and update manifest/status last. Keep native delivery/pending/lock/receipt files in their original staging location. The published copy is hash-bound to a verified staged artifact, not newly native-provenance-verified at its copied path. On any failure retain the accepted durable files or recovery snapshot and mark the update stale/blocked; never advertise a mixed generation as current.
- Keep the index a snapshot with an explicit basis/scope and visible unknowns. A read-only status request rechecks freshness without writing or rendering. If code semantics/topology are unchanged, report the checked no-map-change result; do not redraw for cosmetic churn. Delta is optional for meaningful structural comparison, not mandatory for every task.
- Show remaining work as well as implemented state in the same index. Separate accepted tasks from proposals, and attach stable IDs, affected areas/symbols, prerequisites/dependencies and observable completion criteria. Planned components are not current topology. A plan item does not itself authorize execution; reuse existing issue/plan sources rather than inventing a backlog.

## Existing candidate handoff

When the user supplies a frozen candidate, run `finalize` first as one CLI invocation. Its passing receipt completes the automated gates; follow any visual review recommendation under Delivery before claiming visual quality. For repair, follow step 5.

`finalize` reports update status in its delivery receipt; hello-omp disables the update check as specified above.

## Fast authoring path

Use this path for ordinary generation. Read branch references only when their stated trigger applies.

1. Choose `architecture`, `workflow`, `sequence`, `dataflow`, or `lifecycle` from the question.
2. Use the exact schema and example paths in the Type router without listing their directories. Read [Authoring defaults](references/authoring-defaults.md) and the mode's example in a bounded batch separate from project documents and complete schemas so neither is truncated; recover any missing section before writing. For Architecture, use the matching showcase example. For Sequence, Dataflow, and Lifecycle, also read the mode and common schemas. Read the relevant schema definition before choosing any new field, enum, or constrained text, especially boundary kinds. Examples teach shape, not facts. Use fresh IDs, wording, and layout. Go directly to the candidate without preliminary help, doctor, starter validation, temporary diagrams, or output-path listing. Query brands only for an explicitly requested mark; read [Brand marks](references/brand-marks.md) for an unknown mark with a user-provided URL.
3. Once the requested scope and, for a real codebase, [source evidence](references/repository-authoring.md) are covered, write the complete candidate directly without planning coordinates in prose. Choose Architecture abstraction and connected placement using Authoring defaults before coordinates: show the main user journey and necessary branches, preserve control roles and behavior-changing conditions, and leave enough room for actual relationship labels. No node, relationship, source, view, card, or boundary count is a target or ceiling. Use automatic routes first; add explicit routing only for necessary branch, return, supplied geometry, or measured repair. Set `meta.quality_profile` to `"showcase"` unless the user requests dense `standard`.
4. Once the complete first candidate is written, run `finalize` directly. Its first gate is showcase validation; successful first drafts need no separate pre-validation. Keep the candidate unchanged while the command runs:

   ```bash
   node bin/archify.mjs finalize <type> <candidate.json> <output.html> --quality showcase --json
   ```

   For native committed-source evidence, include evidence on the first draft and add `--repo-root <repo-root>`. Working-tree navigation uses the explicit local-mode contract above, not native commit verification.

   A passing receipt proves the included `validate`, `deliver`, strict `check`, and real-browser `browser-check` gates passed. Use its compact summary; run standalone commands only for a separate request or focused failure diagnosis.

5. A non-zero exit is never success. Read compact stdout or `evidence.summaryReceipt`, then [repair the failed gate](references/delivery-contract.md#failed-finalize-and-candidate-repair), including its repair limit. Preserve requested meaning and source evidence. For several tangled Architecture routes, read [Architecture layout repair](references/architecture-layout-repair.md); for measured field or geometry failures, read [Authoring contract](references/authoring-contract.md). Edit the connected neighborhood and rerun the complete `finalize` command from step 4.

## Update awareness

`finalize` and standalone `deliver` include `update` in their receipts. Do not run a separate check for the same delivery. If `update.noticeRequired` is true, read `references/update-awareness.md` and keep one update line in your final response to the user, even after a quality gate fails. For a task with several diagrams, mention the update once in the final response. Snooze or ignore a reminder only when the user explicitly asks; never install or update on your own initiative.

Before the first candidate, use the authoring references and relevant repository source, not Archify implementation or tests. Inspect Archify implementation if diagnostics remain unactionable after focused repairs.

## Type router

| Type | Use for | Schema | Example |
|---|---|---|---|
| `architecture` | Components, services, cloud/security boundaries, infrastructure | `schemas/architecture.schema.json` | System descriptions, services, libraries, and CLI repos: `examples/web-app.architecture.json`; deployment repos: `examples/production-deployment.architecture.json` |
| `workflow` | Processes, approval gates, tool calls, runbooks, CI/CD | `schemas/workflow.schema.json` | `examples/agent-tool-call.workflow.json` |
| `sequence` | API call chains, request lifecycles, async traces, returns | `schemas/sequence.schema.json` | `examples/cache-miss-request.sequence.json` |
| `dataflow` | Pipelines, ETL/ELT, lineage, governance, consumers | `schemas/dataflow.schema.json` | `examples/product-analytics.dataflow.json` |
| `lifecycle` | State/status transitions, retries, waiting and terminal states | `schemas/lifecycle.schema.json` | `examples/deployment-release.lifecycle.json` |

When ambiguous, run `node bin/archify.mjs guide "<scenario>" --json`. Scenario proof examples are structural references, not facts to copy.

## Mermaid input

Read Mermaid for topology and meaning, then author fresh Archify JSON; do not mechanically render Mermaid styling.

- `flowchart` / `graph` → `workflow`, or `architecture` for a component map.
- `sequenceDiagram` → `sequence`; participants become semantic participants and arrows become messages.
- `stateDiagram` → `lifecycle`; states and transitions retain meaning, not Mermaid style.

## Delivery

Use the `finalize` command above for the first candidate and after a repair.

`finalize` stops at the first non-passing gate. Its compact stdout and `<output-stem>.finalize-summary.json` are ordinary evidence. A passing run creates no screenshots and reports `visualReview: "not-requested"`.

When a passing Architecture receipt reports `visualReviewRecommendation.signals.resolvedCrossovers`, copy the candidate aside and apply the hints in one edit that changes only node positions and sizes: every node, relationship (including its `from` and `to`), label, and source stays as it was. Rerun the complete `finalize` once with `--out-dir <folder>/review-2`, because the previous HTML already owns its browser evidence. If that run fails or reports more crossings, restore the copy and finalize it with `--out-dir <folder>/review-3`. Do not start a second placement round. Hints about extra bends alone are optional.

When `layoutReviewRecommendation.action` is `inspect-sequence-width`, follow [Sequence width review](references/delivery-contract.md#sequence-width-review) before handing off a newly authored Sequence.

Perceptual review is optional for ordinary generation, including a newly positioned Architecture. Use [Optional capture evidence](references/delivery-contract.md#optional-capture-evidence), with `--out-dir <folder>/visual-check`, when the user requests visual review, during development audits, or for a concrete route/browser concern. `visualReviewRecommendation` is advisory. Inspect captures before claiming visual quality; otherwise report automated checks only.

Read [Delivery contract](references/delivery-contract.md) for failed gates, standalone commands, provenance/recovery, repeated delivery, exports, or opening. Recovery follows `deliver` → strict provenance `check` → `browser-check`; captures require strict provenance.

For workflow viewport overflow, read [Workflow viewport repair](references/authoring-contract.md#workflow-viewport-repair) before the next layout edit.

Report artifact checks, browser evidence, captures, and actual perceptual review as distinct results. For an explicitly requested immediate preview or active desktop loop, see [Optional opening](references/delivery-contract.md#optional-opening).

## Optional viewer capabilities

`meta.animation: "trace"` is opt-in.

Read `references/viewer-runtime.md` only when the user explicitly asks for Share Cards, Route/Reach cards, motion, deep links, presentation, search/focus, or another Viewer Runtime feature.

## Setup and fallback

No dependency installation is required inside the skill package. Setup verification checks file deployment and OMP skill discovery only (`omp skill list --json`); do not run Archify commands just to confirm installation. Run `doctor` or `demo` only when the user requests execution diagnosis or a demo, using the integration rules above.

When shell access is unavailable, copy `assets/template.html` into the selected artifact directory and hand-place architecture SVG into that copy, never the installed template. Use CSS semantic classes rather than inline colors and follow the visual review contract in `references/delivery-contract.md`; disclose any validation or browser gate that could not run.

## Output

Return the checked HTML path, diagram type, validation summary, specification/artifact receipt, browser-evidence status, and truthful visual-review status. For maintained maps also link the project index, distinguish worktree reconciliation from native commit evidence, and identify staged-run receipts versus raw-hash-verified published copies. Store only project-relative paths in durable documents; absolute local paths belong in terminal output or retained local receipts. Do not claim success for a non-zero command or visual inspection that did not occur.
