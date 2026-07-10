# Owner Voice Log

This file records the product owner's spoken feedback, translated into structured design intent
for Agent reference. It is **not** a decisions ledger and **not** a requirements spec.

`HUMAN-FEEDBACK-LOG.md` is the raw staging source. New Owner Voice signals must cite the matching
HFL entry; this file may translate and cross-reference but cannot maintain an independent feedback
status truth.

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
**Actioned in:** D35, D39-D42, ADR-0033, M12/M16/M17 specs (amended 2026-07-09)
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
- M12 defines one structured capability manifest; namespace syntax remains a W0.1 decision and is
  not used alone as a security boundary.
- M16 registers panels/surfaces/inspectors; M17 composes typed capability operations; M07 renders
  module-contributed entity cards without becoming the owner of native state.

---

### OV-002 — High concurrency must not freeze the machine or the canvas

**Date:** 2026-07-08
**Status:** actioned
**Actioned in:** D36 amendment, M07 §12, M08 §5, M09 §11 (amended 2026-07-09)
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
- M08 owns durable queue/back-pressure/reconciliation; waiting on an external provider does not
  justify claiming zero local or financial cost.
- M09 local final render begins at concurrency one until a benchmark permits more.
- M07 batches renderer work but resolves document conflicts with explicit base/committed revisions,
  not audit sequence ordering.
- Live previews suspend under visibility/resource policy. Exact thresholds require a repeatable
  benchmark and are not inferred from the earlier draft.

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

### OV-004 — Universal spatial work system must remain modular

**Date:** 2026-07-09
**Status:** actioned
**Actioned in:** HFL-003, D39/D44/D45/D46, ADR-0033, M07/M09/M18/M19
**Touches:** M05, M07, M08, M09, M16, M18, M19

**Original words:**
> “我选3，但是所有功能都是一个个的模块化组件，这样可以文字生成到生图，生的图片还可以选择做网页/视频/动态PPT等等，然后间距模组又能链接各种素材进行剪辑，你想想要怎么样才是能实现这个。”

**Extracted intent:**
- The selected product direction is a universal spatial workspace.
- Every capability remains an independently composable module.
- One generated artifact can feed several downstream output types.
- Media editing must connect heterogeneous assets rather than support only a single-source clip.

**Engineering implication (Agent-selected route):**
- M07 owns spatial projection, M05 ArtifactRef handoff, M08 jobs, M09 native multi-asset timeline,
  M18 web projects, and M19 MotionDeck documents.
- Native editors open through M16; the canvas uses static/bounded previews rather than embedding
  every full application.

---

### OV-005 — Agents call modules and create workflows

**Date:** 2026-07-09
**Status:** actioned
**Actioned in:** HFL-003, D40/D41, M12/M17
**Touches:** M00, M03, M12, M17

**Original words:**
> “Agent也能调用每个模块的能力完成工作，还能根据情况创建工作流。”

**Extracted intent:**
- Agents must use every permitted module as a first-class capability.
- Agents may assemble reusable workflows according to the task.
- Workflows must remain visible, understandable, and governable by the user.

**Engineering implication (Agent-selected route):**
- Capability manifests generate human, Agent, and workflow projections over one M03 executor.
- M17 stores versioned finite DAGs; graph creation does not grant execution permission.
- L0-L3, budget, evidence, cancellation, and restart reconciliation apply per real step.

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
