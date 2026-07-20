# Grok source-audit run log

This log records machine-review attempts. A failed run is evidence that the candidate remains
unadmitted; it is never silently converted into a prose conclusion. The command is read-only and
the validator checks every returned path against the real checkout.

| Date | Checkout | Result | Validator evidence | Consequence |
|---|---|---|---|---|
| 2026-07-17 | `plugins/xyflow` | first attempt rejected | returned a directory as an evidence path | no admission |
| 2026-07-17 | `plugins/xyflow` | completed | schema valid; 8 capability records; `INSUFFICIENT_COMPARISON`, `NO_COMPARISON_EVIDENCE` | source-reviewed, still candidate |
| 2026-07-17 | `software/opencut-classic` | rejected | returned nonexistent `源码参考/software/plugins/react-timeline-editor/...` path | no admission; OpenCut remains candidate |
| 2026-07-17 | `plugins/headroom` | rejected | returned nonexistent `headroom/proxy/copilot_auth.py` path | no admission; Headroom remains candidate |
| 2026-07-17 | `software/opencode` | rejected | Grok ended with non-parseable structured output | no admission; OpenCode remains candidate |

The validator's strict failure is intentional: a README-level or plausible-looking mechanism is
not enough. Re-run a candidate only after its prompt/evidence issue is corrected; never mark a
checkout reviewed merely because Grok produced a long narrative. The canonical admission state is
[`REFERENCE-REGISTRY.md`](REFERENCE-REGISTRY.md), and the runner is
[`../../源码参考/scripts/compare_with_grok.sh`](../../源码参考/scripts/compare_with_grok.sh).
