# MLS Watchdog Protocol R1

Version: R1
Repository: dpidiaz/llmchatmls
Default timezone: America/Guatemala
Status: canonical operational contract

## Purpose

MLS Watchdog keeps an already-authorized MASTER LANGUAGE SYSTEM workstream moving when a normal ChatGPT turn ends. It does not create new project scope. It periodically resumes the work associated with the chat in which the watchdog group was created.

The protocol uses three ordinary hourly Scheduled tasks, offset at minute 00, 20 and 40. Each individual task remains hourly, while the combined group produces an effective pulse every 20 minutes.

## Core invariant

A watchdog group belongs to exactly one originating chat.

A group created in Chat A must never be treated as the group for Chat B. Another chat may create its own independent group, subject to the active Scheduled task limit of the account.

Never identify a group only by the suffix 00, 20 or 40. Every group has a unique logical GROUP ID.

Example:

- MLS Watchdog WDG20260921A 00
- MLS Watchdog WDG20260921A 20
- MLS Watchdog WDG20260921A 40

The GROUP ID is the isolation key.

## Public repository privacy rule

This repository is public.

Do not write raw ChatGPT conversation IDs, task IDs, authentication data, tokens, cookies, internal URLs or other private runtime identifiers into GitHub.

The registry stores only logical GROUP IDs, human-safe task titles, schedule metadata and logical status.

The ChatGPT Scheduled task service is the runtime source of truth for actual task IDs and enabled state. The GitHub registry is the durable logical catalog and protocol history.

## Commands

### MLS activar watchdogs

Scope: current chat only.

Required behavior:

1. Read this protocol before acting if it has not already been loaded in the current chat.
2. Inspect current Scheduled tasks.
3. Determine whether this chat already has a watchdog GROUP ID from its conversation context.
4. If the current chat already has a complete group of three tasks, enable that group instead of creating duplicates.
5. If no group exists for this chat, generate a unique GROUP ID in the form WDG plus date plus a short unique suffix.
6. Preflight account capacity. A complete group requires three active task slots. Never create or enable a partial group.
7. Create exactly three tasks for the current chat:
   - minute 00, hourly;
   - minute 20, hourly;
   - minute 40, hourly.
8. Use exact scheduling in America/Guatemala unless the user explicitly establishes another timezone.
9. Title each task exactly with the GROUP ID:
   - MLS Watchdog <GROUP ID> 00
   - MLS Watchdog <GROUP ID> 20
   - MLS Watchdog <GROUP ID> 40
10. Give all three tasks the same watchdog execution prompt defined below.
11. Verify all three tasks exist and are enabled.
12. Fetch the latest registry, add or reconcile the logical group record, and write it back using the latest file SHA.
13. Report the GROUP ID to the user.

Idempotency:

Running MLS activar watchdogs repeatedly in the same chat must not create duplicates. If the group already exists, reconcile and enable it.

Atomicity:

If there are not enough active task slots for all three tasks, create none.

If creation or activation fails after only part of the group has been changed, roll the changed tasks back to paused when possible and report the failure. Never intentionally leave a two-task or one-task active group.

### MLS detener watchdogs

Scope: current chat only.

Required behavior:

1. Resolve the current chat's GROUP ID from the current conversation context.
2. Inspect Scheduled tasks.
3. Match only tasks whose titles contain that exact GROUP ID.
4. Pause its 00, 20 and 40 tasks.
5. Never pause another group's tasks.
6. Update that group's logical registry status to paused.
7. Verify all three are paused.

If the current chat's GROUP ID cannot be determined safely, do not guess and do not fall back to a global stop.

### MLS reactivar watchdogs

Scope: current chat only.

Required behavior:

1. Resolve the current chat's GROUP ID.
2. Find exactly its three tasks.
3. Preflight capacity for all three.
4. Enable all three atomically where possible.
5. If a partial enable occurs, roll back the tasks enabled during the attempt.
6. Update registry status to active.
7. Verify the 00, 20 and 40 tasks are enabled.

