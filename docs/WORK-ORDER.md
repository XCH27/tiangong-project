# Work Order — active execution projection

> [`05-ROADMAP.md`](05-ROADMAP.md) owns release order. This file is only the short execution
> projection for the one ACTIVE release; it is not a second roadmap, dispatch board, Wave system or
> ownership register. An explicit owner Goal still overrides the default slice without widening it.

## Active contract

| Release | Objective | Entry contract | Current status |
|---|---|---|---|
| R0 — Craft v0.13.3 baseline stabilization | Explain and stabilize the current dirty tree; close security/recovery gaps; remove or disconnect dead residue; calibrate capability status; prove a runnable baseline | [`specs/R0-baseline-audit.md`](specs/R0-baseline-audit.md) | **ACTIVE** — no clean-tree, green-build, release or visual-acceptance claim yet |

R0 does **not** restore the v0.10.5 shell, recreate `fleet-baseline-r0`, resume the old R0-C7
walkthrough, replace `AppShell`, build a production canvas, add a relay/RemoteTarget, or implement a
marketplace. Those were different contracts or later releases.

## One-slice execution

1. Read root `AGENTS.md`, `PRODUCT.md`, the R0 spec and the exact capability row touched.
2. Run `git status --porcelain`; select one coherent behavior/authority group and preserve all
   unrelated changes.
3. Confirm current code and production callers with `rg`; compare the two Craft pins for
   `REUSE`/`EXTEND` work. File presence, tests or a type alone do not prove a wired capability.
4. Keep, fix or drop the group. Retained behavior includes relevant denied/offline/retry/recovery
   paths and never creates a second authority.
5. Run the cheapest sufficient targeted checks. After all groups settle, run the complete R0
   verification ladder and synchronize only canonical facts that changed.

Material deletion, public/network effects, paid dependencies, pushing, releases and new/replaced
authorities remain owner checkpoints. Normal reversible fixes inside the current baseline do not.

## Queue after R0

This table is a compact mirror of the roadmap, included only so an executor can see the next
dependency edge. The roadmap wins if the two disagree.

| Release | Outcome | State / unlock |
|---|---|---|
| R1 | One Session authority and create flow; Project=folder; zh-Hans | **CLOSED** — old shell-restore program replaced; current checks live in R0 |
| R2 | Remove or honestly disable inherited Craft-operated services | **DEP:** R0 |
| R3 | First real intent→evidence→Markdown→review→delivery chain | **DEP:** R0 + R2 |
| R4 | Caller-aware governed action seam from two real callers | **DEP:** R3 |
| R5 | ArtifactRef from one real producer→consumer handoff | **DEP:** R3 |
| R6 | Bounded delegation and contract gates over current Session/Task mechanisms | **DEP:** R4 + R5 |
| R7 | One production canvas for images, video, websites and decks | **DEP:** R4 + R5; includes its minimum pane-host seam |
| R8 | Promote the proven chain to a finite workflow DAG | **DEP:** R4 + R5 |
| R9 | Layered memory with one consolidation writer | **GATED:** repeated completed R3 chains |
| R10 | Native design and web authoring on the R7 canvas | **DEP:** R4 + R5 + R7 |
| R11 | First cancellable image-generation Job loop | **DEP:** R4 + R5 |
| R12 | Video/audio sequence editing and delivery | **DEP:** R11 |
| R13 | Deck and motion modes on the R7 canvas | **DEP:** R7 |
| R14 | User-owned remote Workspace, messaging and Git/GitHub delivery | **DEP:** R6 |
| R15 | Skill/plugin/MCP marketplace and Assistant loadouts | **DEP:** R2 + R6 + R9; requires an activation spec |
| R16 | General external-computer control | **CLOSED `NO_GAP`:** outside Fleet; no implementation queue |
| R17 | Evidence-based adaptive policy or `NO_GAP` | **DEP:** R6 + R9 + R12 |
| R18 | Generalized docking/layout beyond the first pane seam | **GATED:** two real production panes demonstrate the need |

Remote Workspace transport is R14, not marketplace authority. The current R0 may repair an already
modified listener or pairing path, but it does not design a new remote product. GitHub is durable
delivery, not a second file-sync channel.

## Definition of done

- A real caller reaches the authoritative state path and the result returns to the production
  surface.
- Relevant normal, empty, denied, offline, cancel/retry and recovery states are observable.
- Targeted tests and applicable type/lint checks pass; R0 additionally requires `validate:dev` and a
  non-interactive launch smoke.
- The capability map, matrix, page architecture, module registry and code map do not claim more than
  the current tree.
- Reports use only `usable`, `wired but not visually checked`, `display-only` or `not implemented`.

## Handoff

```text
SLICE: <R0 behavior/authority group>
STATUS: usable | wired but not visually checked | display-only | not implemented
CHANGED: <exact paths>
AUTHORITY: <canonical store/contract>
EVIDENCE: <commands and observations>
RECOVERY: <denied/offline/retry/cancel behavior>
DOCS: <canonical facts updated, or none>
BLOCKER: <smallest unresolved owner decision, or none>
```

“Tests pass” and “page complete” never replace capability status or real-path evidence.
