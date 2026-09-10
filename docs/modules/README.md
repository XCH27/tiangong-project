# Module design library

This directory contains durable design packets for large product modules. These documents are
not claims that the modules are implemented. They preserve product breadth and compatibility
decisions until a bounded spec activates implementation.

The complete breadth registry is [`REGISTRY.md`](REGISTRY.md). The packet index is
[`PACKET-INDEX.md`](PACKET-INDEX.md), and the registry-to-context crosswalk is
`REGISTRY.md`. It is intentionally larger than the
set of module folders that currently have deep packets.
The large independent delivery systems that combine these rows are defined in
`REGISTRY.md`; this folder remains the packet/authority home.
Use `SUITE-PACKET-TEMPLATE.md` when assigning one suite to an Agent.
The eight executable assignment packets are indexed in [`suites/README.md`](suites/README.md).

Read `REGISTRY.md` before turning a registry row into a new module.
The registry is a coverage inventory; the taxonomy and bounded contexts define the architecture.

The canonical contexts are `REGISTRY.md`. Legacy domain design is restored through
`REGISTRY.md`, not deleted or blindly copied.

The cross-document join is [`PACKET-INDEX.md`](PACKET-INDEX.md): it maps every registry row to
their context, architectural kind, surface IDs, packet/spec and acceptance IDs. The minimum
observable gate for each row is [`ACCEPTANCE-INDEX.md`](ACCEPTANCE-INDEX.md). A row without a packet
is intentionally `BREADTH_ONLY`; it must not be implemented from the registry's one-line anchor.
The repository-grounded path and command audit is `PACKET-INDEX.md`;
it is required before a breadth row is promoted.

Each module must contain a `README.md` with the compatibility record required by
[`../14-MODULE-ARCHITECTURE.md`](../14-MODULE-ARCHITECTURE.md). Detailed reference evidence lives
under [`../references/`](../references/), not as unsupported prose in the module packet.

Initial module homes:

- [`canvas/`](canvas/)
- [`video/`](video/)
- [`browser/`](browser/)
- [`memory/`](memory/)
- [`jobs/`](jobs/)
- [`design/`](design/)
- [`deck-motion/`](deck-motion/)
- [`workflows/`](workflows/)
- [`workbench/`](workbench/)
