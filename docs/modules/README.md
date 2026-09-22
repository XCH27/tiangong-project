# Module packets — one closed loop, one document

A **suite packet** under [`suites/`](suites/) is the single entry point for one closed product loop.
Take a loop, read its packet, and you have the loop's rows, boundary, first proof, acceptance IDs and
stop conditions in one place. That is what makes parallel and incremental development possible: two
people can work two loops without reading each other's documents, and a loop can be verified on its
own instead of by hunting the same subject across four directories.

**These packets are not claims that the modules are implemented.** They preserve product breadth and
compatibility decisions until a bounded spec activates implementation. Status vocabulary is the fixed
one in [`../../AGENTS.md`](../../AGENTS.md) rule 7.

## The four files here

| File | Answers |
|---|---|
| [`suites/`](suites/) | **Start here.** One packet per closed loop, `SYS-01`…`SYS-09` |
| [`REGISTRY.md`](REGISTRY.md) | The breadth inventory — every capability row that exists as a product intention |
| [`PACKET-INDEX.md`](PACKET-INDEX.md) | The cross-document join: each registry row → its context, page surfaces, packet, release anchor and acceptance IDs |
| [`ACCEPTANCE-INDEX.md`](ACCEPTANCE-INDEX.md) | The minimum observable gate for each row |

Every row now has one `Execution <ID>` section in its owning packet. Use its `Sources`, `Deliver`,
`Data`, `Failure`, `Proof` and `Reference` fields together with the common contract in
`../14-MODULE-ARCHITECTURE.md`. `IMPLEMENT` and `PROVE` describe the next work after the release
gate opens; neither means the product already works. Do not implement from a registry summary alone.

## Adding to a loop

Write into the existing suite packet. Create a new packet only when the work is a genuinely separate
closed loop — a new surface with its own first proof and its own stop conditions — not when it is
another facet of a loop that already has a packet. Compatibility-record requirements are in
[`../14-MODULE-ARCHITECTURE.md`](../14-MODULE-ARCHITECTURE.md); detailed reference evidence belongs
under [`../references/`](../references/), never as unsupported prose in a packet.
