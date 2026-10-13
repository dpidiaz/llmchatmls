# MLS-SND — Revisión lingüística independiente de KO-002

- **Entrada:** SND-KO-002 — Sistema consonántico: mapa de evidencia
- **Fecha:** 2026-10-12
- **Rama:** `snd/ko002-linguistic-review-wave-01`
- **Versión revisada:** blob `b9153a934ce582dce9b1a6fa8fe1167537442406`
- **Resultado:** `LINGUISTIC_REVIEW / PASS_WITH_SCOPE_WARNING`

## 1. Veredicto

La entrada es lingüísticamente apta **como mapa de evidencia parcial**. No es apta todavía para presentarse como inventario consonántico contemporáneo completo del coreano, y el propio texto conserva esa frontera de forma explícita.

## 2. Controles

| Control | Evaluación |
|---|---|
| Lee (1993) se trata como referencia histórica con advertencia temporal | PASS |
| Evidencia contemporánea de oclusivas queda delimitada a Seúl | PASS |
| Posición prosódica se conserva como variable material | PASS |
| Cambio VOT/f0 no se presenta como pista universal fija | PASS |
| lax / tense / aspirated no se reducen a oposición sonora/sorda | PASS |
| Fricativas, africadas, nasales, líquidas y codas siguen abiertos | PASS |
| No se fabrica una tabla final a partir de un único Illustration of the IPA | PASS |
| Diferencia inventario fonológico ↔ implementación acústica se mantiene visible | PASS |

## 3. Scope warning

`SND-SRC-0021` y `SND-SRC-0033` respaldan afirmaciones específicas sobre oclusivas y cambio acústico en coreano de Seúl. No permiten cerrar por sí solos los demás clusters consonánticos ni describir sin matices todas las variedades de coreano.

La condición `EVIDENCE_CHECKED` de la versión revisada era correcta únicamente para el mapa y sus claims presentes. Esta revisión hereda exactamente ese alcance.

## 4. Relación con KO-003

SND-KO-003 desarrolla el cluster contemporáneo de oclusivas y ya conserva:
- tres categorías analíticas;
- dependencia de posición prosódica;
- pistas acústicas múltiples;
- advertencia contra convertir el cambio descrito en “coreano ya tonal”.

KO-002 es coherente con esa entrada y no duplica su función: actúa como mapa de cobertura y gaps.

## 5. Cambios autorizados

Solo:
- promoción del estado del mapa a `LINGUISTIC_REVIEW`;
- constancia del gate.

No se modifican claims, localizadores, Source IDs, IPA, categorías consonánticas ni gaps.

## 6. Próximo gate

EDITORIAL_REVIEW independiente del mapa. La preparación para composición debe seguir mostrando de forma inequívoca que varios clusters siguen sin cierre contemporáneo.
