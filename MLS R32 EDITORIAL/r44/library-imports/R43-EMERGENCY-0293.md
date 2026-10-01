# MLS R43 Emergency v2 — Audit result

- Ticket: `R43-EMERGENCY-0293`
- Worker: `w-7fad7a7ad5b24e36`
- Lease generation: `g000000`
- Stage: `audited`
- Editorial status: `PENDING_CANONICAL_R33_VALIDATION`
- Snapshot SHA-256: `e8ed2e7bb049e5808dca38bbcac0f37f04fb28084dbccacfc69ab76894938d6e`
- Pool manifest SHA-256: `2d48e8c589fce7a85fa56b456be769b169135479e45f9f394171d4e350b43f47`

## Five audited entries

1. `MLS-V04-0961` — **Probablemente: probablement**
   - Body: semantically consistent with reviewed lexical references.
   - Correction required: none identified in the frozen body.
   - Checkpoint SHA-256: `22d9129c679fa3e22f69e284e617561f9c8db39d74df9b1b4b66839b2a9a9b11`

2. `MLS-V04-0962` — **Tal vez: peut-être**
   - Body: the possibility reading, `peut-être que`, clause-internal placement, and written-style inversion are consistent with OQLF guidance.
   - Correction required: none identified in the frozen body.
   - Checkpoint SHA-256: `326f0dc2c4e9635a29f9611301f65d7de0f49ccc4df61916ad2da8a5fbd70d85`

3. `MLS-V04-0964` — **Evidencialidad con d'après/selon**
   - Body: source-attribution explanation is consistent with dictionary evidence.
   - Correction required: three related-link labels do not match their actual frozen targets. Retain the anchors but relabel them as `Devoir epistémico` (#entry-965), `Pouvoir epistémico` (#entry-966), and `Hedging sembler/paraître` (#entry-967), unless canonical validation selects different targets.
   - Checkpoint SHA-256: `2d509b85d7b11ab9579bfba3b73ce2042b4615f683faf6aab7e45490a4442899`

4. `MLS-V04-0965` — **Devoir epistemico**
   - Body: epistemic/inferential use of `devoir` is supported by peer-reviewed linguistic literature.
   - Corrections required: title `Devoir epistémico`; `Probablemente` should target #entry-961, not #entry-966; #entry-967 is actually `Hedging sembler/paraître`, so its label must be corrected or the target reconsidered canonically.
   - Checkpoint SHA-256: `9206e8fdf37ea2dd361630b28c515b47c1cdf82d5bf45b1f5ea03f1b4a1848f5`

5. `MLS-V04-0966` — **Pouvoir epistemico**
   - Body: the distinction between epistemic possibility and permission/capacity/practical possibility is supported by peer-reviewed linguistic literature.
   - Corrections required: title `Pouvoir epistémico`; #entry-967 is actually `Hedging sembler/paraître`, so that related-link label must be corrected or the target reconsidered canonically.
   - Checkpoint SHA-256: `59000b9a6d31b582939aaecde3b7c16120dabff4733fa0434a3821d3f272084e`

## Evidence reviewed

Evidence is real and externally reviewed, but it has **not** been promoted into the canonical MLS Source Registry in this worker run. Therefore the entries remain `SOURCED_PARTIAL` / `PENDING_CANONICAL_R33_VALIDATION`, not VERIFIED.

- Larousse. (n.d.). *Probablement*. Dictionnaire de français. https://www.larousse.fr/dictionnaires/francais/probablement/64034
- Office québécois de la langue française. (n.d.). *Inversion sujet-verbe après des adverbes comme peut-être en tête de phrase*. https://vitrinelinguistique.oqlf.gouv.qc.ca/23472/la-syntaxe/le-sujet-dans-la-phrase/inversion-sujet-verbe-apres-des-adverbes-comme-peut-etre-en-tete-de-phrase
- Larousse. (n.d.). *Selon*. Dictionnaire de français. https://www.larousse.fr/dictionnaires/francais/selon/71921
- Larousse. (n.d.). *Après / d'après*. Dictionnaire de français. https://www.larousse.fr/dictionnaires/francais/apr%C3%A8s/4808
- Dendale, P. (1994). Devoir épistémique, marqueur modal ou évidentiel ? *Langue française, 102*, 24–40. https://doi.org/10.3406/lfr.1994.5712
- Tasmowski, L., & Dendale, P. (1994). Pouvoir, un marqueur d’évidentialité. *Langue française, 102*, 41–55. https://doi.org/10.3406/lfr.1994.5713
- *L’opérateur pouvoir : valeurs, interprétations, reformulations*. (1989). *Langue française, 84*. https://www.persee.fr/doc/lfr_0023-8368_1989_num_84_1_4785

## Canonical-validation note

This worker only audited the frozen snapshot and published append-only evidence/checkpoints. It did not alter the snapshot, manifest, legacy pool, GitHub, or canonical R33 state. `DONE` for this ticket means the Emergency v2 audit artifact set is durable; it does **not** mean the five entries are R33 VERIFIED.
