# M18 — Web Artifact Surface

> **Capability status:** `not implemented`  
> **Execution gate:** Locked  
> **Spec maturity:** contract draft  
> **Wave:** W3B  
> **Depends on:** M03, M05, M06 preview, M08 render jobs, M12 core, M16, M17

## 1. Purpose

Turn text, images, design artifacts, and structured content into an editable local web project,
preview it through the governed browser surface, and export a traceable build. This is the native
owner for web artifacts; M06 remains the owner of external browsing and evidence capture.

## 2. First Closed Loop

```text
text + one image ArtifactRef -> create local web project -> preview -> human/Agent edit
-> build/export job -> versioned web ArtifactRef -> canvas result and timeline evidence
```

## 3. Native Document Authority

The authoritative artifact is a normal workspace project plus a small versioned manifest that
records entry file, asset bindings, provenance, preview command, and build outputs. M18 does not
store editable page state in the canvas or mutate an external website DOM.

## 4. Capability Ports

| Operation | Inputs | Outputs |
|---|---|---|
| create project | text brief, optional image/design ArtifactRefs | web-project ArtifactRef |
| apply structured edit | web-project ref, validated patch/diff | new project version |
| bind asset | project ref, ArtifactRef, named slot | new project version |
| preview | project ref | governed local preview route |
| build/export | project ref, target profile | build ArtifactRef and evidence |

All file mutations use M05 leases/actions. Build and screenshot/export work uses M08 when it is
long-running. Preview uses M06 local-owned-artifact policy, not the external-site write boundary.

## 5. Human, Agent, and Workflow Parity

UI controls, Agent tools, and M17 nodes call the same registered operations. An Agent may create
or edit only within the project lease and effective permission scope. Generated source is always
visible as real files; there is no hidden HTML blob owned by a renderer.

## 6. View Contributions

- main surface: file/structure preview and governed live preview;
- inspector: page metadata, asset bindings, accessibility/build issues;
- optional bottom panel: build output owned by the job/runtime authority;
- canvas renderer: static thumbnail, project version, build state, and open action.

## 7. Error and Recovery

Invalid project structure, missing assets, build failure, preview crash, lease conflict, and stale
revision all return typed errors with an inspect/retry/rebind path. A failed build does not mutate
the last successful export. Missing input assets render explicit placeholders.

## 8. Verification

1. Create one project from real text and image inputs through UI and Agent paths.
2. Confirm both write real workspace files through the same actions and leases.
3. Preview the owned local project without granting external-site mutation.
4. Build/export; verify the output ArtifactRef links to exact source and image versions.
5. Restart and reopen the project/version; verify no canvas-only state is required.
6. Feed the same project operation from M17 and correlate step, job, file, and evidence records.

## 9. Non-Goals

- no arbitrary mutation of external sites;
- no full browser profile duplication;
- no promise that generated code is correct without build and rendered verification;
- no hosting/deployment in the first slice; publish is a separate high-risk operation.

