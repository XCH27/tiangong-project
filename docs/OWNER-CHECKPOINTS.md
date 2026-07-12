# Owner Checkpoints — when the agent must stop and ask you

> **This page is written for the owner (you), in plain language — no coding knowledge needed.** It
> exists so that even though agents do the coding, **you keep control of the decisions that actually
> matter**: money, irreversible actions, production runtime commitments, new state/security authorities,
> public effects, and product direction. The agent moves fast, but it stops for
> a human at the dangerous moments.
>
> **For agents:** the items under "STOP and ask" below are hard checkpoints. Treat them like the
> highest-risk tier in `07-AGENT-RULES.md`. When you hit one, do not proceed on assumption — present the
> decision to the owner in plain language (what, why, the cost/risk, the options) and wait. This is not
> optional and it is not "more ceremony" — it is the owner's steering wheel.

## STOP and ask the owner first (hard checkpoints)

The agent must pause and get the owner's explicit "yes" before doing any of these:

1. **Anything that spends meaningful new money or can't be undone.** Starting a **new class of paid
   usage** (a new paid provider/API, batch generation runs, anything whose cost is unbounded or
   materially above the session's normal usage), deleting data, publishing or deploying anything
   public, merging into the main line (`main`), sending messages on the owner's behalf, or any external
   side effect that can't be cleanly reversed. → Say what it costs or why it's irreversible, then wait.
   (Ordinary model calls inside a session the owner already started are normal operation, not a
   checkpoint — the product would be unusable otherwise.)
2. **Adding a production runtime dependency, new technology stack, or external service.** This includes
   an interactive PTY runtime, new database, hosted provider, or package that ships in the app and
   materially changes license/security/maintenance risk. → Explain the Craft-native alternative,
   runtime/bundle impact, license, and rollback. A test-only/dev-only dependency with no shipped effect
   may be chosen inside an already-approved slice after normal review.
3. **Creating or replacing a shared authority or safety boundary.** A new session, permission,
   timeline, job/store authority, persisted-data migration, credential boundary, or authorization
   semantics change requires explicit approval. Ordinary edits inside an already-approved coherent
   core slice do not require repeated approval file by file.
4. **A real fork in product direction.** When a feature could be built in meaningfully different ways,
   or when something would be removed or its behavior changed. → Lay out the options and trade-offs in
   plain language and let the owner choose. The agent picks the *technical* route on its own (see
   Decision G1), but a *product* fork is the owner's call.

If in doubt, ask. A ten-second question is cheaper than an irreversible mistake.

## How to ask (so a non-programmer can decide)

When stopping at a checkpoint, the agent presents:

- **What** it wants to do, in one plain sentence (no jargon).
- **Why** — the benefit.
- **The cost / risk** — money, irreversibility, or what could break.
- **The options** — usually 2–3, with a recommended one and why.

The owner does not need to read code to decide — the agent must make the decision understandable on its
own terms.

## The agent may proceed on its own (no need to ask)

To keep "入门容易" for the owner (you are not a bottleneck for routine work), the agent should **not**
stop for ordinary, reversible, in-scope work, including:

- Ordinary coding inside the agreed path scope of one coherent slice.
- Choosing the *technical* implementation route (which pattern, how to structure the code) — that is the
  agent's job, not a question for the owner (Decision G1).
- Running read-only commands, tests, builds, typecheck, and lint.
- Reversible edits that stay within the feature's declared scope and preserve user data.
- Fixing its own bugs and cleaning up its own work.

The principle: **stop for money, irreversibility, production runtime commitments, new authorities or
safety boundaries, public effects, and product forks; otherwise keep moving.** Approval applies to a
coherent slice and its risk boundary, not every ordinary implementation step inside it.

## Relationship to the rest of the docs

- The safety boundaries these checkpoints enforce are the durable ones in
  [`03-NON-NEGOTIABLES.md`](03-NON-NEGOTIABLES.md) §5–6.
- The engineering mechanics (diff review, dangerous-command approval via Craft's permission gate,
  rollback) are in [`07-AGENT-RULES.md`](07-AGENT-RULES.md) → Engineering guardrails.
- This page is the **owner-facing** view of those: the short list of moments where the human holds the
  wheel.
