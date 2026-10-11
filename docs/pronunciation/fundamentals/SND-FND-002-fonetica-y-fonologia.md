# SND-FND-002 — Fonética y fonología

**Estado:** EDITORIAL_REVIEW.
**Dominio:** fundamentos.
**Idioma:** transversal.
**Variedad:** no aplica.

## 1. Dos niveles que necesitamos distinguir

MLS-SND utilizará **fonética** para hablar de las propiedades y realizaciones de los sonidos del habla: cómo se producen, qué propiedades presentan y cómo pueden describirse.

Utilizará **fonología** para hablar de cómo una lengua o variedad organiza contrastes y patrones sonoros.

La distinción es necesaria porque una descripción física de un sonido y el papel que ese sonido cumple dentro de un sistema lingüístico no son la misma pregunta.

## 2. Cómo se conectan

Fonética y fonología no se presentan como áreas aisladas. Una entrada puede necesitar ambas capas.

Por ejemplo, un perfil puede:

1. identificar un contraste relevante para una lengua;
2. describir fonéticamente sus realizaciones;
3. indicar en qué contextos aparecen;
4. registrar variación sin asumir que cada diferencia fonética crea una categoría fonológica distinta.

## 3. Regla editorial

Cuando una afirmación describa una realización concreta deberá marcarse como fonética.

Cuando una afirmación describa una unidad, contraste o patrón analítico deberá marcarse como fonológica.

Si una fuente y otra adoptan análisis fonológicos distintos, MLS-SND registrará esa diferencia en vez de ocultarla detrás de una sola transcripción.

## 4. Relacionado con

- SND-FND-003 — Fonema, alófono, segmento y realización
- SND-REP-007 — Transcripción fonológica y fonética
- SND-FND-017 — Variación

## 5. Evidencia R33

| claim_id | afirmación | source_id | localizador exacto | alcance | estado |
|---|---|---|---|---|---|
| FND002-C01 | La fonética trata la realidad física del habla, incluida su articulación, categorización y descripción | SND-SRC-0024 | cap. 3 “Phonetics”, especialmente introducción del capítulo | introductorio/transversal | VERIFIED |
| FND002-C02 | La fonología estudia la organización y patrones sonoros dentro de las lenguas | SND-SRC-0024 | cap. 4 “Phonology”, especialmente §4.1 “Phonemes and allophones” | introductorio/transversal | VERIFIED |
| FND002-C03 | El análisis lingüístico requiere distinguir propiedades fonéticas de patrones fonológicos | SND-SRC-0024 | cap. 3 + cap. 4, §4.1 | introductorio/transversal | VERIFIED |

## 6. Fuente

Anderson, C., Bjorkman, B. M., Denis, D., Doner, J., Grant, M., Sanders, N., & Taniguchi, A. (2022). *Essentials of Linguistics* (2nd ed.). eCampusOntario Pressbooks.

## 7. Nota editorial

Las formulaciones de “fonética” y “fonología” están adaptadas a la voz editorial del MLS. La fuente respalda la distinción conceptual; no se atribuye a ella la arquitectura específica del tomo.

## R33 audit

- **Fecha:** 2026-10-11.
- **Resultado:** EVIDENCE_CHECKED para los claims listados.
- **Alcance:** comprobación claim ↔ fuente ↔ sección; corresponde al gate evidencial anterior; los gates lingüístico y editorial se registran por separado.

## 8. Revisión lingüística

- **Fecha:** 2026-10-11.
- **Resultado:** PASS → `LINGUISTIC_REVIEW`.
- **Comprobación:** la entrada mantiene separados el nivel fonético y el fonológico y evita deducir categorías fonológicas a partir de diferencias fonéticas por sí solas.
- **Límite:** los perfiles pueden adoptar análisis fonológicos diferentes; MLS-SND debe atribuirlos a sus fuentes.


## Revisión editorial

- **Fecha:** 2026-10-11.
- **Resultado:** PASS → `EDITORIAL_REVIEW`.
- **Lectura:** La distinción central se entiende sin formación previa; la secuencia definición → conexión → regla editorial es compacta y útil para consulta.
- **Control:** no se modificaron claims R33, transcripciones ni alcance lingüístico durante este gate.
- **Siguiente paso:** la entrada puede considerarse candidata a `READY_FOR_COMPOSITION` únicamente cuando la política de composición/metadatos aplicable esté integrada y una comprobación final confirme que no hubo cambios sustantivos posteriores.
