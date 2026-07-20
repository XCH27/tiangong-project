# Video reference candidate inventory

This preserves the recovered discovery pool, but only the top-tier shortlist below may guide design.
The remaining names are historical candidates, not a mandatory screening backlog. Promotion still
requires a fixed commit, exact source files, license check and local-surpass decision.

## Accepted comparison shortlist

1. OpenCut classic for implemented NLE state/edit/export mechanisms.
2. Current OpenCut for rewrite/product direction only; its advertised Editor API, plugin-first, MCP
   and headless surfaces are not yet implementation evidence at the pinned revision.
3. HyperFrames for Apache-2.0 deterministic programmatic composition, render cancellation and
   failure classification.
4. FFmpeg as the replaceable media-engine boundary. Remotion remains license-gated evidence only.

| Candidate | Repository | Initial role | Local evidence now | Safe status |
|---|---|---|---|---|
| OpenCut | `OpenCut-app/OpenCut` | cross-platform editor and current architecture | `software/opencut` @ `5e0696bc9b92`; MIT | `EVIDENCE_ONLY` until editor APIs land |
| opencut-classic | `OpenCut-app/opencut-classic` | timeline/editor module | `software/opencut-classic` @ `cf5e79e91914`; MIT text; archived | `MODULE_REFERENCE` candidate |
| React Video Editor | `openvideodev/react-video-editor` | React editor/timeline component | no checkout / no fixed commit | `candidate` |
| Cutia | `msgbyte/cutia` | web editing interaction | no checkout / no fixed commit | `candidate` |
| OpenReel Video | `Augani/openreel-video` | web editor workflow | no checkout / no fixed commit | `candidate` |
| Shotcut | `mltframework/shotcut` | desktop NLE/media behavior | no checkout / no fixed commit | `candidate` |
| LosslessCut | `mifi/lossless-cut` | fast/lossless media operations | no checkout / no fixed commit | `candidate` |
| Remotion | `remotion-dev/remotion` | programmatic video and motion graphics | no checkout / no fixed commit; license not locally verified | `candidate; license gate` |
| Hyperframes | `heygen-com/hyperframes` | HTML/code-driven video generation | `plugins/hyperframes` @ `6ad738b580ad`; Apache-2.0 | `MODULE_REFERENCE` candidate |
| Palmier Pro | `palmier-io/palmier-pro` | AI video editor and MCP behavior | no checkout / no fixed commit | `PRODUCT_REFERENCE` candidate |
| waooowaoo | `waooAI/waoowaoo` | AI film production workflow | no checkout / no fixed commit | `PRODUCT_REFERENCE` candidate |
| Toonflow | `HBAI-Ltd/Toonflow-app` | AI short-film workflow | no checkout / no fixed commit | `PRODUCT_REFERENCE` candidate |
| Storyboard | `BroderQi/Storyboard` | shot planning and storyboard workspace | no checkout / no fixed commit | `PRODUCT_REFERENCE` candidate |
| OpenMontage | `calesthio/OpenMontage` | AI video production skill | no checkout / no fixed commit | `MODULE_REFERENCE` candidate |
| video-use | `browser-use/video-use` | Agent video-editor operation | no checkout / no fixed commit | `MODULE_REFERENCE` candidate |
| claude-real-video | `HUANGCHIHHUNGLeo/claude-real-video` | video understanding and frame analysis | no checkout / no fixed commit | `EVIDENCE_ONLY` candidate |
| AutoClip | `zhouxiaoka/autoclip` | highlight detection/automatic cuts | no checkout / no fixed commit | `EVIDENCE_ONLY` candidate |
| BibiGPT-v1 | `JimmyLv/BibiGPT-v1` | audio/video summarization | no checkout / no fixed commit | `EVIDENCE_ONLY` candidate |
| BiliNote | `JefferyHcool/BiliNote` | video notes and knowledge extraction | no checkout / no fixed commit | `EVIDENCE_ONLY` candidate |
| pyvideotrans | `jianchang512/pyvideotrans` | subtitles, translation and dubbing | no checkout / no fixed commit | `MODULE_REFERENCE` candidate |
| baocut | `JimLiu/baocut` | caption/translation skill | no checkout / no fixed commit | `MODULE_REFERENCE` candidate |

## Historical pool disposition

Do not clone the remaining pool by default. Reopen one candidate only when the active R11–R13 slice
names a mechanism absent from the shortlist and Craft/Fleet, and delete the temporary checkout after
the evidence is integrated.

ChatCut is tracked separately as a product behavior reference because it is not an open-source
codebase. Its Agent + transcript + editable timeline behavior must be mapped to the Fleet video
module without copying implementation.
