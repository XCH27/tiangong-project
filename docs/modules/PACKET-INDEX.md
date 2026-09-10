# Module packet index and execution bridge

This is the cross-document join between the breadth registry, page surfaces and executable specs.
Every one of the 69 registry rows appears once. A blank packet/spec is an explicit gap, not
permission for an implementer to invent a module boundary.

Repository-grounded paths, absence checks and runnable evidence commands are recorded in
[`EXECUTION-EVIDENCE.md`](EXECUTION-EVIDENCE.md). If this index and that register disagree, use
the lower (less complete) status until code and packet are reconciled.

## Status rules

- `BREADTH_ONLY`: named, context-placed and page-mapped; no repository-grounded packet is complete.
- `PACKET_DRAFT`: a module README exists, but evidence, seams or acceptance are incomplete.
- `READY_FOR_SPEC`: packet has all fields in [`MODULE-PACKET-TEMPLATE.md`](MODULE-PACKET-TEMPLATE.md).

Packet depth has only those three values. Whether a release/standing-track spec exists or is
ACTIVE is shown in the separate spec column and remains owned by the spec + roadmap; it is not a
fourth packet state.

A deep suite packet may be referenced by several rows only when those rows share one closed-loop
interface and the packet contains the same required module fields. This avoids duplicate mini-
packets; it does not promote implementation status or create suite-owned state.

`P-xx` IDs are surfaces, not authorities. Acceptance IDs are minimum gates from
[`ACCEPTANCE-INDEX.md`](ACCEPTANCE-INDEX.md), never claims of completion.

## Complete bridge

