# Frontend Exposure Matrix

> **Purpose:** For every backend capability, state whether humans need **visible controls**,  
> **what** those controls are (not pixel layout), and **which surface class** they belong to  
> (settings vs workbench vs approval vs none).  
> **Authority:** Lead; must stay aligned with module specs, D7/D40 (parity), and **D51** (minimal UI).  
> **Updated:** 2026-07-10  
> **Not a gate:** WAVE-MAP still owns Ready/Locked. This guides UI design after a slice is Ready.

## 0. Minimal UI law (D51) — 如无必要，勿增实体

Mainstream Agent apps stay **sparse**: one clear work surface, short settings, progressive disclosure.
Fleet follows that bar so most users are not forced through power-user chrome.

| Rule | Meaning |
|---|---|
| **Default = none** | Backend exists first; UI is added only when a human must see/decide something. |
| **Prefer in-loop** | Put controls next to the work (chat/composer/result/timeline) before inventing a new panel. |
| **Settings are rare** | Settings only for credentials, safety policy, retention, and rare preferences—not every flag. |
| **One home** | Each concern has at most one primary place (M13 IA). No duplicate toggles. |
| **No empty furniture** | Do not reserve docks, tabs, or menus “for later.” Add when the loop needs them. |
| **Progressive disclosure** | Advanced/dev options stay collapsed or behind a single Advanced area—not top-level. |
| **Justify `required`** | Every `required` row must answer: *what breaks for a normal user if this control is missing?* |
| **Agent-first is OK** | If Agent/workflow can complete the loop and humans only need results + approval, UI stays thin. |

**Anti-goals:** settings forests, per-module mini-apps, always-visible multi-dock dashboards,  
“enterprise console” density for default users.

## 1. How UI designers / Agents should use this

1. Read **§0** — if a control is not necessary for most users, mark `none` / `later` / `optional`.  
2. Open the **module row** for the slice you just finished or are designing.  
3. Implement only exposures marked **required** for that wave; **later** waits for its wave.  
4. **None** means backend-only / infrastructure — do **not** invent a settings page for it.  
5. Exact dock/position is owned by **M16** at implementation time; this file only names the **class**.  
6. Every **required** human control must share the same `actionId` as the Agent tool (D7/D40).  
7. When unsure between `settings` and `workbench`, choose **workbench/in-loop** unless it is  
   credentials, legal/safety policy, or rare preference (D51).

## 2. Surface classes (not pixel positions)

| Class | Meaning | Typical home |
|---|---|---|
| `none` | No dedicated human control; backend/internal only | — |
| `approval` | Blocking human decision (L2/L3) | Captain / modal / inline approve |
| `timeline` | Read-only or lightly interactive evidence | Craft session timeline |
| `workbench` | Day-to-day work surface | Main stage / chat / dock |
| `inspector` | Context for current selection | Right inspector |
| `panel` | Persistent tool panel | Left/right/bottom dock via M16 |
| `settings` | Infrequent preference / policy / credentials | Settings IA (M13) |
| `onboarding` | First-run / empty state | M14 flows |
| `canvas` | Spatial projection / open-native | M07 cards (not document store) |
| `status` | Non-blocking health/progress chip | Shell status / jobs bar |

A feature may list **multiple** classes (e.g. workbench + settings).

## 3. Exposure columns

| Column | Values |
|---|---|
| **UI needed?** | `required` · `optional` · `later` · `none` |
| **Surfaces** | one or more classes from §2 |
| **Expose what** | controls / info humans need (verbs + objects) |
| **Not expose** | must stay out of UI or stay Agent-only if marked |
| **Parity** | human control must call same action as Agent? `yes` / `n/a` |

## 4. Matrix by module

### M00 — Platform spine (identity, permission, timeline)