### MLS estado watchdogs

Scope: current chat only.

Report:

- GROUP ID;
- logical scope;
- 00 task enabled or paused;
- 20 task enabled or paused;
- 40 task enabled or paused;
- effective pulse cadence;
- last and next run information when the Scheduled service exposes it;
- registry status;
- any mismatch between registry and runtime.

Runtime state wins over registry state if they disagree. Reconcile the registry afterward when GitHub write access is available.

### MLS detener watchdogs global

Scope: all MLS watchdog groups visible to the user's Scheduled task account.

Required behavior:

1. Inspect Scheduled tasks.
2. Select only tasks whose titles follow the exact MLS Watchdog group naming contract.
3. Pause every matching MLS watchdog task regardless of originating chat.
4. Do not alter reminders, monitoring tasks or any non-MLS automation.
5. Update every known watchdog registry record to paused when GitHub write access is available.
6. Verify the resulting MLS watchdog active count.

This command is intentionally global. It is the only stop command allowed to cross chat boundaries.

### MLS estado watchdogs global

Read-only global inspection.

List logical GROUP IDs and the state of their 00, 20 and 40 members without changing them.

## Execution prompt contract

Every member of a watchdog group must carry equivalent instructions to:

1. Continue only the already-authorized pending MLS work associated with this task group's originating chat.
2. Do real work rather than merely reporting: inspect, resume, analyze, implement, test, correct and verify.
3. Preserve previously established MLS constraints.
4. Never modify another watchdog group.
5. Avoid duplicate or concurrent changes if another execution from the same group is already operating on the same target.
6. On a genuine user-dependent blocker, report BLOCKED with the exact blocker.
7. On completion, report DONE and attempt to pause all three tasks of the same GROUP ID if automation-management capability is available.
8. On incomplete work, leave a concise checkpoint containing DONE, CURRENT, NEXT and BLOCKERS.
9. When GitHub write access is available, reconcile this group's logical registry record after a state transition.

## Schedule contract

Each group contains exactly three ordinary recurring schedules:

- 00 member: hourly at minute 00.
- 20 member: hourly at minute 20.
- 40 member: hourly at minute 40.

Together:

00 -> 20 -> 40 -> next hour 00.

No individual task may be configured to recur more frequently than hourly.

## Capacity rule

Scheduled task capacity is an account-level product constraint, not an MLS setting.

A group requires three active task slots. Before creating or reactivating a group, inspect current active tasks. If fewer than three slots are available, do not create or partially activate the group.

A chat may still have a registered paused group while another chat owns the available active slots.

## Registry semantics

Canonical logical registry:

docs/watchdogs/MLS Watchdog Registry.json

Schema:

docs/watchdogs/MLS Watchdog Registry Schema.json

The registry is intentionally privacy-safe. It must never contain raw conversation IDs or task IDs.

Registry status values:

- active
- paused
- done
- blocked
- unknown

The Scheduled task service is authoritative for live enabled or paused state.

## Concurrency rule

Two executions from the same GROUP ID must not knowingly make concurrent writes to the same target.

If a pulse arrives while equivalent work is clearly in progress, the newer pulse should exit without duplicating work.

Different chat groups are isolated by default. If two groups intentionally work on the same GitHub branch or artifact, normal repository locking, branch isolation and merge discipline still apply.

## Completion rule

Watchdogs exist to continue an authorized objective until completion, not forever.

When the current chat's authorized objective is fully complete and verified:

1. mark the execution DONE;
2. pause the three members of the current GROUP ID when possible;
3. update the logical registry to done when GitHub write access is available;
4. do not modify unrelated tasks.

## Recovery

If a chat loses local context but the user knows the GROUP ID, the explicit recovery command is:

MLS watchdog group <GROUP ID>

After the group is established explicitly, local commands may operate on that group.

Never infer an ambiguous group from generic task names.

## Versioning

Protocol changes require a new revision or an explicit compatible update to R1.

Any chat implementing these commands should prefer this repository document over remembered informal wording.
