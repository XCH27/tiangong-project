# M07 Implementation Constraints

> **Status:** planning constraint only; M07 is Locked.
> **Canonical behaviour:** `SPEC.md`. This file adds no actions or product requirements.

## 1. No Engine Assumption

Do not implement the prior direct-OpenPencil plan. Complete and record the M07 engine spike in
`SPEC.md` first. The chosen spatial host must support custom module cards and workflow ports;
OpenPencil may instead be used behind a professional design-document module.

## 2. Adapter Boundary

```text
human gesture or Agent request
-> canonical M03 ActionInvocation
-> M00 permission/approval
-> M07 spatial adapter mutation with baseRevision
-> ActionOutcome with committedRevision/UndoHandle
-> M03/M00 durable evidence
-> visible projection update
```

The adapter translates and mutates spatial state. It does not evaluate permission, write the
timeline, schedule jobs, own workflow state, or resolve ArtifactRefs independently.

## 3. Authority Constraints

- One SpatialDocument authority; no parallel renderer node store used as durable truth.
- Workflow steps/edges remain M17 authority.
- Domain documents and jobs remain with their owners.
- Canvas cards store entity references and presentation only.
- Selection and viewport remain view-local.

## 4. Required Spike Deliverables

1. official source/license/version record;
2. renderer contribution API mapping;
3. ActionInvocation -> adapter -> ActionOutcome mapping;
4. serialization/migration proof;
5. revision-conflict proof;
6. measured pan/zoom/update profile on a recorded machine;
7. accessibility and real rendered interaction check;
8. go/no-go decision and fallback that does not silently become a self-built design engine.

## 5. Implementation Stop Conditions

Stop before feature implementation if the engine cannot isolate custom renderers, serialize only
spatial state, expose controlled mutations, meet the license boundary, or remain responsive under
the agreed benchmark. Do not compensate by bypassing M03, embedding full applications, or adding
a second state store.
