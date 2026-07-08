# Wave Module Map

This file maps product modules to execution waves. It prevents a module spec from being implemented twice by different agents or split across waves without ownership.

The order below is derived from the full legacy corpus: product direction, decision ledger, architecture review, TeamRun/runtime specs, Internal Action Registry, capability loadout, UI simplification, and blueprint reviews.

## Execution Waves

| Wave | Purpose | Gate |
|---|---|---|
| Wave 0 | Lead-only contract freeze and dirty-tree cleanup | Shared contracts compile; forbidden files assigned. |
| U Track | Craft shell simplification and UI dedupe | No new shell; no new design tokens; settings IA fixed. |
| Wave 1 | User-visible backbone loops | Terminal, quota/usage, files/leases become real enough to build on. |
| F Track | Canvas foundation | Canvas contract and store bridge exist before creative work piles up. |
| Wave 2 | TeamRun and routing closure | Bridge smoke and task-level lane selection become real. |
| Wave 3 | Governance and professional surfaces | Browser/artifact, review center, capability loadout, messaging, canvas/video expansions. |

## Module Mapping

| Module | Wave | Covered Sections |
|---|---|---|
| Platform Spine | Wave 0 | Session, permission, timeline, actor/runtime metadata, shared DTO freeze. |
| Clean Craft Baseline | Wave 0 + U Track | Upstream sync, shell reset, active docs structure, removal/quarantine of wrong old UI. |
| Terminal / CLI Runtime | Wave 1 | Terminal surface, node-pty direction, launcher diagnostics, runtime catalog, ACP/native boundaries. |
| Internal Action Registry | Wave 0 -> Wave 1 | Contract freeze in Wave 0; first usable file/actions slice in Wave 1. |
| Runtime Lanes / TeamRun | Wave 0 -> Wave 2 | Protocol freeze in Wave 0; Bridge end-to-end smoke in Wave 2. |
| Files / Library / Leases | Wave 1 | Files visibility, lease persistence, conflict UI, Library boundary. |
| Browser / Artifact Workflow | Wave 3 | BrowserPane selection, annotation, Comment AI, artifact handoff. |
| Canvas / Design Surface | F Track + Wave 3 | Canvas root/store/action bridge first; design editing after spine. |
| AIGC / External Jobs | Wave 3 | Job model, provider handoff, generated assets, provenance, cost. |
| Video Surface | Wave 3 / M2 | Native timeline bridge after Library/canvas/job assets exist. |
| Memory / Context / Review | Wave 3 | Context center, ProjectPack, external review UI, memory flywheel connection. |
| Model Routing / Cost Ledger | Wave 1 -> Wave 2 | Quota protocol/adapter in Wave 1; route/cost decisions in Wave 2. |
| Capability / Skill / Plugin | Wave 3 | Catalog/loadout/resolver, skill injection, marketplace, localization. |
| Settings / Shell UX | U Track + per module | Lead fixes IA first; module pages fill assigned slots only. |
| Messaging | Wave 3 | D28 retention, permissions, gateway boundaries, settings restoration. |

## Why This Order

1. Contract freeze comes first because multiple agents otherwise collide in `shared/protocol`, RPC handlers, transport maps, and i18n.
2. Terminal/CLI Runtime is first because it creates a real local execution loop.
3. Internal Actions and leases must exist before creative surfaces can safely allow human and agent writes.
4. TeamRun Bridge smoke is the highest-risk multi-agent proof. Without it, "CLI leader plus API members" is only a claim.
5. Canvas and professional surfaces are not postponed because they are unimportant; they are gated because they need the spine to avoid becoming isolated editors.

## Agent Packet Rule

No packet may claim a whole module if the module spans multiple waves. It must name exactly which sections it implements in that wave.

Example:

- Good: "Wave 1 Terminal: runtime catalog + terminal surface transcript + launcher diagnostics."
- Bad: "Implement CLI Runtime module."

## Wave 3 Internal Dependency Sequence

Wave 3 is not flat-parallel. Agents must not start a gated slice until its dependency is `usable`.

| Slice | Depends on | Blocks |
|---|---|---|
| M08 ExternalJob schema freeze | — (Wave 2 BatchJobExecutor contract) | M09 Video surface, M10 Review bundle, M11 Batch wiring |
| M09 Video surface | M08 ExternalJob schema | — |
| M10 Review bundle / Memory flywheel | M08 ExternalJob schema | — |
| M11 Batch wiring into routing | M08 ExternalJob schema | — |
| M06 Browser/Artifact handoff | M05 Library lease (Wave 1 gate) | — |
| M12 Capability loadout | Wave 2 TeamRun Bridge smoke | — |
| M14 Messaging | Wave 2 permission card (M04 gate) | — |

Rule: an agent assigned a gated slice that finds its dependency is not yet `usable` must
stop, file a blocker card (see `BOARD-SYNC.md`), and return to the Lead. It must not
proceed speculatively or stub the dependency.