| Backend capability | UI needed? | Surfaces | Expose what | Not expose | Parity |
|---|---|---|---|---|---|
| Session create/list/open | required | workbench | Open/switch sessions; session list | raw store paths | yes (read actions) |
| Actor / AgentSeat display | required | workbench, inspector | Who is acting; seat/role labels | raw seat mutation API for users | partial |
| Permission decision engine | required | approval, timeline | Allow / deny / always-ask outcomes | internal policy evaluator UI | yes |
| L2/L3 supervision | required | approval | Explicit confirm/reject with summary + targets | silent auto-approve L3 | yes |
| SessionEvent append/read | required | timeline | Readable event stream; filter by kind | raw JSON dump as only UX | n/a read |
| Persistence / recovery | optional | status | “Reconnecting / recovering” when store issues | DB file pickers | n/a |
| Fleet Bridge (wire) | none | none | — | Bridge methods as settings | n/a |

### M01 — Clean baseline

| Backend capability | UI needed? | Surfaces | Expose what | Not expose | Parity |
|---|---|---|---|---|---|
| Clean Craft shell itself | required | workbench, settings | Upstream chat/settings/browser hosts | fleet-old skins | n/a |
| Migration ledger | none | none | — | user-facing migration debug | n/a |

### M02 — Terminal / CLI runtime

| Backend capability | UI needed? | Surfaces | Expose what | Not expose | Parity |
|---|---|---|---|---|---|
| Runtime catalog / select lane | required | workbench, panel | Pick CLI/runtime; show active lane | edit protocol internals | yes |
| Start/stop/stream PTY | required | workbench, panel | Terminal surface; stop; clear | raw PTY FDs | yes |
| Stream to timeline | required | timeline | Collapsed run summary + expand | duplicate full buffer only in UI | n/a |
| Permissioned host commands | required | approval | L2/L3 prompts for risky cmds | bypass host | yes |

### M03 — Internal action registry

| Backend capability | UI needed? | Surfaces | Expose what | Not expose | Parity |
|---|---|---|---|---|---|
| Action dispatch executor | none | none | — | “raw action console” for end users | n/a |
| Registry as product feature | later | settings (dev) | Optional developer action inspector | editing frozen action ids in UI | n/a |
| Undo handles | required | workbench, timeline | Undo when `undoSupport` allows | fake undo for non-invertible | yes |
| Action blocked / error events | required | timeline, status | Human-readable block/error | stack traces as only copy | n/a |

### M04 — Runtime lanes / TeamRun

| Backend capability | UI needed? | Surfaces | Expose what | Not expose | Parity |
|---|---|---|---|---|---|
| Team roster / seats | required | workbench, inspector | Members, roles, active lanes | direct tool ownership of teammates | yes |
| Request member run | required | workbench | “Ask teammate / run lane” with bound scope | unrestricted remote control | yes |
| Compressed run report | required | timeline, inspector | Summary + evidence links | hide failures | n/a |
| Bridge internals | none | none | — | low-level Bridge method UI | n/a |

### M05 — Files / Library / ArtifactRef / leases

| Backend capability | UI needed? | Surfaces | Expose what | Not expose | Parity |
|---|---|---|---|---|---|
| Browse workspace files | required | workbench, panel | Tree/list; open; basic ops | unrestricted OS path escape | yes |
| Library promote/index | required | workbench, panel | Add to Library; provenance badge | silent auto-library all files | yes |
| ArtifactRef resolve/preview | required | inspector, canvas | Preview card; version; parents | raw storageRef as editable path | yes |
| File leases / conflicts | required | status, modal | Conflict / wait / take-over per policy | silent last-write-wins | yes |
| Destructive file ops | required | approval | Confirm delete/overwrite | L0 delete | yes |

### M06 — Browser evidence

| Backend capability | UI needed? | Surfaces | Expose what | Not expose | Parity |
|---|---|---|---|---|---|
| BrowserPane host | required | workbench | Open/navigate browser surface | second browser stack | yes |
| Selection / annotate / capture | required | workbench | Select, box, annotate, screenshot | stealth/automation hidden toggles | yes |
| Evidence → ArtifactRef | required | inspector, timeline | “Use as evidence” | DOM-edit remote pages | yes |
| Browser policy | required | settings | Enable, open-target, clear data, screenshot policy, site overrides, full-CDP **dev** toggle | anti-detect, profile farm | yes |

