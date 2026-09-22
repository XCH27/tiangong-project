# Owner Guide

> The owner does not need programming knowledge. The owner states the desired outcome, decides at
> high-risk checkpoints, and accepts visible results. Agents own implementation and all verification
> below final look-and-feel acceptance.

## 1. Request template

Plain language is enough; the agent will normalize the order.

```text
DESIRED OUTCOME: One or two sentences describing the result.
WHY IT MATTERS: The product intent that should guide trade-offs.
DO NOT CHANGE: Optional protected behavior, data or naming.
DONE WHEN: What the owner will inspect or try.
```

Add: “Follow `AGENTS.md` and `docs/05-ROADMAP.md`.” This invokes the Craft-first check, single-
authority rules, acceptance discipline and honest status reporting. For discussion only, say:
“Discuss first; do not change code.”

## 2. Mandatory owner checkpoints

An agent must stop and obtain explicit approval before:

1. spending money or causing an irreversible/public effect, including paid APIs, bulk generation,
   deletion, deployment, publication, external messages or merge to remote `main`;
2. adding a production dependency or external service that changes licensing, security, packaging
   or maintenance risk;
3. creating or replacing an authority or security boundary, such as Session storage, permission,
   credentials, migration or a durable Job store;
4. choosing between materially different product outcomes, or deleting/changing established
   behavior; and
5. merging to remote `main`.

The checkpoint request must explain: **what · why · cost/risk · two or three options · recommendation**.
If a non-technical owner cannot understand it, the agent must rewrite it.

## 3. Work that proceeds without approval

Within the accepted scope, agents proceed with reversible work:

- ordinary implementation and fixes caused by that implementation;
- selection of code organization and technical patterns;
- read-only inspection, tests, builds and type checks.

Short rule: money, irreversible effects, production dependencies, authorities and product-direction
forks require a checkpoint; reversible scoped implementation continues.

## 4. Acceptance

Every delivery report includes a plain-language outcome, status, a short **CHECK THIS** list,
unchanged scope and synchronized documentation. The owner then:

1. follows the CHECK THIS actions;
2. judges appearance and feel, including light/dark, `zh-Hans`/English and narrow-window behavior;
3. accepts the result, allowing promotion to `usable`; or
4. identifies the visible mismatch, preferably with a screenshot, creating the next bounded fix.

The owner does not need to re-check logic, data integrity or code quality; agents own those levels
under [`09-QUALITY.md`](09-QUALITY.md).

## 5. Capability status vocabulary

| Status | Meaning |
|---|---|
| `usable` | The real path is verified; visible behavior has owner acceptance. For a wholly non-visual capability, the agent may establish usability with a real closed loop under `09-QUALITY.md`. |
| `wired but not visually checked` | The real path and logic are verified; owner visual acceptance remains. |
| `display-only` | A UI shell exists without real behavior; it is not complete. |
| `not implemented` | The capability does not exist. |

Phrases such as “mostly done” or “should work” are invalid capability statuses.

## 6. Duty to dissent

The owner owns product intent; agents choose technical routes. If an owner suggestion is technically
suboptimal, the agent must first state the better route, why, and the cost of both options. Silent
implementation of a known-bad route is a failure of responsibility, not obedience. The owner can
always ask: “Is this the best technical route?”

## 7. Three useful questions

- “Where is the project now?” → answer from `05-ROADMAP.md`, current code and the capability map.
- “Can this capability really be used?” → answer with the fixed status and evidence.
- “What should happen next?” → follow the current explicit owner task; otherwise execute the single ACTIVE roadmap contract.

The roadmap is the complete R0–R18 development order, not near/mid/far-term buckets. Every
capability has an order owner in `modules/PACKET-INDEX.md`. R16 owns the specified-local-app Component after the baseline and host. Remaining R17/R18 conditional capabilities must
end in implementation or evidence-backed `NO_GAP`; an agent cannot leave them as “later”.

The owner may explicitly reorder work by saying “Do X first.” The agent updates the canonical
roadmap and affected contract. The current order is baseline rectification and acceptance first,
then Component/panel foundation, then added capabilities; see the single exit in
[`specs/R0-baseline-audit.md`](specs/R0-baseline-audit.md).

Old project documents and files are deleted after their useful content is absorbed and links are
updated. Keeping a second archive copy is not completion; tracked Git history supplies recovery.
Live user data and external reference checkouts retain their separate safeguards.
