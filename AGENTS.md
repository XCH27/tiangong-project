# AGENTS.md — collaboration and code-development rules

Mandatory entry for every executing agent. Read this file, then only the documents your task routes
to. Do not preload the whole `docs/` tree.

## Current boundary

- `app/` is **unmodified official Craft Agents v0.13.4**. `scripts/check-upstream-delta.py` enforces
  zero undeclared difference from the pin; every change you make must earn a line in
  [`docs/UPSTREAM-DELTA.tsv`](docs/UPSTREAM-DELTA.tsv).
- The owner's order is **documentation and preparation → joint walkthrough of original Craft →
  approved rectification slices → implementation and acceptance → added capabilities.**
- The one slice currently authorized is **R1 shell and context rectification** (sidebar, Board,
  right panel, new-conversation layout, composer model/reasoning/permission). Its contract is
  [`docs/specs/R1-one-boundary-language.md`](docs/specs/R1-one-boundary-language.md); the checklist
  is in [`TODO.md`](TODO.md). Everything outside it needs its own approval.
- A 2026-09-22 attempt at this slice was rejected and reverted. The owner's words:
  「你的很多修改是完全错误的，我只让你修改所有对话和项目等模块，你却随意修改了其他部份，而且你的UI
  设计没有遵循原版的配色间距设计风格，交互逻辑和排版方案也没使用两个参考项目的，完全自己随意创建了
  一套」. Rules 1–3 below exist so that does not happen again.

## Read this first

[`docs/PROJECT-SPEC.md`](docs/PROJECT-SPEC.md) is the single authority on what Fleet is and is not.
Where another document disagrees, it wins. In one line: **Craft Agents decides the look and the
runtime base; Cindy decides how features are built and how surfaces talk to the backend; ZCode is
the layout and interaction reference for the conversation shell and composer; OpenChamber decides
Git and GitHub; the canvas, documents and video are Fleet's own.**

## Rules

1. **Port, do not invent.** Almost every surface already exists in Craft, and the surfaces being
   rectified exist in Cindy or ZCode. Before writing a line, open the upstream component and the
   reference component and diff them (see *Before you write UI*). Take their structure, layout and
   interaction; apply only Craft's colour, spacing, radius, type and motion tokens. If you cannot
   name why your version differs from the reference, the difference is an invention.
2. **Change only what the slice names.** Do not touch neighbouring surfaces, shared styles or
   unrelated behaviour. A change outside the slice needs its own approval.
3. **Never create a second authority.** One Session store, one permission path, one timeline, one
   task store, one settings home. Extend the existing owner.
4. **Simplifying is not deleting.** A control, page or function that disappears must have a named
   new home, declared as `L2` in `docs/UPSTREAM-DELTA.tsv`. `scripts/check-orphaned-components.py`
   flags components upstream mounts and we do not.
5. **Decide with evidence; ask only what is genuinely the owner's.** Research how Codex, Claude
   Code, Cursor and the reference projects solve the problem, then propose the landing path. Do not
   ask the owner how they want something designed. Report designs and landing plans for
   confirmation before large implementation.
6. **Keep the task fixed.** Do not silently change the request, acceptance, tests or harness.
7. **Halt after two non-progressing attempts.** Preserve evidence and report the smallest next
   decision.
8. **Check reality first.** Existence, installation, running process, permission, input path —
   cheapest checks first. A missing tool or preview is a classified limitation, not permission to
   rebuild infrastructure.
9. **Report status with the fixed vocabulary only:** `usable` · `wired but not visually checked` ·
   `display-only` · `not implemented`. "Tests pass" is never a capability status.
10. **Documentation serves implementation.** Update the canonical document whose contract changed;
    absorb, relink, then delete superseded material. No dated progress reports, duplicate plans or
    in-tree archives. Git history is the archive. Documentation is English-first; keep Chinese for
    exact owner quotations and `zh-Hans` UI literals.
11. **Do not dispatch sub-agents to decide design, layout or architecture**, and do not dispatch
    them casually at all (owner: 「不要乱派子智能体」). They arrive without this context and invent.

## Routing

| Your task involves… | Read |
|---|---|
| What Fleet is, scope, capability status, terms | [`docs/PROJECT-SPEC.md`](docs/PROJECT-SPEC.md) |
| What to do now / what comes next | [`TODO.md`](TODO.md), then the linked spec in [`docs/specs/`](docs/specs/) |
| "Is this already decided?", hard constraints, the owner's exact words | [`docs/DECISIONS.md`](docs/DECISIONS.md) |
| Architecture, code entry points, Craft capability classification | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) |
| **Any rendered value, layout or motion** | [`DESIGN.md`](DESIGN.md) — mandatory before UI code |
| Building or changing a component; upstream-delta layers | [`docs/COMPONENT-GUIDELINES.md`](docs/COMPONENT-GUIDELINES.md) |
| Pages, panels, surface IDs | [`docs/PAGE-STRUCTURE.md`](docs/PAGE-STRUCTURE.md) |
| Workflow, gates, tests, commits | [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) |
| Plugins, Skills, component distribution | [`docs/REGISTRY.md`](docs/REGISTRY.md) |
| Building and packaging for Windows, macOS, Linux; updates | [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) |
| Which open-source project to reference for what, and where | [`docs/REFERENCES.md`](docs/REFERENCES.md) |
| One closed feature loop in depth | [`docs/features/`](docs/features/) |
| Raw research evidence | [`docs/research/`](docs/research/) |
| Release history and resets | [`CHANGELOG.md`](CHANGELOG.md) |

