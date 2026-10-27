# Elephant-Goldfish Model provenance

- Source: https://github.com/google/elephant-goldfish-model
- Commit: `3d0b34821ce88ad328b0c9bf0e06d7eb5f1cd669` (2026-10-24)
- License: Apache License 2.0 — full text in [EGM-LICENSE](EGM-LICENSE). The upstream tree has no NOTICE file.

This skill is not a vendored copy of the EGM plugin. When the upstream repository is installed as a plugin, OMP 18.12.6 loads its skills through the Agent Skills validator, which rejects every upstream `SKILL.md` (the `disable-model-invocation` field is not allowed there); copied into a skills folder instead, the field only hides the skill from the model. Either way the upstream plugin is designed for explicit user invocation, so hello-omp keeps only the review method and adapts it so the main session can start it on its own judgment.

## Derived files and changes

| File | Derived from | Changes |
|---|---|---|
| `lenses/zoom-out.md` | `agents/zoom_out.md`, `resources/document_standards/zoom-out-standard.md` | Translated to Korean, condensed, BRAINSTORM mode and output format removed (the output contract lives in `agents/design-reviewer.md`), scope boundary added |
| `lenses/design-critic.md` | `agents/design_critic.md`, `resources/document_standards/feature-spec-standard.md` | Translated, condensed, risk checklist extended with invariants under concurrency/partial failure/retry/rollback, concurrency ownership, impact on other consumers of shared resources, call/storage/quota cost estimates, success metrics, rollout/rollback and observability |
| `lenses/comprehension.md` | `agents/comprehension.md`, `resources/document_standards/re-implementation-standard.md` | Translated, condensed, BRAINSTORM mode removed |
| `lenses/implementation-readiness.md` | `agents/implementation_readiness.md`, `resources/document_standards/implementation-readiness-standard.md` | Translated, condensed, data/operations change and plan consistency checks added |
| `lenses/codebase-details.md` | `agents/codebase_details.md`, `resources/document_standards/implementation-readiness-standard.md` | Translated and refocused from documenting existing code to checking a pre-implementation design against the code it references |
| `design-doc.md` | `skills/egm_draft/references/design_doc.md` | Translated, condensed; success metrics, constraints, invariants with their enforcement point and an evidence section (prototypes/experiments) added; CUJs renamed to main flows |
| `SKILL.md` | `skills/egm_review/SKILL.md`, `skills/egm_resolve/SKILL.md`, `docs/harnesses.md` | Rewritten: model-invoked only for design-dominated work (multi-module integration, version porting, costly open alternatives) or on user request; a one-stage basic path (Design Critic, plus Codebase Details in parallel) and a three-stage full path; one generic reviewer agent; the main session triages findings (fix/contest/user decision), may close a Blocker with evidence and re-runs a stage only when the fix changed a design decision; one re-review per procedure; review log kept outside the reviewed document; isolated exploratory prototypes allowed before review |
| `../../agents/design-reviewer.md` | Core Mandates and Output Format of `agents/*.md` | Translated, merged into one read-only reviewer contract, incomplete-review rule added |

Not adopted: brainstorm, draft, bootstrap, drift report, synthesizer, structural and style personas, Heilmeier standard.

## Updating

Pin an explicit commit, diff the upstream personas, standards and review skill against the commit above, port only method changes into the derived files, and update this table and the commit. Do not install the upstream plugin as a substitute.

## License

The derived files in the table above, including `../../agents/design-reviewer.md`, are modifications of Apache License 2.0 material and remain under Apache License 2.0 ([EGM-LICENSE](EGM-LICENSE)). The repository's root MIT license does not apply to them.
