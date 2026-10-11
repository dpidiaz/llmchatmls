# SND-FND-015 — Entonación

**Estado:** READY_FOR_COMPOSITION.
**Dominio:** prosodia.
**Idioma:** transversal.

## 1. Qué entendemos por entonación

MLS-SND utilizará **entonación** para describir patrones melódicos que se organizan en dominios mayores que el segmento individual y que pueden relacionarse con estructura lingüística, discurso o pragmática según la lengua.

La definición concreta deberá especializarse en cada perfil.

## 2. Por qué no equivale a tono léxico

La variación de altura aparece tanto en lenguas con tono léxico como en lenguas sin él.

La diferencia editorial importante es el **dominio y la función** de la variación descrita.

Por eso MLS-SND mantendrá secciones distintas para:

- tono;
- acento tonal;
- entonación.

## 3. Evitar fórmulas universales

No se publicarán reglas como “las preguntas suben” como principio universal.

Cualquier asociación entre contorno melódico y función deberá:

- estar delimitada por lengua/variedad;
- especificar el tipo de construcción o contexto;
- contar con evidencia adecuada.

## 4. Escritura y puntuación

La puntuación puede ayudar a identificar una construcción escrita, pero no constituye por sí misma una transcripción de su entonación.

Cuando una entrada necesite mostrar un contorno, deberá usar la convención prosódica elegida para ese perfil y explicar cómo leerla.

## 5. Evidencia R33

| claim_id | afirmación | source_id | localizador exacto | alcance | estado |
|---|---|---|---|---|---|
| FND015-C01 | La entonación implica patrones de pitch con funciones lingüísticas más allá del contraste tonal de palabra | SND-SRC-0024 | §3.12 “Tone and Intonation” | introductorio/transversal | VERIFIED |
| FND015-C02 | Tono e intonación pueden coexistir y deben analizarse por sus funciones | SND-SRC-0024 | §3.12 “Tone and Intonation” | introductorio/transversal | VERIFIED |

## 6. Relacionado con

- SND-FND-013 — Tono
- SND-FND-014 — Acento tonal
- SND-REF-003 — Índice por fenómeno (entonación)

## 7. Fuente

Anderson, C., Bjorkman, B. M., Denis, D., Doner, J., Grant, M., Sanders, N., & Taniguchi, A. (2022). *Essentials of Linguistics* (2nd ed.). eCampusOntario Pressbooks.

## 8. Nota editorial

La entrada establece una barrera contra generalizaciones pedagógicas fáciles pero no universales. Los perfiles necesitarán bibliografía prosódica específica antes de formular reglas concretas.

## R33 audit

- **Fecha:** 2026-10-11.
- **Resultado:** EVIDENCE_CHECKED para los claims listados.
- **Alcance:** comprobación claim ↔ fuente ↔ sección; corresponde al gate evidencial anterior; los gates lingüístico y editorial se registran por separado.

## 9. Revisión lingüística

- **Fecha:** 2026-10-11.
- **Resultado:** PASS → `LINGUISTIC_REVIEW`.
- **Comprobación:** la entrada evita equiparar entonación con tono léxico y no universaliza contornos interrogativos ni funciones discursivas.
- **Límite:** el dominio prosódico y la relación forma–función de cada contorno deben definirse por idioma/variedad y fuente.


## Revisión editorial

- **Fecha:** 2026-10-11.
- **Resultado:** PASS → `EDITORIAL_REVIEW`.
- **Lectura:** la estructura definición → contraste con tono → control anti-universalización → escritura ofrece una ruta de lectura clara para autodidactas.
- **Control:** no se modificaron claims R33, transcripciones ni alcance lingüístico durante este gate.
- **Siguiente paso:** candidato a `READY_FOR_COMPOSITION` solo después de comprobar política final de composición/metadatos y ausencia de cambios sustantivos posteriores.


## Revisión editorial de navegación wave 01

- **Fecha:** 2026-10-11.
- **Motivo:** blocker detectado por composition readiness #7462.
- **Cambio:** la pseudo-referencia genérica `perfiles prosódicos por idioma` se sustituyó por el ID canónico reservado `SND-REF-003 — Índice por fenómeno`.
- **Resultado:** PASS; la navegación vuelve a ser resoluble por ID.
- **Impacto lingüístico/evidencial:** ninguno; no se modificaron claims, fuentes, localizadores, análisis ni alcance.
- **Estado resultante:** `EDITORIAL_REVIEW`; requiere reejecutar composition readiness sobre este nuevo blob.


## Composition readiness rerun wave 02

- **Fecha:** 2026-10-11.
- **Versión evaluada:** blob `22d37886ac4ba2fbba23d6c4cfb105cb4c1fddf2`.
- **Resultado:** PASS → `READY_FOR_COMPOSITION`.
- **Precondiciones:** EVIDENCE_CHECKED + LINGUISTIC_REVIEW + EDITORIAL_REVIEW vigentes.
- **Navegación:** PASS; FND-013 y FND-014 existen y SND-REF-003 está reservado canónicamente.
- **Representación:** cualquier convención tonal futura se delega correctamente a perfiles específicos; esta entrada no contiene una notación concreta sin identificar.
- **Autonomía escrita:** PASS; no requiere audio, ejercicios ni evaluación del lector.
- **Blocker anterior:** resuelto en #7464; no persiste la pseudo-referencia genérica.
- **Cambio en este gate:** únicamente estado/metadata de readiness.