### M07 — Spatial canvas

| Backend capability | UI needed? | Surfaces | Expose what | Not expose | Parity |
|---|---|---|---|---|---|
| Spatial document layout | required | canvas, workbench | Pan/zoom; place cards; groups | owning job/document bytes | yes |
| Open native editor | required | canvas, workbench | Open design/media/web/deck host | embed all live editors in every node | yes |
| Workflow projection layout | required | canvas | Layout of M17 steps (not executable Space lines) | Space connector as executable edge | yes |
| Performance degrade | required | status | Queue / static preview notice | silent freeze | n/a |

### M08 — ExternalJob core + providers

| Backend capability | UI needed? | Surfaces | Expose what | Not expose | Parity |
|---|---|---|---|---|---|
| Submit job | required | workbench, panel | Start generation/render with inputs | auto-submit paid without budget path | yes |
| Job list / progress / cancel | required | panel, status | Jobs dock; progress; cancel | UI-owned job store | yes |
| Restart reconcile | required | status, timeline | Reconciling / failed / completed | silent resubmit paid | n/a |
| Provider credentials | later/required by provider | settings | Provider keys per M13 risk class | quota bypass | yes |
| Cost fields (M11A) | required | inspector, panel | estimated/confirmed/unknown cost | invent token counts | n/a |

### M09 — Media composition

| Backend capability | UI needed? | Surfaces | Expose what | Not expose | Parity |
|---|---|---|---|---|---|
| Media project editor | required | workbench | Timeline/clips editor surface | canvas-as-editor | yes |
| Import ArtifactRefs | required | workbench, inspector | Add image/video/audio/text | silent byte copy without ref | yes |
| Render via M08 | required | panel, approval | Render; show cost/risk | background unbounded render | yes |

### M10 — Memory / context / review

| Backend capability | UI needed? | Surfaces | Expose what | Not expose | Parity |
|---|---|---|---|---|---|
| Inspect partitions | required | settings, panel | Browse partitions/layers | hidden always-on memory | yes |
| Delete memory (L3) | required | approval, settings | Explicit delete | soft-delete without confirm | yes |
| ProjectPack / review pipeline | required | workbench, panel | Run review; show report | scattered one-off buttons only | yes |

### M11A — Usage / cost core

| Backend capability | UI needed? | Surfaces | Expose what | Not expose | Parity |
|---|---|---|---|---|---|
| Budget preflight | required | approval, workbench | Approve estimated/unknown cost | hide unknown as free | yes |
| Usage/cost records | required | inspector, panel, settings (summary) | Per-run cost; confidence badge | fake precision | n/a |
| Ledger internals | none | none | — | raw DB browser for users | n/a |

### M11B — Routing / cache / batch

| Backend capability | UI needed? | Surfaces | Expose what | Not expose | Parity |
|---|---|---|---|---|---|
| Model/provider pick | required | settings, workbench | Route policy; explain selection | stealth multi-account | yes |
| Cache indicators | optional | status, inspector | Cache hit/miss if known | invent savings | n/a |
| Native batch jobs | required | panel | Batch queue status | concurrent fake batch loops | yes |

### M12 — Capability / skills

| Backend capability | UI needed? | Surfaces | Expose what | Not expose | Parity |
|---|---|---|---|---|---|
| Effective loadout | required | settings, inspector | What tools are on for this seat | global always-on pile | yes |
| Install/enable skill (built-in) | required | settings | Enable/disable built-ins | unsigned plugin free-for-all early | yes |
| Plugin distribution | later | settings | W4 marketplace later | early external plugins | yes |
| Manifest → tools | none | none | Generated, not hand-edited maps | manual Agent-hook map UI | n/a |

### M13 — Settings / preferences

| Backend capability | UI needed? | Surfaces | Expose what | Not expose | Parity |
|---|---|---|---|---|---|
| Preference IA host | required | settings | One home per preference class | second settings app | n/a |
| Risk-classed prefs | required | settings, approval | High-risk prefs confirm | Fleet account/subscription (D26) | yes |

