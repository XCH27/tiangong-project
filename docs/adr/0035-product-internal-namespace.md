# ADR-0035 — Product / Internal Namespace

> **Status:** Accepted  
> **Date:** 2026-07-09  
> **Closes:** DECISIONS-LEDGER pending “Product/internal namespace”  

## Context

Plugin keys, storage prefixes, and action namespaces could not freeze without a product rule.
Dot-count must not be used as a security heuristic (D35).

## Decision

1. **Upstream Craft identifiers** stay as Craft defines them (package names, existing preference
   keys, protocol channel names already in v0.11). Do not mass-rename during W0.1.
2. **Fleet-owned action ids** use stable `domain.verb` / `domain.object_verb` strings
   (e.g. `file.create`, `aigc.job_submit`). New domains require Lead contract bump.
3. **Fleet-owned preference / storage keys** introduced by Fleet use prefix `fleet.`  
   (example: `fleet.layout.v1`, `fleet.jobs.v1`). Never collide with undocumented Craft keys.
4. **Capability / plugin ids** use reverse-DNS style `fleet.<module>.<name>` for first-party and
   `plugin.<vendor>.<name>` for third-party (W4). Version is a separate SemVer field, not embedded
   only in the id.
5. **TypeScript packages:** retain `@craft-agent/*` / existing monorepo names until an explicit
   packaging ADR; optional future `@fleet/*` adapters wrap, not fork, Craft packages.
6. **Security:** absence of a namespace field defaults to most restrictive behaviour (D33). Namespace
   string format is not permission.

## Consequences

- W0.1 item 7 (namespace before plugin/storage freeze) is **satisfied for documentation**.
- Implementation of new keys must follow `fleet.` / capability rules above.
- Action-id table reclassification remains a separate freeze task.

## Non-goals

- Rebranding Craft UI strings
- Renaming `craft-cli` binary in W0.1
- Inferring privilege from number of dots in an id
