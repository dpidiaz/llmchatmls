# SND-FND-012 — Ritmo

**Estado:** READY_FOR_COMPOSITION.  
**Versión revisada:** 2026-10-12; base `cfbe8735e334ef0933c11beb8dd61a6483bcaa9c`.  
**Dominio:** prosodia.  
**Idioma:** transversal.

## 1. Qué entendemos por ritmo

MLS-SND utilizará **ritmo** como un término descriptivo para patrones de organización temporal y de prominencia en el habla.

No se convertirá automáticamente en una clasificación rígida de lenguas.

## 2. Acento y temporalidad

Las sílabas acentuadas pueden presentar mayor **sonoridad percibida** (*loudness*), duración y/o altura tonal (*pitch*). Estas propiedades contribuyen a la prominencia perceptiva; no constituyen por sí solas una medida universal del ritmo. La sonoridad percibida no debe confundirse automáticamente con una medición instrumental de intensidad acústica.

Sin embargo, la relación entre acento y temporización no es idéntica en todas las lenguas.

## 3. Cautela con “stress-timed” y “syllable-timed”

La clasificación tradicional que divide lenguas en:

- **stress-timed**;
- **syllable-timed**;

es frecuente en materiales pedagógicos.

La fuente introductoria utilizada por MLS-SND cuestiona el respaldo fonético de esa división como clasificación binaria y recomienda evitarla. Esta conclusión se atribuye al manual citado; no equivale a negar toda investigación cuantitativa sobre temporización, ni autoriza clasificar variedades particulares sin estudios específicos.

Por tanto, el tomo no afirmará simplemente:

> “el inglés es stress-timed y el español syllable-timed”

como explicación suficiente del ritmo.

## 4. Cómo se describirá el ritmo

Cada perfil podrá tratar, cuando exista evidencia:

- patrones de prominencia;
- duración;
- reducción;
- organización temporal;
- fraseo;
- interacción con habla conectada.

La descripción deberá apoyarse en estudios específicos de la variedad.

## 5. Evidencia R33

| claim_id | afirmación | source_id | localizador exacto | alcance | estado |
|---|---|---|---|---|---|
| FND012-C01 | Las sílabas acentuadas pueden mostrar mayor sonoridad percibida (*loudness*), duración y/o altura tonal (*pitch*) | SND-SRC-0024 | §3.11 “Stress”, apartado “The phonetics of stressed syllables”; https://ecampusontario.pressbooks.pub/essentialsoflinguistics2/chapter/3-11-stress/ | introductorio/transversal | VERIFIED |
| FND012-C02 | Las lenguas difieren en las propiedades fonéticas empleadas para realizar el acento | SND-SRC-0024 | §3.11 “Stress”, apartado “The phonetics of stressed syllables” | introductorio/transversal | VERIFIED |
| FND012-C03 | La dicotomía rígida stress-timed/syllable-timed carece de apoyo fonético suficiente como clasificación binaria | SND-SRC-0024 | §3.11 “Stress”, párrafo que comienza “Spoken languages are sometimes classified…”; referencia secundaria a Pamies Bertrán (1999) | introductorio/metodológico | VERIFIED |

## 6. Fuente

Anderson, C., Bjorkman, B. M., Denis, D., Doner, J., Grant, M., Sanders, N., & Taniguchi, A. (2022). *Essentials of Linguistics* (2nd ed.). eCampusOntario Pressbooks.

## 7. Nota editorial

La entrada no niega que existan diferencias rítmicas entre lenguas. Rechaza convertir una etiqueta binaria simple en explicación autosuficiente.

## 8. Nota de auditoría y límites de versión

Revisión lingüística/evidencial de esta versión: 2026-10-12. C01–C03 contrastados directamente con §3.11 de `SND-SRC-0024`; se conserva `VERIFIED` para el **alcance introductorio/metodológico** de cada claim, no para estudios de variedades concretas. La referencia a Pamies Bertrán (1999) se mantiene como cita secundaria mencionada por el manual: **no se declara consulta directa del artículo**. No hay transcripciones IPA ni ejemplos empíricos nuevos que requieran gate propio.

**Gate de revisión lingüística:** PASS para los tres claims delimitados y la formulación prudente de esta versión. La revisión editorial independiente de esta versión también quedó completada; esto no implica `READY_FOR_COMPOSITION`. Si se amplía el capítulo con métricas/variedades concretas, se requieren investigación especializada y nuevos claims/localizadores.

## 9. Revisión editorial wave 02

- **Fecha:** 2026-10-12.
- **Resultado:** PASS_WITH_TERMINOLOGY_WARNING → `EDITORIAL_REVIEW`.
- **Terminología:** “ritmo” permanece término descriptivo; la norma v0.2 mantiene las taxonomías rítmicas específicas abiertas a refinamiento por perfil.
- **Lectura:** la advertencia contra una dicotomía rígida stress-timed/syllable-timed aparece antes de cualquier aplicación por lengua.
- **Cambios lingüísticos/R33:** ninguno.
- **Siguiente gate:** composition readiness del núcleo actual.

## Composition readiness — 2026-10-13

- **Versión evaluada:** blob `cf98e2946f8fc903026996804b3d2f242617989a`.
- **Resultado:** PASS → `READY_FOR_COMPOSITION`.
- **Proyección reader-facing:** §§1–7.
- **Metadata interna excluida de la edición de lectura:** §§8–9 (auditoría/gates internos).
- **Fuentes y fundamento:** derivado de la evidencia R33 y la bibliografía ya aprobadas; los claim IDs/localizadores completos permanecen auditables en el repositorio.
- **Pronunciation Quick Layer:** `NOT_APPLICABLE` — entrada conceptual/transversal sin forma léxica cuya respelling aporte valor.
- **Autonomía escrita:** PASS; no requiere audio para comprender el contenido aprobado.
- **Open questions:** ninguna bloqueante para el núcleo actual. La cautela contra una dicotomía rígida stress-timed/syllable-timed permanece reader-facing; la advertencia terminológica es no bloqueante.
- **Regla para COMPOSITION:** puede ajustar presentación visual, pero no wording lingüísticamente material, claims, alcance, fuentes/localizadores ni decisiones analíticas.
