# SND-FND-007 — Vocales: parámetros articulatorios

**Estado:** READY_FOR_COMPOSITION.
**Dominio:** fonética.
**Idioma:** transversal.
**Variedad:** no aplica.

## 1. Qué describe esta entrada

MLS-SND describirá las vocales mediante parámetros fonéticos explícitos y no mediante equivalencias automáticas con letras.

Entre los parámetros comunes para describir calidad vocálica se encuentran:

- altura;
- anterioridad/posterioridad;
- redondeamiento de los labios.

Otros rasgos —por ejemplo duración, nasalidad o calidad dinámica— se añadirán cuando la lengua y la evidencia los hagan pertinentes.

## 2. Altura

La **altura vocálica** se relaciona con la posición vertical de la lengua durante la articulación.

Las categorías exactas utilizadas en una entrada deberán corresponder al nivel de detalle del análisis adoptado. Las etiquetas de altura y anterioridad/posterioridad son regiones descriptivas útiles dentro de un espacio articulatorio continuo; no deben imaginarse como coordenadas anatómicas rígidas e idénticas entre hablantes.

## 3. Anterioridad y posterioridad

La posición horizontal de la lengua contribuye a la calidad vocálica.

MLS-SND podrá usar términos como **anterior, central y posterior**, pero explicará que estos son términos técnicos relativos al espacio vocálico.

## 4. Redondeamiento

La configuración de los labios también puede formar parte de la descripción de una vocal.

Cuando el contraste relevante sea redondeada/no redondeada, el tomo lo indicará explícitamente en vez de presuponerlo a partir de la ortografía.

## 5. Calidad estable y cambio interno

No todas las vocales mantienen una calidad estable durante toda su duración. Cuando una fuente analice una realización como monoptongo, diptongo u otra secuencia dinámica, MLS-SND conservará ese análisis y no lo deducirá desde la grafía.

## 6. Qué no hará MLS-SND

No dirá que una vocal de otro idioma “es la misma que la letra X en español” sin evidencia.

No fijará un único sistema vocálico transversal para los diez idiomas.

No usará el diagrama IPA como sustituto de una descripción por variedad.

## 7. Evidencia R33

| claim_id | afirmación | source_id | localizador exacto | alcance | estado |
|---|---|---|---|---|---|
| FND007-C01 | La calidad vocálica puede categorizarse mediante configuración de lengua y labios | SND-SRC-0024 | §3.5 “Describing vowels”, “Vowel quality” | introductorio/transversal | VERIFIED |
| FND007-C02 | La altura corresponde a la posición vertical de la lengua | SND-SRC-0024 | §3.5, “Height” | introductorio/transversal | VERIFIED |
| FND007-C03 | La anterioridad/posterioridad corresponde a la posición horizontal de la lengua | SND-SRC-0024 | §3.5, “Backness” | introductorio/transversal | VERIFIED |
| FND007-C04 | El redondeamiento labial contribuye a la calidad vocálica | SND-SRC-0024 | §3.5, “Rounding” | introductorio/transversal | VERIFIED |
| FND007-C05 | Algunas vocales mantienen calidad relativamente estable y otras cambian durante su articulación | SND-SRC-0024 | §3.5, “Multiple vowel qualities in sequence” | introductorio/transversal | VERIFIED |

## 8. Relacionado con

- SND-FND-006 — Consonantes
- SND-FND-010 — Duración y cantidad
- SND-REP-004 — Cómo leer vocales del IPA

## 9. Fuente

Anderson, C., Bjorkman, B. M., Denis, D., Doner, J., Grant, M., Sanders, N., & Taniguchi, A. (2022). *Essentials of Linguistics* (2nd ed.). eCampusOntario Pressbooks.

## 10. Auditoría R33

- **Fecha:** 2026-10-11.
- **Resultado:** EVIDENCE_CHECKED.
- **Límite:** cualquier inventario, valor fonémico, distribución o comparación concreta requerirá fuentes específicas del idioma/variedad.


## 11. Revisión lingüística

- **Fecha:** 2026-10-11.
- **Resultado:** PASS WITH CONSOLIDATION → `LINGUISTIC_REVIEW`.
- **Decisión:** esta ruta queda como versión canónica de SND-FND-007.
- **Integración:** se incorporó de la versión paralela la cautela de no interpretar altura/anterioridad como posiciones discretas absolutas.
- **Salvaguarda:** el espacio vocálico común es una herramienta descriptiva; no sustituye los inventarios ni realizaciones de cada variedad.


## Revisión editorial

- **Fecha:** 2026-10-11.
- **Resultado:** PASS → `EDITORIAL_REVIEW`.
- **Lectura:** Los parámetros se explican por separado y la sección “Qué no hará MLS-SND” funciona como control editorial claro contra equivalencias fáciles.
- **Control:** no se modificaron claims R33, transcripciones ni alcance lingüístico durante este gate.
- **Siguiente paso:** la entrada puede considerarse candidata a `READY_FOR_COMPOSITION` únicamente cuando la política de composición/metadatos aplicable esté integrada y una comprobación final confirme que no hubo cambios sustantivos posteriores.


## Composition readiness wave 02

- **Fecha:** 2026-10-11.
- **Versión evaluada:** blob `04ec13cef85a0748cf35c426ac573f5846afc226`.
- **Resultado:** PASS → `READY_FOR_COMPOSITION`.
- **Precondiciones:** EVIDENCE_CHECKED + LINGUISTIC_REVIEW + EDITORIAL_REVIEW vigentes.
- **Representación:** No contiene transcripciones IPA concretas; los parámetros vocálicos se presentan conceptualmente.
- **Ejemplos:** No contiene ejemplos lingüísticos materiales.
- **Navegación:** IDs relacionados verificados.
- **Autonomía escrita:** PASS; no requiere audio, ejercicios ni evaluación del lector.
- **Blockers:** ninguno.
- **Cambio en este gate:** solo estado/metadata de readiness.
