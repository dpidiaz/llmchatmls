# MLS-SND — Revisión lingüística independiente de representación wave 02

- **IDs:** SND-REP-001, 009, 010, 011, 012
- **Fecha:** 2026-10-12
- **Rama:** `snd/representation-linguistic-review-wave-02`
- **Resultado global:** PASS_WITH_SCOPE_WARNINGS
- **Gate:** `EVIDENCE_CHECKED → LINGUISTIC_REVIEW`
- **Terminología:** alineada con `editorial/terminology.md` v0.2.

## 1. Resultado por entrada

| ID | Versión revisada | Resultado | Límite preservado |
|---|---|---|---|
| REP-001 | `e9acc0736e57f89d1db22c6b851dd15c2738473f` | PASS | sonido/realización ≠ letra/grafema ≠ símbolo |
| REP-009 | `ce5414298a7e65942c0c1939d0863ddde225d9f6` | PASS_WITH_CROSS_PROFILE_WARNING | ortografía ≠ pronunciación; ejemplos remiten a perfiles |
| REP-010 | `3b25480aecd20fc4bb45b01414a223518c58bef4` | PASS_WITH_INSTITUTIONAL_SCOPE_WARNING | UNGEGN limitado a su mandato; romanización ≠ IPA |
| REP-011 | `102be5724de1b919199500bc02a2775383a5872c` | PASS_WITH_TERMINOLOGY_SCOPE_WARNING | CLDR no fija definición universal; reversibilidad no universal |
| REP-012 | `e8ea6828cf13e01b341009b17b410841e7205a0f` | PASS | sistemas locales se explican por función, no como “IPA local” |

## 2. Correcciones de metadata

- REP-010 todavía marcaba SND-SRC-0049 como pendiente de canonicalización; el Source Registry ya la admite como fuente institucional UNGEGN.
- REP-011 todavía marcaba SND-SRC-0050 como pendiente; el Source Registry ya la admite como referencia técnica CLDR.
- Esas correcciones no añaden claims ni cambian los localizadores existentes.

## 3. Controles transversales

- Ortografía, romanización, transliteración y transcripción fonética permanecen capas distintas.
- El nombre del sistema de romanización debe conservarse cuando sea material.
- UNGEGN no se usa para imponer reversibilidad a toda romanización.
- CLDR conserva su uso terminológico amplio y explícitamente propio.
- Zhuyin y Revised Romanization se presentan como sistemas con funciones documentadas, no equivalentes al IPA.
- Los ejemplos cross-profile de REP-009 no se convierten en claims autónomos dentro de esa entrada.

## 4. Próximo gate

EDITORIAL_REVIEW independiente por versión. Cualquier ampliación material de un sistema concreto debe apoyarse en su fuente y alcance propios.