### M14 — Onboarding

| Backend capability | UI needed? | Surfaces | Expose what | Not expose | Parity |
|---|---|---|---|---|---|
| First-run / empty project | required | onboarding | Guided path into Craft workbench | separate product tour app | n/a |
| Diagnostics | optional | onboarding, settings | Health checks | fake green checks | n/a |

### M15 — Messaging gateway

| Backend capability | UI needed? | Surfaces | Expose what | Not expose | Parity |
|---|---|---|---|---|---|
| Connect/disconnect channel | required | settings | Provider connect; retention/terms | silent always-on gateway | yes |
| Pairing / allowlist | required | settings, approval | Approve senders | open relay | yes |
| Gateway process internals | none | none | — | raw socket UI | n/a |

### M16 — Workbench / panels

| Backend capability | UI needed? | Surfaces | Expose what | Not expose | Parity |
|---|---|---|---|---|---|
| Register views | required | workbench | Open/close panels/surfaces | Agent permanent layout thrash | yes (reveal) |
| Layout preferences | required | workbench, settings | Reset layout; save layout version | domain state in layout | n/a |
| View contribution API | none | none | — | per-module private shells | n/a |

### M17 — Composable workflows

| Backend capability | UI needed? | Surfaces | Expose what | Not expose | Parity |
|---|---|---|---|---|---|
| Edit workflow definition | required | canvas, inspector | Steps, ports, validate | Space lines as code | yes |
| Run / pause / approve step | required | workbench, approval, panel | Run; step status; L2/L3 pauses | workflow-only permission path | yes |
| Version / immutability | required | inspector | Version badge; repair → new version | silent mutate running def | yes |

### M18 — Web artifact

| Backend capability | UI needed? | Surfaces | Expose what | Not expose | Parity |
|---|---|---|---|---|---|
| Web project surface | required | workbench | Files + preview | mutate external sites | yes |
| Build/export | required | panel, approval | Build; export ArtifactRef | hide build failures | yes |

### M19 — Presentation / motion

| Backend capability | UI needed? | Surfaces | Expose what | Not expose | Parity |
|---|---|---|---|---|---|
| Motion deck editor | required | workbench | Deck edit surface | promise full PPT parity | yes |
| Export PPTX/HTML/video | required | panel, approval | Export with fidelity warnings | silent lossy export | yes |

## 5. Per-loop UI add checklist (for designers) — keep thin (D51)

After a loop’s backend is **usable**, add **only** the minimum affordances below.
Do **not** pre-build the whole row if the loop works with less.

| Loop | Minimum human UI (prefer these first) | Avoid adding yet |
|---|---|---|
| L01 | Approval for L2/L3; readable timeline; session list already in Craft | Extra spine dashboards, policy editors for every flag |
| L02 | One way to run terminal/CLI; see output; stop; basic file open; job progress if async | Multi-dock “IDE”; Library as a second product; deep layout chrome |
| L03A | Submit one generation; see result; open canvas **when needed**; one approval pause | Full creative studio chrome; many node palettes |
| L03B | Open one native surface; export with honesty | All editors always visible |
| L04 | Memory delete path; simple loadout; model pick if routing ships | Memory “OS”; marketplace UI early |
| L05 | Short settings; light onboarding; messaging connect if retained | Account/upgrade walls (D26); settings sprawl |

**Bias:** complete the **loop in chat + one surface**, not a control panel for every subsystem.

## 6. Rules for module specs

Every module SPEC must include a **## Frontend Exposure** section (see `modules/README.md`) that:

- states UI needed / surfaces / expose what / not expose;  
- links to this matrix for the module;  
- does **not** invent pixel coordinates (M16 owns placement).

## 7. Maintenance

- When adding an action or backend capability, update **this matrix in the same PR** as the module/contract change.  
- UI-only controls without matrix rows are incomplete (D7).  
- Matrix rows without backend owner are incomplete.
