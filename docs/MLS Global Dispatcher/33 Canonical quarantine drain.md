# Canonical quarantine controlled drain

This change applies only to `mls_canonical_queue`; R44 durable quarantine is untouched.

## Problem

The first quarantine recovery implementation allowed at most five releases every five minutes and required a material context fingerprint change for source/context and editorial failures. In production that left thousands of canonical rows effectively parked even while the Unified Runner was active.

## Drain policy

A global D1 gate now examines at most 100 canonical quarantines per five-minute recovery window.

- Context-changed rows remain recoverable under the existing fingerprint rules.
- Technical/transient rows retain the existing maximum of two same-context retries.
- Source/context and editorial rows may receive one same-context retry only after `unifiedR33CanonicalPreflight` passes.
- The preflight performs no AI inference and no source fetch. It only checks the current reconciled article, registered source candidates, safe URLs/source types, and authority-tier availability.
- A failed preflight consumes that same-context review opportunity so the row cannot spin. A later material context change can reopen recovery.
- The lifetime cap of six automatic releases remains in force.

Rows released by the sweep enter the existing R33 preparation path and still must pass R33, serialized integration, and canonical VERIFIED publication. A repeated editorial/source failure returns to QUARANTINED.

## Safety invariants

- No R44 regeneration.
- PREPARED evidence is not regenerated or downgraded.
- VERIFIED rows are never downgraded.
- Existing leases, compare-and-swap history, retry fencing, FREE-only quota policy, and GitHub-main VERIFIED authority remain unchanged.
- Unknown/hash-context failures are not blindly retried.
