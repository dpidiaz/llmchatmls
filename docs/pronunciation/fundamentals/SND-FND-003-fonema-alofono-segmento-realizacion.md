# SND-FND-003 — Fonema, alófono, segmento y realización

**Estado:** READY_FOR_COMPOSITION.
**Dominio:** fonología / fonética.
**Idioma:** transversal.

## 1. Por qué necesitamos cuatro términos

MLS-SND evitará llamar “sonido” a todo indistintamente cuando la precisión sea importante.

### Fonema

Unidad analítica fonológica utilizada para representar un contraste dentro del sistema descrito.

### Alófono

Realización relacionada con un fonema dentro de un análisis concreto.

### Segmento

Unidad descriptiva de una secuencia sonora que permite hablar de una posición o elemento sin comprometer necesariamente un análisis fonémico.

### Realización

Forma fonética concreta —o rango documentado de formas— que aparece en un contexto determinado.

## 2. Contraste y distribución

Para decidir si dos realizaciones deben analizarse como fonemas distintos o como variantes relacionadas no basta con observar que “suenan diferentes”.

El análisis fonológico considera, entre otras cosas, si la diferencia participa en contrastes y cómo se distribuyen las realizaciones.

## 3. Un análisis no es una etiqueta universal

Las fuentes pueden diferir sobre el análisis de determinadas unidades. Por eso MLS-SND no convertirá automáticamente una transcripción entre barras en una verdad independiente de la fuente.

Cuando exista una diferencia analítica material se registrará:

- el análisis adoptado;
- la fuente que lo sustenta;
- análisis alternativos relevantes;
- el efecto que la decisión tiene sobre la explicación.

## 4. Evidencia R33

| claim_id | afirmación | source_id | localizador exacto | alcance | estado |
|---|---|---|---|---|---|
| FND003-C01 | Un fonema se trata como una unidad abstracta y sus realizaciones físicas relacionadas como alófonos dentro del análisis | SND-SRC-0024 | §4.1 “Phonemes and allophones”, especialmente explicación de fonema/alófono | introductorio/transversal | VERIFIED |
| FND003-C02 | La distribución y los entornos de los phones se usan para determinar relaciones alofónicas en el análisis | SND-SRC-0024 | §4.1 “Phonemes and allophones”, apartados sobre environments y aim of phonology | introductorio/transversal | VERIFIED |
| FND003-C03 | Una lengua puede admitir más de un análisis fonémico y las decisiones dependen de datos y supuestos analíticos | SND-SRC-0024 | §4.5 “Phonemic analysis”, “Phonemecization” y “Simplicity” | introductorio/transversal | VERIFIED |

## 5. Relacionado con

- SND-FND-002 — Fonética y fonología
- SND-FND-017 — Variación
- SND-REP-007 — Transcripción fonológica y fonética

## 6. Fuente

Anderson, C., Bjorkman, B. M., Denis, D., Doner, J., Grant, M., Sanders, N., & Taniguchi, A. (2022). *Essentials of Linguistics* (2nd ed.). eCampusOntario Pressbooks.

## 7. Nota editorial

“Segmento” y “realización” se fijan aquí como términos editoriales útiles. Las entradas por idioma deberán precisar el análisis de sus propias fuentes.

## R33 audit

- **Fecha:** 2026-10-11.
- **Resultado:** EVIDENCE_CHECKED para los claims listados.
- **Alcance:** comprobación claim ↔ fuente ↔ sección; corresponde al gate evidencial anterior; los gates lingüístico y editorial se registran por separado.

## 8. Revisión lingüística

- **Fecha:** 2026-10-11.
- **Resultado:** PASS → `LINGUISTIC_REVIEW`.
- **Comprobación:** “fonema”, “alófono”, “segmento” y “realización” se presentan como niveles/objetos analíticos distintos y la entrada reconoce explícitamente que puede haber análisis alternativos.
- **Límite:** ningún perfil debe heredar automáticamente un análisis fonémico del capítulo general.


## Revisión editorial

- **Fecha:** 2026-10-11.
- **Resultado:** PASS → `EDITORIAL_REVIEW`.
- **Lectura:** Las cuatro etiquetas se presentan antes del análisis y la advertencia sobre análisis alternativos evita una falsa definición absoluta.
- **Control:** no se modificaron claims R33, transcripciones ni alcance lingüístico durante este gate.
- **Siguiente paso:** la entrada puede considerarse candidata a `READY_FOR_COMPOSITION` únicamente cuando la política de composición/metadatos aplicable esté integrada y una comprobación final confirme que no hubo cambios sustantivos posteriores.


## Composition readiness pilot 01

- **Fecha:** 2026-10-11.
- **Versión evaluada:** blob `1a09e3c750885e141ea84fe9f2f2b799812d1785`.
- **Resultado:** PASS → `READY_FOR_COMPOSITION`.
- **Precondiciones:** EVIDENCE_CHECKED + LINGUISTIC_REVIEW + EDITORIAL_REVIEW vigentes para esta versión.
- **Representación:** Usa terminología analítica, pero no muestra transcripciones fonéticas/fonológicas concretas que requieran auditoría de símbolos.
- **Navegación:** referencias cruzadas verificadas contra IDs canónicos existentes.
- **Autonomía escrita:** PASS; la entrada no requiere audio, ejercicios ni evaluación del lector.
- **Blockers:** ninguno.
- **Cambio en este gate:** únicamente estado/metadata de readiness; sin cambios lingüísticos, evidenciales ni de ejemplos.
