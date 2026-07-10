# M19 — Presentation and Motion Deck Surface

> **Capability status:** `not implemented`  
> **Execution gate:** Locked  
> **Spec maturity:** contract draft  
> **Wave:** W3B  
> **Depends on:** M03, M05, M08, M12 core, M16, M17

## 1. Purpose

Compose text, images, charts, audio, and short media into an editable presentation with a native
slide model and optional motion timeline. Export static PPTX when supported and dynamic HTML or
video without pretending all PowerPoint animation features are portable.

## 2. Native Model

```text
MotionDeck
|-- theme and asset bindings
|-- slides[]
|   |-- elements[] (text, image, shape, chart, media)
|   `-- motion tracks[] (entrance, emphasis, exit, transition)
`-- export profiles[]
```

The versioned MotionDeck document is authoritative. PPTX, HTML, PDF, and video are exports. A
PPTX import/export adapter may support a declared subset, but the binary file is not used as an
opaque editable state store.

## 3. First Closed Loop

```text
brief + image ArtifactRef -> create 3-slide deck -> human/Agent edit one slide
-> preview motion -> export HTML and static PPTX -> output ArtifactRefs and provenance
```

Video export, advanced charts, narration, and native PowerPoint animation fidelity are later
slices after real adapter evidence.

## 4. Capability Ports

| Operation | Inputs | Outputs |
|---|---|---|
| create deck | brief, outline, theme, ArtifactRefs | presentation ArtifactRef |
| add/update slide | deck ref, structured slide content | new deck version |
| bind media | deck ref, slide/element target, ArtifactRef | new deck version |
| apply motion preset | deck ref, element target, bounded preset | new deck version |
| render preview | deck ref, slide/range | preview artifact |
| export | deck ref, `pptx`/`html`/`pdf`/`video` profile | exported ArtifactRef |

Long renders use M08. File writes and artifact registration use M05. M17 may compose these
operations, but cannot directly edit the deck's internal state.

## 5. Views

- main surface: slide canvas and thumbnail navigator;
- right inspector: selected element, theme, accessibility, animation settings;
- bottom work panel: motion timeline for the active slide;
- canvas renderer: static/current preview with deck version and open action.

## 6. Safety and Fidelity Rules

- Unsupported PPTX constructs are reported before export and preserved only when the chosen
  adapter proves round-trip support.
- Export never claims full animation fidelity without a real PowerPoint playback check.
- Fonts, images, licenses, and generated media keep ArtifactRef provenance.
- External fonts/templates require explicit license and network permission.
- Overwriting an existing user export follows M05 risk and snapshot rules.

## 7. Error and Recovery

Missing font/media, invalid animation timing, unsupported export feature, render failure, stale
revision, and budget exhaustion are visible and recoverable. A failed export leaves the last
successful artifact unchanged. Deck editing remains usable when a single media asset is missing.

## 8. Verification

1. Create a real three-slide deck from text and one image through UI and Agent paths.
2. Modify the same slide through the shared registered operation and verify revision conflict
   behaviour.
3. Preview one bounded motion preset.
4. Export HTML and PPTX; open each in a real target viewer and record supported/unsupported
   fidelity rather than relying on file creation alone.
5. Restart and reopen the native deck version.
6. Run the same creation/export steps from M17 and verify artifact/run/evidence correlation.

## 9. Non-Goals

- no claim of complete PowerPoint feature compatibility;
- no arbitrary animation scripting in v1;
- no separate asset library or render queue;
- no live full deck editor embedded in a canvas node.

