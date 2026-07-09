# Fleet Documentation & Code Alignment Integration Plan (最终整改方案)

Based on the multi-model independent reviews (Gemini 3.5 Flash, Grok 4.5, GPT-5.6, and Fable-5), this integration plan establishes the final, unified engineering specifications. It resolves all contradictions, version drifts, and code mismatches before Wave 1 implementation begins.

---

## 1. Core Alignment Decisons

### 1.1 Product Naming & Namespaces
-   **Product Name:** **Fleet** (built on the Craft Agents base codebase). All legacy occurrences of "Craft Agents (二开补强)" are deprecated.
-   **System Namespaces:** Exclusively unified under `fleet` (e.g., config folder `.fleet/`, NPM scopes `@fleet/*`, API versioning `fleetApiVersion`, and commands `fleet.verify.sh`).
-   **Technical Selection Matrix:** Added a horizontal warning banner to `docs/ARCHITECTURAL-COMPARISON.md` declaring it as a generated background reference document. The final technical selection is based directly on the code facts in `app/`.

### 1.2 W0 Contract Freeze Alignment
-   **Zod Schema and Action ID Sync:** Bumed `CONTRACT_VERSION` in `app/packages/shared/src/protocol/internal-action.ts` to `1.2.0` and populated the TypeScript `InternalActionId` registry with all 21 action IDs from `docs/contracts/action-ids.md`.
-   **Missing Stub Types:** Updated `docs/contracts/protocol-stubs.md` to declare and freeze `AgentSeat`, `RuntimeLane`, `TeamRun`, `RuntimeLaneEvent`, `TeamContextSnapshot`, and `LaneOutcome`.
-   **Invocation Envelope Parity:** Aligned Zod schema attributes in `internal-action.ts` with Markdown stubs for `ActionInvocation` and `UndoHandle`.

### 1.3 Permission Algebra (Risk Tiers vs. Undoability)
-   **L3 Destructive Support:** Formally integrated `L3_destructive` into both TypeScript and Markdown type definitions.
-   **Orthogonal Decoupling:** Permission levels (L0-L3) and Undoability (supported vs not_supported) are treated as two orthogonal properties:
    -   L0: Read-only, no undo.
    -   L1: Reversible (requires UndoHandle in registry definition).
    -   L2: Irreversible (requires allow-all or explicit user approval).
    -   L3: Destructive (always triggers `SupervisionRequest` dialog).

### 1.4 Code Reality Alignment (App Reuse Corrections)
-   **Reference Project Policy:** Added `源码参考/software/fleet-old` to the green-light permitted list in `docs/REFERENCE-PROJECT-POLICY.md`.
-   **Files to Inspect / Current App Reuse:** Refactored module specifications to point to actual `app/` directories and clearly marked any reference to legacy paths as "to be ported/adapted from `fleet-old`".
-   **M06 Browser Route:** Changed `<webview>` tags to `BrowserView`/`WebContentsView` architecture, aligning with base code properties.
-   **PTY Host Location:** Explicitly defined the main Electron Node process as the host for `node-pty` to prevent native compilation issues on Bun server targets.

### 1.5 Process & Parallelism Gates
-   **Allowed Files:** Corrected all `Allowed Files` lists in agent packets to ensure workers do not directly mutate Lead-owned `protocol/*.ts` files.
-   **Bilingual Validation:** Adjusted pre-flight Q4 check to allow bilingual comments to resolve deadlocks.
-   **Toolchain Commands:** Swapped `pnpm` command examples with `./scripts/craft.sh` bun commands.
-   **Wave Stop Criteria:** Enabled strict checkpoints to block downstream waves if previous phase criteria are unmet.

---

## 2. Directory Split (Module M14 & M15)
-   **M14 Onboarding**: Handled in `docs/modules/14-onboarding.md`.
-   **M15 Messaging**: Handled in `docs/modules/15-messaging.md`.

---

## 3. Execution Plan

1.  **Phase 1 (Sync):** Overwrite protocol-stubs.md and internal-action.ts to enforce exact parity.
2.  **Phase 2 (Harden specs):** Refactor `00-platform-spine`, `02-terminal`, `03-registry`, `05-leases`, `06-browser`, `07-canvas`, `09-video`, `14-onboarding`, and `15-messaging` specs.
3.  **Phase 3 (Verify):** Verify code compilation using `./scripts/craft.sh run typecheck:all`.
4.  **Phase 4 (Commit & Push):** Sync final changes to GitHub.