## Preflight

```bash
bash scripts/init.sh
```

It wires the commit gates (`core.hooksPath` is not carried by a clone), checks the toolchain, and
checks that both Craft pins are on their pins. `源码参考/` and `UI参考/` are symlinks into
`/Volumes/AIGC/天工参考/` and are not tracked. When the volume is not mounted, every "compare the
reference first" step is unexecutable — report it and stop rather than work from memory.

```bash
git -C 源码参考/software/craft-agents-oss-v0.10.5 describe --tags   # look pin: exactly v0.10.5
git -C 源码参考/software/craft-agents-oss describe --tags           # rolling pin: must equal app/ (v0.13.4)
```

These checkouts carry their own `.git`. A `checkout` run inside one silently moves the baseline.

## Before you write UI

### Step 0 — open the upstream and reference components and diff them

```bash
U=源码参考/software/craft-agents-oss
diff app/apps/electron/src/renderer/<path> $U/apps/electron/src/renderer/<path>
```

For the R1 surfaces, also open the named Cindy and ZCode components listed in the R1 spec and in
[`docs/REFERENCES.md`](docs/REFERENCES.md). Read what they do, then justify each delta. Real cases
this step would have caught: a button given `h-7` because `size="sm"` "looked too big" while
upstream uses `size="sm"` everywhere; a dropdown hand-rolled from `<button>` rows beside a sibling
using `Popover` + `cmdk`; a picker rebuilt next to two steps that already use
`AddWorkspace_RadioOption`.

**Never produce a concept mockup or redesign image as implementation input.** The reference is
source code, not a picture you drew.

### Then the values

[`DESIGN.md`](DESIGN.md) — colours, opacity ladder, type, radius, elevation, icon slots, shared
primitives, required states, and motion. The in-app `lint:ui-contract` guard was removed with the
original-source reset; restoring it is part of an approved slice, not a preparation patch.

## Owner protocol

- **Checkpoints — stop and get explicit approval before:** spending money or any irreversible or
  public effect (paid APIs, deletion, deployment, publication, external messages, merge to remote
  `main`); adding a production dependency or external service; creating or replacing an authority
  or security boundary (Session storage, permissions, credentials, migrations); choosing between
  materially different product outcomes or changing established behaviour; removing or re-pinning a
  reference project. Present **what · why · cost and risk · two or three options ·
  recommendation**, in words a non-programmer understands.
- **Proceed without approval:** reversible in-scope work, code organization and technical patterns,
  read-only inspection, tests, builds, fixing your own regression, documenting changed facts.
- **Acceptance:** every delivery states the outcome in plain language, the status, a short
  **CHECK THIS** list, and what was deliberately left unchanged. The owner judges look and feel —
  light and dark, `zh-Hans` and English, narrow windows — and accepts, which promotes the capability
  to `usable`, or names the mismatch for the next bounded fix. Agents own logic, data integrity and
  code quality. Show the running change; do not describe it.
- **Status meanings:** `usable` = real path verified and visible behaviour owner-accepted;
  `wired but not visually checked` = real path verified, visual acceptance pending; `display-only` =
  UI without real behaviour; `not implemented` = absent. "Mostly done" and "should work" are not
  statuses.
- **Duty to dissent:** if an instruction conflicts with a recorded decision or will lose data or a
  function, say so once with evidence, then follow the owner's call and record it in
  [`docs/DECISIONS.md`](docs/DECISIONS.md).
- **Test content is not product intent.** Session content, Project names and fixtures (for example
  the stock-trading test chats) are data, never requirements or defaults.
- **Reference projects are retained unless the owner decides otherwise.** Present target, evidence
  and recovery plan before removing or re-pinning one.

## Learned owner preferences

- Reviews must be deep and evidence-backed: paths, diffs, file:line. Survey-style reviews are
  rejected.
- Bound improvement work with measurable goals and stop conditions; no open-ended optimizing loops.
- Rectify the project, do not pile up documents (「我是要你整改项目而不是堆砌文档」).
- Fleet is not another pure coding-agent IDE; coding-agent forks are harness and interaction
  references, not the product shape.
