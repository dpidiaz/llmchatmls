# SND-REF-005 — Tabla de romanizaciones, transliteraciones y capas de representación

**Estado:** PROVISIONAL_LIVING_TABLE.

## Propósito

Esta tabla responde a tres preguntas distintas:

1. ¿Cuál es la escritura principal de la lengua?
2. ¿Existe una romanización/transliteración auxiliar aprobada por MLS-SND?
3. ¿Qué capa se usa cuando hace falta precisión fonética?

**Regla:** romanización, transliteración, sistema local de anotación e IPA no son categorías intercambiables.

## Tabla canónica provisional

| Perfil | Escritura/capa principal | Sistema auxiliar | Tipo | Estado MLS-SND | Evidencia/entrada | Advertencia |
|---|---|---|---|---|---|---|
| Transversal | escritura propia de cada lengua | IPA | transcripción fonética/fonológica | `TRANSCRIPTION_LAYER` | SND-REP-002; SND-SRC-0001/0002 | IPA no es romanización ni reemplazo de la ortografía |
| 🇬🇹 es-GT | alfabeto latino | — | ortografía latina | `NO_ROMANIZATION_NEEDED` | SND-ESGT-010 / SND-REP-009 | la ortografía no equivale a IPA |
| 🇺🇸 en-US | alfabeto latino | — | ortografía latina | `NO_ROMANIZATION_NEEDED` | SND-REP-009 | pronunciación y escritura se documentan por separado |
| 🇧🇷 pt-BR-rio | alfabeto latino | — | ortografía latina | `NO_ROMANIZATION_NEEDED` | perfil PTBR / SND-REP-009 | referencia carioca no altera la escritura principal |
| 🇮🇹 it | alfabeto latino | — | ortografía latina | `NO_ROMANIZATION_NEEDED` | SND-IT-008 | las convenciones ortoépicas no se llaman romanización |
| 🇫🇷 fr | alfabeto latino | — | ortografía latina | `NO_ROMANIZATION_NEEDED` | SND-REP-009 | grafía y realización permanecen capas distintas |
| 🇩🇪 de | alfabeto latino | — | ortografía latina | `NO_ROMANIZATION_NEEDED` | SND-DE-007 / SND-REP-009 | Duden/IPA es referencia de pronunciación, no romanización |
| 🇹🇼 zh-TW | caracteres chinos | Zhuyin/Bopomofo | sistema local de símbolos fonéticos | `LOCAL_SYSTEM_EVIDENCE_CHECKED` | SND-ZHTW-007; SND-SRC-0011 | **no** es “IPA taiwanés” ni romanización latina |
| 🇹🇼 zh-TW | caracteres chinos | romanización latina | romanización | `PENDING_RESEARCH` | SND-ZHTW-009 | ningún sistema latino queda canónico todavía |
| 🇰🇷 ko | hangul | Romanización Revisada | romanización | `CANONICAL_AUXILIARY_EVIDENCE_CHECKED` | SND-KO-009; SND-SRC-0012 | se basa en pronunciación estándar, pero no es transcripción fonética completa |
| 🇯🇵 ja | kana/kanji | romanización latina | romanización | `PENDING_RESEARCH` | SND-JA-010 | MLS-SND no ha fijado todavía un sistema canónico |
| 🇷🇺 ru | cirílico | transliteración latina | transliteración | `PENDING_RESEARCH` | SND-RU-009 / Transcription Guide §9.4 | cualquier sistema futuro deberá identificarse por nombre |

## Cómo leer los estados

### `TRANSCRIPTION_LAYER`

Capa descriptiva fonética/fonológica. En MLS-SND corresponde al IPA cuando sea pertinente.

### `NO_ROMANIZATION_NEEDED`

La escritura ordinaria del perfil ya usa alfabeto latino. Esto no significa que la ortografía represente de manera transparente todos los detalles de pronunciación.

### `LOCAL_SYSTEM_EVIDENCE_CHECKED`

Sistema local documentado que puede aparecer junto a la escritura principal y el IPA, pero no pertenece necesariamente a la categoría romanización/transliteración.

### `CANONICAL_AUXILIARY_EVIDENCE_CHECKED`

Sistema auxiliar aprobado para el perfil y respaldado por evidencia; no sustituye escritura original ni IPA.

### `PENDING_RESEARCH`

El proyecto reconoce que puede ser útil una capa auxiliar, pero **no ha seleccionado aún un sistema canónico**.

## Orden de capas recomendado

Cuando sean pertinentes:

1. escritura original;
2. lectura ortográfica auxiliar/local, si existe;
3. romanización o transliteración **identificada por nombre**, si está aprobada;
4. representación fonológica `/…/`, si está justificada;
5. representación fonética `[…]`, si está justificada;
6. glosa/traducción, cuando ayude a identificar el ejemplo.

No todas las entradas necesitan todas las capas.

## Decisiones explícitamente abiertas

### zh-TW

Pendiente seleccionar —o decidir no seleccionar— una romanización latina canónica para el tomo. Zhuyin ya tiene un papel propio y no cubre esta decisión.

### ja

Pendiente seleccionar el sistema de romanización latina. Hasta que el perfil correspondiente cierre la decisión, el índice no elegirá Hepburn ni otra convención por defecto.

### ru

Pendiente decidir si el tomo necesita una transliteración latina canónica y con qué propósito. El cirílico permanece como escritura principal.

## Reglas de seguridad

- Nunca mostrar una forma latina sin nombrar el sistema cuando haya ambigüedad posible.
- Nunca inferir una pronunciación IPA directamente desde una romanización sin evidencia.
- Nunca degradar la escritura original a una capa secundaria solo para facilitar tipografía latina.
- Nunca llamar `transliteración` a una traducción.
- Nunca asumir reversibilidad salvo que el sistema concreto la documente.
- Nunca convertir `PENDING_RESEARCH` en una elección editorial silenciosa durante composición.

## Relacionado con

- `SND-REP-002` — Qué es el AFI/IPA
- `SND-REP-009` — Ortografía y pronunciación
- `SND-REP-010` — Romanización
- `SND-REP-011` — Transliteración
- `SND-REP-012` — Sistemas locales de anotación
- `SND-ZHTW-007` — Zhuyin/Bopomofo
- `SND-ZHTW-009` — Romanización latina
- `SND-KO-009` — Romanización Revisada
- `SND-KO-010` — Romanización vs. IPA
- `SND-JA-010` — Romanización
- `SND-RU-009` — Cirílico y pronunciación

## Regla de mantenimiento

Actualizar esta tabla únicamente cuando:

1. un perfil apruebe o retire un sistema;
2. cambie la función editorial de una capa;
3. una fuente institucional cambie la norma documentada;
4. una decisión `PENDING_RESEARCH` se cierre con evidencia y registro editorial.