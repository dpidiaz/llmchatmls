# KO-002 wave 02 — integration audit

**PR:** #7405  
**Fecha:** 2026-10-11  
**Tipo:** source/integration audit; no sustituye LINGUISTIC_REVIEW.

## Resultado

**LOCAL CONSISTENCY: PASS**  
**MATRIX INTEGRATION: BLOCKED_BY_LOCAL_SOURCE_IDS**

KO-002 cita dos fuentes locales nuevas:

- KO-W2-S01 — Lee (2016), africadas de Seúl.
- KO-W2-S02 — Lee & Jongman (2016), fricativas Seúl/South Kyungsang.

Ambas existen en `SOURCE-MAP-CONSONANTS-WAVE-02.md`.

## Fuentes canónicas ya válidas

- SND-SRC-0020 — Lee (1993), Illustration histórica.
- SND-SRC-0021 — Schweizer, Ahn & Kwon (2026), oclusivas contemporáneas.
- SND-SRC-0032 — NIKL Standard Pronunciation Rules.
- SND-SRC-0033 — Bang et al. (2018), cambio en oclusivas.

## Gate por cluster

| Cluster | Estado |
|---|---|
| Oclusivas | EVIDENCE_CHECKED; detalle delegado a KO-003 |
| Africadas | EVIDENCE_CHECKED como mapa; fuente local pendiente de canonicalizar |
| Fricativas | EVIDENCE_CHECKED como mapa; fuente local pendiente de canonicalizar |
| Nasales | OPEN_QUESTION |
| Líquida / ㄹ | OPEN_QUESTION |
| Codas | OPEN_QUESTION descriptivo; norma disponible |

## Regla de integración

No fusionar KO-002 con `KO-W2-S01/02` vivos.

Antes de merge:
1. deduplicar/canonicalizar las dos fuentes;
2. reescribir KO002-C05/C06 a IDs SND-SRC;
3. ejecutar source-ID integrity;
4. pasar LINGUISTIC_REVIEW independiente.

## Dictamen

La wave está **RESEARCH READY / SOURCE-INTEGRATION BLOCKED**.

El cambio de SOURCE_MAPPED → EVIDENCE_CHECKED es válido únicamente para el **mapa de cobertura**, no para un inventario consonántico contemporáneo completo.
