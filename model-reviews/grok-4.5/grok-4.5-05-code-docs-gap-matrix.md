# grok-4.5-05 — Code vs Docs Gap Matrix

**Model:** Grok 4.5  
**Date:** 2026-07-09  
**Code root:** `app/`  
**Docs root:** `docs/` + `AGENTS.md`

Legend:

| Symbol | Meaning |
|---|---|
| ✅ | Present and roughly aligned |
| 🟡 | Partial / stub / naming drift |
| ❌ | Documented but missing in code |
| ⚠️ | Code exists but docs mis-locate or under-specify |
| 💥 | Active contradiction |

---

## 1. Spine & Protocol

| Concept | Docs claim | Code reality | Gap |
|---|---|---|---|
| WS RPC MessageEnvelope | App Server clients | `shared/src/protocol/types.ts` | ✅ |
| SessionEvent (Craft) | Timeline spine | `protocol/dto` + sessions packages | 🟡 Docs redefine different SessionEvent shape in stubs |
| InternalActionId registry | Frozen table v1.2.0 | `internal-action.ts` v1.0.0 partial set | 💥 |
| ActionPermissionLevel L0–L3 | Mixed | Code has L0–L3 including L3_destructive; stubs miss L3 | 💥 |
| Action registry service | M03 full hook pipeline | Not found as described service | ❌ |
| list/invoke internal action tools | M03 agent tools | Referenced in comments only | ❌ |
| AgentSeat | Identity matrix / M04 | Not found | ❌ |
| RuntimeLane | M02/M04 | Not found as protocol type | ❌ |
| TeamRun coordinator | M04 | Not found | ❌ |
| WorkspaceFileLease | stubs + M05 | Not found | ❌ |
| Bridge CraftAgentsBridge | PARALLEL model | Not found as named API | ❌ |
| CanvasDocument | stubs + M07 | Not found | ❌ |
| Manager Agent | D11/D17 | No first-class type | ❌ |
| Cost ledger / routing protocol | M11 | `protocol/routing.ts` exists; usage/subscription files claimed may be partial | 🟡 |
| Messaging gateway | M14 govern | Large `messaging-gateway` package | ⚠️ Present but wave identity confused |

---

## 2. Ownership Paths vs Disk

| Ownership claim | Exists? | Notes |
|---|---|---|
| `shared/src/session/` | ❌ | Actual: `shared/src/sessions/` |
| `shared/src/workspace/` | ❌ | Actual: `shared/src/workspaces/` |
| `shared/src/permission/` | ❌ | Permissions live under tests/config/agent areas — not this folder |
| `shared/src/timeline/` | ❌ | No package path |
| `shared/src/action-registry/` | ❌ | Only `protocol/internal-action.ts` |
| `shared/src/runtime-lanes/` | ❌ | — |
| `shared/src/teamrun/` | ❌ | — |
| `shared/src/library/` | ❌ | — |
| `shared/src/lease/` | ❌ | — |
| `electron/src/renderer/shell/` | 🟡 | Need verify exact folder names; ownership may invent |
| `electron/.../terminal-host.ts` | 🟡 | May not exist yet |
| `server-core/src/sessions/` | ✅ | Real spine center |
| `session-tools-core` | ✅ | Real agent tools home — under-owned in matrix |
| `session-mcp-server` | ✅ | Bridge-ish candidate — under-owned |
| `messaging-gateway` | ✅ | Exists; M14 ownership path wrong (onboarding) |

---

## 3. Action ID Diff (Docs table vs Code enum)

### In docs frozen table, not in code enum (examples)

- `file.move`
- `canvas.node_create`, `canvas.node_delete`, `canvas.node_select`, group/edge/export/viewport/zoom actions  
- `aigc.job_submit`

### In code enum, check docs

- `file.create/update/delete/rename` — docs yes (move missing in code)  
- `session.*` — aligned  
- `canvas.node_update` — code yes; docs has broader canvas set  
- `workspace.rename` — aligned  

### Under discussion in docs (OK if not in code)

- browser.*, video.*

**Required fix:** automated equality for frozen set only.

---

## 4. Module Readiness (docs vs implementability)

| Module | Spec depth | Code landing zone clear? | Implementable now? |
|---|---|---|---|
| M00 | Thin | 🟡 wrong ownership paths | **No** until ownership+types |
| M01 | Thin | 🟡 | After M00 |
| M02 | Medium | 🟡 invented cli-runtime paths | After M00 |
| M03 | Medium+schema gold | 🟡 | Skeleton only after P0 |
| M04 | Medium+journal | ❌ | No |
| M05 | Thin | ❌ | No |
| M06 | Thick | ⚠️ browser exists but actions contradict policy | No |
| M07 | Thick | ❌ | No |
| M08 | Medium | ❌ | No |
| M09 | Medium | ❌ | No |
| M10 | Medium+schema | ❌ | No |
| M11 | Medium+batch | 🟡 routing partial | No |
| M12 | Medium+namespace broken | 🟡 skills exist in craft | No |
| M13 | Thin | ⚠️ settings exist | Later |
| M14 | Thin / wrong wave name | ✅ packages exist | Govern later |

---

## 5. Wave Gate Claims vs Reality

| Gate claim | Reality |
|---|---|
| W0 done (3 files frozen) | Files exist; **semantic freeze incomplete** |
| W1 open | Process-open; BLK-001 says M00 exports missing |
| Phase 0 complete | Craft base present; M01 cleanup not done — “complete” overstated |
| Phase 1/2 In Progress | Modules not started — **false** |

---

## 6. Naming Drift Map

| String | Appears in | Problem |
|---|---|---|
| Fleet | PROJECT-DIRECTION, legacy, paths | Brand/technical collision |
| Craft Agents (二开补强) | Most control plane | Display name |
| `.fleet/` | M06–M09 persistence | Path brand |
| `fleet.*` actions | M12 | Conflicts core IDs |
| `@fleet/*` | W1 packet | Packages don’t exist |
| `FLEET_CLOUD` | M11 | Implies cloud product |
| Captain | action-ids destructive flow | vs Lead vs role:lead |
| role:lead | identity matrix | Collides repo Lead |

---

## 7. SessionEvent Dual Definition Risk

Docs `protocol-stubs.md` defines a **new** SessionEvent focused on actions/supervision.  
Craft already has SessionEvent in protocol/dto used by RPC events.

**Risk (C1):** inventing a second event type with the same name.

**Recommendation:**  
- Extend Craft’s existing session event model, **or**  
- Rename new concept (`TimelineEvent` / `ActionSessionEvent`) and map to Craft storage  

Do not silently replace Craft SessionEvent shape in stubs without migration design.

---

## 8. Validation Commands Reality

Docs/packets mention `pnpm typecheck`.  
Repo is **Bun** monorepo: `bun run typecheck:all`, `./scripts/craft.sh`, `validate:fleet`.

**Gap:** packets should use real commands from `app/package.json` / `scripts/craft.sh`.

---

## 9. Summary Counts

| Gap class | Approx count |
|---|---|
| 💥 Contradictions | 6+ major |
| ❌ Documented missing types/services | 10+ |
| ⚠️ Mis-owned existing packages | 4+ |
| 🟡 Partial alignments | several |

**Conclusion:** Documentation describes a target architecture more than the current codebase. That is fine for a plan — **not fine for a freeze claimed as worker-safe.**
