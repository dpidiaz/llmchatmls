# SND-FND-014 — Acento tonal: una etiqueta que exige definición local

**Estado:** READY_FOR_COMPOSITION.  
**Dominio:** prosodia / tipología.  
**Idioma:** transversal.  
**Fuente tipológica principal:** SND-SRC-0048.

## 1. Por qué MLS-SND no dará una definición universal rígida

El término **acento tonal** / *pitch accent* aparece en la literatura para sistemas prosódicos que no encajan de manera sencilla en prototipos de tono o acento. Sin embargo, la categoría es analíticamente controvertida.

Hyman (2009) argumenta que los sistemas denominados *pitch-accent* no comparten un conjunto exclusivo de propiedades que permita reunirlos en un tercer tipo prosódico coherente. Su propuesta tipológica es describir propiedades de los subsistemas, en vez de clasificar lenguas solo mediante etiquetas. **Esta es la posición analítica del autor citado**, no una declaración de consenso universal ni una prohibición del término en otras tradiciones.

## 2. Política MLS-SND

Por esa razón, el tomo no enseñará:

> tono → acento tonal → acento

como si todos los sistemas prosódicos pudieran colocarse en una sola escala universal.

Cada perfil deberá indicar qué propiedades están realmente documentadas:

- si hay contraste léxico de pitch;
- qué unidad porta ese contraste;
- obligatoriedad o ausencia de una marca por palabra;
- posibilidad de más de una marca;
- relación con estructura métrica;
- distribución y procesos contextuales;
- convención analítica utilizada por las fuentes.

## 3. Japonés como perfil, no como definición universal

MLS-SND puede usar el japonés de Tokio como un perfil importante porque NINJAL mantiene recursos específicos de acento de Tokio y porque ese ancla ya está delimitada en SND-JA-001.

El propio Hyman (2009, §3, pp. 218–219) presenta análisis alternativos —acentual y tonal— del japonés de Tokio. Esa coexistencia de análisis obliga a identificar la convención adoptada en cada entrada. Las propiedades de Tokio no se utilizarán para definir automáticamente “acento tonal” en otras lenguas.

## 4. Relación con tono y acento

Esta entrada debe leerse junto con:

- SND-FND-011 — Acento y prominencia;
- SND-FND-013 — Tono;
- SND-FND-015 — Entonación.

La comparación se hará por propiedades y funciones, no solo por etiquetas terminológicas.

## 5. Evidencia R33

| claim_id | afirmación | source_id | localizador | alcance | estado |
|---|---|---|---|---|---|
| FND014-C01 | Hyman sostiene que los sistemas denominados pitch-accent no constituyen un prototipo prosódico único coherente | SND-SRC-0048 | resumen; §3, pp. 218–219; §4, pp. 230–234 | tipología prosódica, posición del autor | VERIFIED |
| FND014-C02 | Hyman recomienda caracterizar propiedades de subsistemas en lugar de clasificar lenguas únicamente mediante etiquetas | SND-SRC-0048 | §1, pp. 213–215; §4, pp. 230–234 | tipología fonológica, posición del autor | VERIFIED |
| FND014-C03 | NINJAL mantiene recursos específicos sobre acento de Tokio | SND-SRC-0013, SND-SRC-0014 | descripción de los recursos | japonés/Tokio | VERIFIED |
| FND014-C04 | Hyman expone análisis acentuales y tonales del japonés de Tokio como alternativas en la literatura | SND-SRC-0048 | §3, pp. 218–219, discusión del ejemplo (8) | japonés/Tokio; historia analítica, no descripción fonética independiente | VERIFIED |

## 6. Referencia bibliográfica

Hyman, L. M. (2009). How (not) to do phonological typology: the case of pitch-accent. *Language Sciences, 31*(2–3), 213–238. https://doi.org/10.1016/j.langsci.2008.12.007

## 7. Nota editorial

La norma editorial v0.2 conserva **acento tonal** como rótulo de trabajo para *pitch accent*, con definición local obligatoria por perfil. La entrada evita convertir una etiqueta discutida en una categoría universal; la taxonomía sigue abierta a refinamiento por perfiles.

## 8. Gate

**LINGUISTIC_REVIEW — PASS_WITH_SCOPE_WARNING (2026-10-11).** Se contrastó la interpretación tipológica con el artículo publicado de Hyman (2009), especialmente §§1, 3 y 4. La entrada conserva la atribución explícita de la postura a Hyman, evita universalizar una categoría discutida y no traslada datos de Tokio a otras variedades. La revisión editorial posterior conserva `acento tonal` como rótulo de trabajo de la norma v0.2 y mantiene abierta su definición por perfil; no implica `READY_FOR_COMPOSITION`.

## 9. Revisión editorial wave 02

- **Fecha:** 2026-10-12.
- **Resultado:** PASS_WITH_TERMINOLOGY_WARNING → `EDITORIAL_REVIEW`.
- **Terminología:** se conserva “acento tonal” / *pitch accent* como etiqueta de trabajo, nunca como tercer tipo prosódico universal.
- **Jerarquía:** la postura de Hyman permanece atribuida al autor y Tokio funciona como perfil ilustrativo, no como definición global.
- **Cambios lingüísticos/R33:** ninguno.
- **Siguiente gate:** composition readiness con la advertencia terminológica intacta.

## Composition readiness — 2026-10-13

- **Versión evaluada:** blob `b03ef843ac3ae78b34fefb4271950b089d122002`.
- **Resultado:** PASS → `READY_FOR_COMPOSITION`.
- **Proyección reader-facing:** §§1–7.
- **Metadata interna excluida de la edición de lectura:** §§8–9 (gates/revisión interna).
- **Fuentes y fundamento:** derivado de la evidencia R33 y la bibliografía ya aprobadas; los claim IDs/localizadores completos permanecen auditables en el repositorio.
- **Pronunciation Quick Layer:** `NOT_APPLICABLE` — entrada conceptual/transversal sin forma léxica cuya respelling aporte valor.
- **Autonomía escrita:** PASS; no requiere audio para comprender el contenido aprobado.
- **Open questions:** ninguna bloqueante para el núcleo actual. «Acento tonal» se conserva como rótulo de trabajo con definición local obligatoria; la postura de Hyman sigue atribuida al autor y no se universaliza.
- **Regla para COMPOSITION:** puede ajustar presentación visual, pero no wording lingüísticamente material, claims, alcance, fuentes/localizadores ni decisiones analíticas.
