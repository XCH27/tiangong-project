# Owner Voice Log

This file records the product owner's spoken feedback, translated into structured design intent
for Agent reference. It is **not** a decisions ledger and **not** a requirements spec.

## Purpose

The product owner speaks in conceptual / non-engineering language, often in a
non-linear order, across multiple conversations. This file:

1. Captures the original wording verbatim (or as close as possible)
2. Translates the underlying intent into engineering-neutral design language
3. Extracts discrete signal items an Agent can cross-reference against module specs
4. Records which modules or decisions each signal touches
5. Marks whether each signal has been actioned (written into a spec or ledger)

## How to Use This File (for Agents)

- Read this file at session start when touching any module listed in a signal's `Touches` field.
- If you implement something that satisfies a signal, update `Status` to `actioned` and add
  the commit or PR reference.
- If a signal contradicts a `DECISIONS-LEDGER.md` entry, **do not silently resolve it**.
  Surface the conflict to the owner and wait for a decision.
- Technical route choice is **your responsibility**. The owner describes intent and desired
  experience. You select the best implementation path. Do not ask for a technical opinion
  unless the choice has a significant cost or UX consequence the owner should know about.

## Signal Format

```
### OV-NNN — Short title

**Date:** YYYY-MM-DD  
**Status:** pending | actioned | superseded  
**Actioned in:** (commit / PR / ledger entry when actioned)  
**Touches:** M07, M09, M12 ... (module ids)

**Original words (verbatim or paraphrased):**
> "..."

**Extracted intent:**
- bullet 1
- bullet 2

**Engineering implication (Agent-selected route):**
- bullet (written by Agent when actioning, not by owner)
```

---

## Signals

### OV-001 — Software must keep growing without becoming a mess

**Date:** 2026-07-08
**Status:** actioned
**Actioned in:** M12 §17 (plugin namespace safety, docs commit c59b060)
**Touches:** M03, M12

**Original words:**
> “以后随着AI的发展我还会往这个软件里加入更多的功能，比如无线画布增加组件，增强浏览器功能，或者增加工具面板之类的，现在的整个方案选择在面对这些情况的时候能应对么”

**Extracted intent:**
- The product will grow continuously. New surfaces, panels, and capabilities must be addable
  without restructuring the core spine.
- Each new feature should plug into the existing action / permission / timeline system rather
  than creating a parallel track.
- The architecture must absorb future AI capability expansions (new model types, new output
  formats) without requiring rewrites.

**Engineering implication (Agent-selected route):**
- M03 Internal Action Registry is the single extension point. New features register actions;
  they do not wire directly into UI or session state.
- M12 plugin namespace contract (`<surface>.<plugin-id>.<verb>`) enforces isolation so new
  capabilities cannot pollute existing action ids.
- `fleetApiVersion` gate in plugin manifests ensures future-breaking changes are caught at
  install time, not at runtime.

---

### OV-002 — High concurrency must not freeze the machine or the canvas

**Date:** 2026-07-08
**Status:** actioned
**Actioned in:** M07 §18 + M09 §17 (docs commit c59b060)
**Touches:** M04, M07, M08, M09

**Original words:**
> “在多代理并行的时候，智能体同时进行节点创建编码工作程序测试，生图生视频，或者视频剪辑等等，高并发的时候，软件和本地电脑能抗住吗，还有无限画布要承担这么多功能，他能抗的住么，会不会延迟很高还卡顿”

**Extracted intent:**
- Multiple agents running simultaneously (coding, testing, image gen, video editing) must not
  cause the UI or canvas to stutter or freeze.
- The local machine must survive real concurrent workloads; the system must be aware of its
  own limits and queue or defer gracefully.
- The infinite canvas specifically must stay smooth even when agents are actively writing nodes
  to it at the same time.

**Engineering implication (Agent-selected route):**
- Generation tasks (image, video via API) are fire-and-forget External Jobs (M08); they impose
  near-zero local CPU cost while waiting.
- Local video rendering is serialized through a max-1 render queue with FIFO + user-priority;
  overflow hands off to External Jobs (M09 §17).
- Canvas concurrent writes are batched into a single `requestAnimationFrame` pass per 16 ms
  tick; conflict ordering uses `ActionInvocation.seq` (M07 §18).
- Live-content canvas nodes (code output, video preview) use lazy suspend/resume with a 25 %
  zoom-out threshold to prevent simultaneous renderer activation (M07 §18.3).

---

### OV-003 — Owner speaks in concepts; Agents choose the technical route

**Date:** 2026-07-08
**Status:** actioned
**Actioned in:** This file (OWNER-VOICE.md)
**Touches:** all modules

**Original words:**
> “我说话可能东一句西一句，描述顺序还是乱的，然后方便工作局做印证，而且我说的一般都不是工程用语，因为我不是专业的程序员，我说的往往都是理念，需要工作局自己选择最佳的技术路线”

**Extracted intent:**
- Owner feedback will arrive in natural / conceptual language, not engineering terminology.
- The order and phrasing may be non-linear, fragmented, or overlapping.
- Agents must extract the underlying design intent, not interpret the words literally.
- Technical route selection (library choice, data structure, algorithm) is the Agent's
  responsibility. Do not ask the owner for a technical opinion unless the choice has a
  visible cost or UX consequence the owner must decide.

**Engineering implication (Agent-selected route):**
- This file (OWNER-VOICE.md) is the translation layer between owner intent and module specs.
- Agents reading this file must treat each signal as a design constraint, not a technical spec.
- When a signal is ambiguous, the Agent infers the most conservative interpretation and
  documents the assumption in the actioned commit message. If the assumption is significant,
  it is escalated to DECISIONS-LEDGER.md as a new entry.

---

## Maintenance Rules

1. **Who writes new signals:** Only the owner (via a human-mediated session) or a dedicated
   translation session. Agents must not generate new OV entries from their own initiative.
2. **Translation fidelity:** The `Original words` field must preserve what the owner actually
   said (in Chinese if spoken in Chinese). Do not paraphrase in `Original words`.
3. **One signal per discrete concern.** If the owner raises two separate ideas in one message,
   create two OV entries.
4. **Signals are append-only.** Never delete or overwrite an existing signal. If a signal is
   superseded, update `Status: superseded` and add a note pointing to the new OV entry or
   ledger decision.
5. **Do not add engineering detail to `Extracted intent`.** That field reflects what the owner
   meant, not what the Agent decided to build. Engineering choices go in
   `Engineering implication`.
