# Agent instructions for MASTER LANGUAGE SYSTEM

This repository is the canonical source for MLS project contracts and operational documentation.

## MLS Watchdog commands

When the user issues any command beginning with `MLS` and containing `watchdogs` or `watchdog group`, read and follow:

`docs/watchdogs/MLS Watchdog Protocol R1.md`

Machine-readable command names are in:

`docs/watchdogs/MLS Watchdog Commands.json`

Logical group records are in:

`docs/watchdogs/MLS Watchdog Registry.json`

Important invariants:

- watchdog groups are chat-scoped;
- never operate on another chat's group unless the user uses the explicit global command;
- never identify a group by 00, 20 or 40 alone;
- use the GROUP ID as the isolation key;
- activation and reactivation must not intentionally leave a partial group;
- do not store raw ChatGPT conversation IDs, task IDs, credentials or private runtime identifiers in this public repository;
- the Scheduled task service is authoritative for live task state;
- GitHub stores the durable protocol and privacy-safe logical registry;
- preserve unrelated Scheduled tasks.

If the protocol conflicts with informal remembered wording, the repository protocol wins.
