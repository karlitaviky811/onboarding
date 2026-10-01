# Skill Registry

**Delegator use only.** Agents that launch subagents read this registry, resolve the matching compact rule blocks, and inject them as `## Project Standards (auto-resolved)`. Subagents do not rediscover skills at runtime.

**Project**: onboarding-app  
**Generated**: 2026-09-30  
**Sources scanned**: `C:\Users\ktovar\.agents\skills`, `C:\Users\ktovar\.claude\skills`, `C:\Users\ktovar\.gemini\skills`, `C:\Users\ktovar\.cursor\skills`, `C:\Users\ktovar\.copilot\skills`, `C:\Users\ktovar\.kiro\skills`. The OpenCode skill directory does not exist. Project-local skill and convention directories contain no matching files.

## User Skills

| Trigger | Skill | Path |
|---|---|---|
| Angular TS/templates/styles/tests | angular-best-practices | `C:\Users\ktovar\.agents\skills\angular-best-practices\SKILL.md` |
| Angular Material or CDK | angular-best-practices-material | `C:\Users\ktovar\.agents\skills\angular-best-practices-material\SKILL.md` |
| Angular, RxJS, TypeScript, DI, frontend | angular-expert | `C:\Users\ktovar\.agents\skills\angular-expert\SKILL.md` |
| Clean/Hexagonal/DD design | architecture-patterns | `C:\Users\ktovar\.agents\skills\architecture-patterns\SKILL.md` |
| Writing or reviewing CSS/SCSS | clean-css | `C:\Users\ktovar\.agents\skills\clean-css\SKILL.md` |
| Find or install an agent skill | find-skills | `C:\Users\ktovar\.agents\skills\find-skills\SKILL.md` |
| Ports and Adapters boundaries | hexagonal-architecture | `C:\Users\ktovar\.agents\skills\hexagonal-architecture\SKILL.md` |
| Creating or preparing a PR | branch-pr | `C:\Users\ktovar\.claude\skills\branch-pr\SKILL.md` |
| PRs over 400 lines or chained review | chained-pr | `C:\Users\ktovar\.claude\skills\chained-pr\SKILL.md` |
| Guides, README, RFC, onboarding, architecture docs | cognitive-doc-design | `C:\Users\ktovar\.claude\skills\cognitive-doc-design\SKILL.md` |
| PR feedback, issues, reviews, collaboration comments | comment-writer | `C:\Users\ktovar\.claude\skills\comment-writer\SKILL.md` |
| Go tests, coverage, Bubbletea, goldens | go-testing | `C:\Users\ktovar\.claude\skills\go-testing\SKILL.md` |
| Creating GitHub issues, bug reports, feature requests | issue-creation | `C:\Users\ktovar\.claude\skills\issue-creation\SKILL.md` |
| Judgment Day or adversarial review | judgment-day | `C:\Users\ktovar\.claude\skills\judgment-day\SKILL.md` |
| New skills or agent instructions | skill-creator | `C:\Users\ktovar\.claude\skills\skill-creator\SKILL.md` |
| Commit splitting and reviewable work units | work-unit-commits | `C:\Users\ktovar\.claude\skills\work-unit-commits\SKILL.md` |

## Compact Rules

### angular-best-practices
- Use standalone components with `OnPush`, `inject()`, and signal APIs (`input`, `output`, `model`, `signal`, `computed`).
- Use `effect()` only for side effects; use `toSignal()` to bridge observable values into signal-driven views.
- Prefer `@if`, `@for`, and `@switch`; every `@for` needs `track`.
- Keep templates declarative: pure pipes, class bindings, semantic HTML, and keyboard-accessible controls.
- Use `takeUntilDestroyed()` or `async` pipe; put `catchError` inside `switchMap` when preserving an outer stream.
- Map transport DTOs at infrastructure boundaries and do not hardcode URLs or secrets.
- Test behavior and output, with factories/harnesses where suitable, not private implementation details.

### angular-best-practices-material
- Import standalone Material/CDK APIs selectively to preserve tree shaking.
- Use the Angular Material M3 theme system and CSS custom properties rather than ad-hoc themes.
- Prefer CDK primitives for overlays, virtual scroll, drag/drop, and accessibility behavior.
- Test Material components through component harnesses instead of internal DOM structure.
- Do not apply these rules to unrelated component libraries.

### angular-expert
- Keep components focused; extract business rules and orchestration into services or use cases.
- Prefer standalone components and `OnPush`; lazy-load feature routes where appropriate.
- Use strict TypeScript, explicit contracts, generics, and type guards; avoid `any`.
- Avoid nested subscriptions and leaks; use operators, `async` pipe, and explicit error handling.
- Test component/service behavior with correctly scoped mocks and asynchronous control.

### architecture-patterns
- Clarify domain boundaries, constraints, and validation targets before choosing an architecture.
- Define module boundaries, interfaces, and dependency direction explicitly.
- Select the smallest pattern appropriate to complexity; do not impose a large architecture on a local refactor.
- Provide migration steps and verification checks for architectural changes.
- Keep durable workflow concerns in the infrastructure layer when failure recovery matters.