| ID | Context / kind | Packet | Surface IDs | Release/spec anchor / acceptance | State |
|---|---|---|---|---|---|
| CORE-01 | Work Core / core | — | P-01 | R0 / CORE-01-A | BREADTH_ONLY |
| CORE-02 | Work Core / core | — | P-03 | R1 / CORE-02-A | BREADTH_ONLY |
| CORE-03 | Work Core / core | — | P-02 | R3,R4 / CORE-03-A | BREADTH_ONLY |
| CORE-04 | Work Core / core | — | P-04 | R4,R6 / CORE-04-A | BREADTH_ONLY |
| CORE-05 | Work Core / core | — | P-05 | R1,R2 / CORE-05-A | BREADTH_ONLY |
| CORE-06 | Work Core / surface | — | P-06 | R0 / CORE-06-A | BREADTH_ONLY |
| CORE-07 | Work Core / surface | — | P-07 | R2 / CORE-07-A | BREADTH_ONLY |
| CORE-08 | Work Core / surface | — | P-08 | R2 / CORE-08-A | BREADTH_ONLY |
| CORE-09 | Integrations / adapter | — | P-09 | R2 / CORE-09-A | BREADTH_ONLY |
| CORE-10 | Work Core / capability | — | P-01,P-05 | R1 / CORE-10-A | BREADTH_ONLY |
| CORE-11 | Composition / surface | workbench/README.md | P-10 | R18 / CORE-11-A,WB-001..003 | PACKET_DRAFT |
| INFO-01 | Information / core | — | P-11 | R0,R3 / INFO-01-A | BREADTH_ONLY |
| INFO-02 | Information / product | — | P-12 | R5 / INFO-02-A | BREADTH_ONLY |
| INFO-03 | Information / product | browser/README.md | P-15,P-16 | R3,R5 / BRW-001..004 | PACKET_DRAFT |
| INFO-04 | Information / capability | — | P-13 | R3 / INFO-04-A | BREADTH_ONLY |
| INFO-05 | Creative Media / product | — | P-14 | R3 / INFO-05-A | BREADTH_ONLY |
| INFO-06 | Information / surface | — | P-06 | R0,R3 / INFO-06-A | BREADTH_ONLY |
| INFO-07 | Information / capability | — | P-16 | R5 / INFO-07-A | BREADTH_ONLY |
| INFO-08 | Information / capability | — | P-17 | R2,R5 / INFO-08-A | BREADTH_ONLY |
| EXEC-01 | Governed Execution / core | — | P-18 | R2,R4 / EXEC-01-A | BREADTH_ONLY |
| EXEC-02 | Governed Execution / core | — | P-18,P-50 | R4 / EXEC-02-A | BREADTH_ONLY |
| EXEC-03 | Governed Execution / core | — | P-19 | R0,R4,R18 / EXEC-03-A | BREADTH_ONLY |
| EXEC-04 | Governed Execution / product | — | P-20 | R6 / EXEC-04-A | BREADTH_ONLY |
| EXEC-05 | Governed Execution / adapter | — | P-21 | R0,R6 / EXEC-05-A | BREADTH_ONLY |
| EXEC-07 | Governed Execution / capability | — | P-23 | R6 / EXEC-07-A | BREADTH_ONLY |
| EXEC-08 | Governed Execution / adapter | — | P-24 | R18 / EXEC-08-A | BREADTH_ONLY |
| EXEC-09 | Governed Execution / adapter | — | P-25 | R14 / EXEC-09-A | BREADTH_ONLY |
| EXEC-10 | Integrations / capability | — | P-26 | R4 / EXEC-10-A | BREADTH_ONLY |
| EXEC-11 | Integrations / adapter | — | P-27 | R14 / EXEC-11-A | BREADTH_ONLY |
| EXEC-13 | Integrations / product | — | P-54, P-60 | R14 / EXEC-13-A (diff ladder starts R3-era per C4) | BREADTH_ONLY |
| EXEC-14 | Governed Execution / capability | suites/SYS-03-context-economy.md | P-55 | TE1,R3 / EXEC-14-A | PACKET_DRAFT |
| EXEC-15 | Governed Execution / adapter | — | P-15,P-24 | R16 / EXEC-15-A | BREADTH_ONLY |
| INTEL-01 | Intelligence / capability | suites/SYS-03-context-economy.md | P-29 | TE1,R3,R9 / INTEL-01-A | PACKET_DRAFT |
| INTEL-02 | Intelligence / capability | suites/SYS-03-context-economy.md | P-29 | TE1,R3 / INTEL-02-A | PACKET_DRAFT |
| INTEL-03 | Intelligence / adapter | suites/SYS-03-context-economy.md | P-30 | R17 / INTEL-03-A | PACKET_DRAFT |
| INTEL-04 | Intelligence / core | suites/SYS-03-context-economy.md | P-30 | TE1,R3,R17 / INTEL-04-A | PACKET_DRAFT |
| INTEL-05 | Intelligence / product | memory/README.md | P-31 | R9 / MEM-001..005,INTEL-05-A | PACKET_DRAFT |
| INTEL-06 | Intelligence / capability | suites/SYS-03-context-economy.md | P-32 | R15 / INTEL-06-A | PACKET_DRAFT |
| INTEL-07 | Intelligence / capability | suites/SYS-03-context-economy.md | P-33 | R3,R17 / INTEL-07-A | PACKET_DRAFT |
| CREATE-01 | Composition / surface | canvas/README.md | P-34 | R7 / CAN-001..004 | PACKET_DRAFT |
| CREATE-02 | Creative Media / product | video/README.md | P-35 | R12 / VID-001..004 | PACKET_DRAFT |
| CREATE-03 | Creative Media / product | — | P-36 | R11 / CREATE-03-A | BREADTH_ONLY |
| CREATE-04 | Creative Media / product | — | P-37 | R12 / CREATE-04-A | BREADTH_ONLY |
| CREATE-05 | Creative Media / capability | — | P-38 | R12 / CREATE-05-A | BREADTH_ONLY |
| CREATE-06 | Creative Media / product | design/README.md | P-39 | R10 / DSN-001..004 | PACKET_DRAFT |
| CREATE-07 | Creative Media / product | — | P-40 | R10 / CREATE-07-A | BREADTH_ONLY |
| CREATE-08 | Creative Media / product | deck-motion/README.md | P-41 | R13 / DECK-001..004 | PACKET_DRAFT |
| CREATE-09 | Creative Media / capability | deck-motion/README.md | P-42 | R13 / CREATE-09-A | PACKET_DRAFT |
| CREATE-10 | Creative Media / product | — | P-43 | R12 / CREATE-10-A | BREADTH_ONLY |
| CREATE-11 | Creative Media / capability | — | P-44 | R10,R13 / CREATE-11-A | BREADTH_ONLY |
| CREATE-12 | Integrations / capability | jobs/README.md | P-45 | R5,R8,R10-R14 / CREATE-12-A | PACKET_DRAFT |
| CREATE-16 | Creative Media / product | — | P-14 | R10 / CREATE-16-A | BREADTH_ONLY |
| ORCH-01 | Composition / product | workflows/README.md | P-46 | R8 / WF-001..004 | PACKET_DRAFT |
| ORCH-02 | Governed Execution / surface | workflows/README.md | P-47 | R8 / ORCH-02-A | PACKET_DRAFT |
| ORCH-03 | Intelligence / product | suites/SYS-08-marketplaces.md | P-48,P-56 | R15 / ORCH-03-A | PACKET_DRAFT |
| ORCH-04 | Governed Execution / adapter | suites/SYS-08-marketplaces.md | P-48,P-56 | R4,R6 / ORCH-04-A | PACKET_DRAFT |
| ORCH-05 | Integrations / core | jobs/README.md | P-49 | R11-R13 / JOB-001..004 | PACKET_DRAFT |
| ORCH-06 | Work Core / core | — | P-50 | R3,R4 / ORCH-06-A | BREADTH_ONLY |
| ORCH-07 | Composition / surface | — | P-51 | R4,R6 / ORCH-07-A | BREADTH_ONLY |
| ORCH-08 | Integrations / capability | — | P-52 | R0,R2,R18 / ORCH-08-A | BREADTH_ONLY |
| ORCH-10 | Intelligence / product | suites/SYS-08-marketplaces.md | P-56,P-57 | R15 / ORCH-10-A | PACKET_DRAFT |
| ORCH-11 | Governed Execution / product | suites/SYS-08-marketplaces.md | P-56,P-58 | R15 / ORCH-11-A | PACKET_DRAFT |
| ORCH-12 | Governed Execution / adapter | suites/SYS-08-marketplaces.md | P-56,P-59 | R15 / ORCH-12-A | PACKET_DRAFT |

Before activation, replace any `-A` breadth gate with Given/When/Then, exact files/symbols,
evidence commands and rollback scope in the active spec. A surface or acceptance ID alone never
promotes a capability to `usable`.
