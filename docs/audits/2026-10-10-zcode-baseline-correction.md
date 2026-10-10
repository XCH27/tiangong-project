# ZCode baseline correction — 2026-10-10

> **Date:** 2026-10-10
> **Role:** Docs correction on `work/fresh-base-spine`. Vella corrected the Lead: the product baseline is ZCode, not Craft Agents.
> **Ledger:** D56 in `docs/DECISIONS-LEDGER.md`.
> **Source inventory:** the 2026-10-10 ZCode correction ledger (KEEP / REWRITE / PARK / SUPERSEDE-BANNER). This note summarizes that inventory for this branch. It does not merge, revert, or delete history.
> **Capability:** documentation only. Nothing in this note is `usable`. No wave is Ready. `typecheck:all` is not claimed. The recorded #52 failure stands.
> **`docs/engineering.md`:** not present on this branch. The hard-rule banner is on root `README.md` and `AGENTS.md` only.

## Product baseline

**产品基线 = `.fleet/zcode`（ZCode）。** Ordered reconstruction notes stay in `patches/zcode/`. The local candidate `.fleet/zcode` is gitignored on this spine; do not delete it, and do not treat its absence from this checkout as permission to resume Craft.

Craft Agents, `app/`, and this spine's Exit 1–7 / D51 v0.11 pin / Electron desktop-loop evidence are interaction reference and historical audit. They are not the product base. Agents must not resume Craft-as-baseline.

D51–D55 stay on `docs/DECISIONS-LEDGER.md` as that audit. D56 says they do not authorize product migration onto the Craft pin.

## What this note keeps, parks, and banners

| Disposition | What | What an agent may do |
|---|---|---|
| **KEEP** (concept, port later) | HostTurnKernel: one kernel per session, durable turn ownership. Action-id honesty: refuse misowned frozen ids, freeze ids and owners before rebinding. Admission and permission-card patterns. | Port those ideas to the ZCode `AgentRuntime` under a later work order. Do not keep coding them on the Craft session kernel as the product. |
| **KEEP** (ideas, not the Craft binding) | D50 namespace honesty (`ownerKind`, not dot count). UI density / chrome-simplification notes in the older spine decisions. | Re-home under ZCode if a later order says so. The Craft pin does not travel with the idea. |
| **PARK** | Craft Electron Exit evidence: Exit 1 Mac tree, typecheck failure, Electron launch/relaunch, RPC project/turn/BrowserPane, board/settings route restores, Exit 3–5 and Exit 7 notes, the D51/D52 pin and behaviour ledger, and the W0.1 exit checklist / lead-unblock packet. | Read as reference. Do not open new Craft-migration or Exit desktop-loop work as the delivery path. |
| **SUPERSEDE-BANNER** | Those Exit and pin audits, plus the Craft-pin footnotes on `docs/WAVE-MODULE-MAP.md`. | The bodies stay. The banner says historical only, not a product gate, ZCode-first supersedes. |
| **REWRITE** (live gates only) | Entry text that said W0.1 Craft migration blocks the product: `README.md`, `AGENTS.md`, `docs/START-HERE.md`, the wave-map schedule row, `docs/PROJECT-DIRECTION.md` §12, and the other entry pages named below. | Product path is the ZCode candidate. Spine worker waves stay Locked. |

Not done in this pass, and not authorized by this note: changing the GitHub default branch, parking the Mac dirty `app/` tree, rewriting `docs/capabilities.md` / `docs/references.md` / an OV-024 gloss (those files are not this branch's correction set), deleting `.fleet/zcode`, or reverting merged PRs #39–#59.

## HostTurnKernel and action-id honesty (KEEP, port to ZCode)

These landed on Craft `session.jsonl`. The concepts stay valuable. The Craft binding does not.

- One host kernel per session, and durable turn ownership, port to ZCode `AgentRuntime`.
- Refuse a frozen action id used by the wrong owner. A human session flag is not a plugin id.
- Freeze the registry before adding ids: owners and policy columns stay stable, then rebind to ZCode surfaces later.
- Single owner id, permission card, and host admission stay patterns to re-home. They are not a finished product kernel.

## Craft Electron Exit evidence (PARK)

Exit 1–7 on this branch record a cancelled Craft-baseline attempt. The evidence includes a populated Mac tree at tag `v0.11.0` (`f4e172bf`), a failed `typecheck:all` (exit 2, missing `tsconfig.base.json`), Electron launch and relaunch from Craft logs, an RPC project create / session turn / `browser-pane:create`, route restores that are not an AX or menu click, a partial canonical-parity note, a version-gate on six proposed contracts, a logical persistence stance with the physical-store gate still open, and an ownership-domain note. This correction does not check any of those items off and does not invent a typecheck pass.

## Files this correction touches

Hard-rule banner: `README.md`, `AGENTS.md`.

Supersede banner: Exit 1 notes (`exit1-mac-checkout`, `exit1-electron-launch`, `exit1-rpc-loop`, `exit1-routes-migration`), Exit 3–5 and Exit 7 notes, the D51 pin / BLK-001 ledger, the Exit 6 namespace note, the W0.1 exit checklist, the lead-unblock packet, the lead-decisions note, the spine honesty audit, and the Craft-pin footnotes in `docs/WAVE-MODULE-MAP.md`.

Live-gate softening, without promoting a wave: `docs/START-HERE.md`, `docs/PROJECT-DIRECTION.md`, `docs/UPSTREAM-BASELINE.md`, `docs/DOCUMENT-READINESS.md`, `docs/README.md`, `docs/BOARD-SYNC.md`, `docs/COMPOSABLE-WORKSPACE-ARCHITECTURE.md`, `docs/PARALLEL-AGENT-OPERATING-MODEL.md`, `docs/modules/README.md`, `docs/modules/01-clean-craft-baseline.md`, and `docs/agent-packets/wave-0.1-control-plane-reconciliation.md`.

`app/` is not modified.