### clean-css
- Reuse project tokens, CSS variables, mixins, and utilities; do not invent a parallel token system.
- Prefer flex/grid and `gap` over child margins, absolute positioning, or magic offsets.
- Keep selectors shallow, avoid `!important`, and remove declarations with no purposeful effect.
- Preserve visible focus, contrast, disabled states, and reduced-motion behavior.
- Make responsive constraints explicit and avoid fixed dimensions that block real content.
- Extract repeated style knowledge only when it represents the same design concept.

### find-skills
- Use this only when the user is seeking a potentially installable agent capability.
- Check the skills leaderboard before using a search command.
- Verify install count, source reputation, and repository stars before recommending a skill.
- Present the skill, source, usage, install command, and reference link concisely.
- Install only after the user explicitly agrees.

### hexagonal-architecture
- Keep domain code free of framework, transport, persistence, and SDK imports.
- Model use cases with explicit input/output contracts and ports for every side effect.
- Put outbound port interfaces near the consuming application layer; adapters implement them at the edge.
- Make composition/wiring explicit in one auditable composition root.
- Test domain rules directly, use cases with fakes, adapters by contract/integration, and journeys end to end.
- Migrate one vertical slice at a time, preserving behavior with characterization tests.

### branch-pr
- Link every PR to an approved issue and add exactly one `type:*` label.
- Use the validated `type/description` branch name format and conventional commits.
- Complete the repository PR template with summary, changes, test plan, and contributor checklist.
- Run required checks before merge; never bypass hooks without explicit instruction.
- Never add AI attribution or `Co-Authored-By` trailers.

### chained-pr
- Split changes exceeding 400 changed lines unless a maintainer explicitly accepts `size:exception`.
- Keep each PR to a single reviewable work unit, with tests and docs in that slice.
- Choose one chain strategy and do not mix strategies after it is selected.
- Include boundaries, dependencies, out-of-scope work, and the current-PR diagram in each child PR.
- Treat a polluted diff as a base issue: retarget or rebase before review.

### cognitive-doc-design
- Lead with the outcome or action, then reveal context progressively.
- Group related content into short chunks with clear headings and signposts.
- Prefer checklists, tables, and examples over prose the reader must memorize.
- Make the review path and intentionally out-of-scope items explicit.
- Use the repository template when it is stronger than the default documentation shape.

### comment-writer
- Start with the actionable observation or request.
- Be warm, direct, concise, and explain the technical reason when it matters.
- Focus on the highest-value feedback instead of piling on minor preferences.
- Match the user or thread language and avoid em dashes.
- End with a concrete next action when a change is requested.

### go-testing
- Prefer table-driven behavior tests with named `t.Run` scenarios.
- Use `t.TempDir()` for filesystem work and avoid real home-directory dependencies.
- Keep slow or external-command integration tests skippable under `testing.Short()`.
- Test Bubbletea state transitions directly; reserve `teatest` for interactive flows.
- Keep golden output deterministic and rerun without update mode after changing it.

### issue-creation
- Search for duplicates and use the repository bug or feature template, never a blank issue.
- Include every required field and pre-flight checkbox.
- Treat `status:approved` as mandatory before a linked implementation PR.
- Send questions to Discussions rather than creating an issue.
- Use conventional titles and preserve the template's automatic status workflow.

### judgment-day
- Run exactly two blind, independent reviewers with the same target and injected project standards.
- Wait for both verdicts and distinguish confirmed, suspect, contradictory, and theoretical findings.
- Ask before fixing confirmed Round 1 issues.
- Re-run both reviewers after every fix; only terminal verdicts are APPROVED or ESCALATED.
- Escalate after unresolved second-round issues instead of silently continuing.

### skill-creator
- Create a skill only for reusable, non-trivial patterns that need an LLM instruction contract.
- Follow a project style guide when present; otherwise use the required concise frontmatter and section order.
- Keep trigger words in a single-line, quoted description and omit `Keywords`.
- Move long examples and schemas into local `assets` or `references`.
- Register project skills in `AGENTS.md` when that index exists.

### work-unit-commits
- Make each commit one independently understandable behavior, fix, migration, or documentation unit.
- Do not split by file type; keep tests and relevant docs with the behavior they verify.
- Ensure each commit is coherent, reviewable, and reasonably reversible on its own.
- Use conventional commit messages that explain outcomes rather than file lists.
- Convert over-budget SDD work into chained slices according to the chosen delivery strategy.

## Project Conventions

| File | Path | Notes |
|---|---|---|
| — | — | No project-level convention index or instruction files were found. |

The project configuration itself establishes strict TypeScript, SCSS, Prettier, Angular standalone application tooling, and Vitest. See `tsconfig.json`, `angular.json`, `vitest.config.ts`, `.prettierrc`, and `.editorconfig` when a task touches those concerns.
