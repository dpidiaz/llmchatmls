# SND-PTBR-007 — Róticas y variación en la fala carioca

**Estado:** LINGUISTIC_REVIEW — PASS_WITH_SCOPE_WARNING.  
**Idioma:** portugués brasileño.  
**Variedad:** Río de Janeiro; foco inicial en coda.  
**Dominio:** fonética / fonología / variación.

## 1. Alcance de esta entrada

Esta primera versión no intenta describir todos los róticos del portugués carioca.

Se concentra en dos hechos bien documentados:

1. la fuerte variabilidad de las realizaciones de R en coda;
2. la importancia de separar coda final de otros contextos.

## 2. Coda final en las muestras NURC

Callou, Moraes y Leite (1998) analizan el debilitamiento y apagamiento del R final en habla culta carioca con tres conjuntos NURC recogidos en las décadas de 1970 y 1990.

El estudio informa que la posición final de palabra es un entorno especialmente favorable al apagamiento.

## 3. Morfología y otros condicionamientos

El artículo muestra que verbos y no verbos deben analizarse por separado: el apagamiento fue más frecuente en verbos y la clase morfológica fue el primer grupo de factores seleccionado en las muestras analizadas.

También fueron relevantes variables sociales y estructurales, incluidas edad, género y contexto prosódico/fonético.

## 4. No convertir datos históricos en regla actual

La conclusión del estudio de 1998 caracteriza el patrón global como variación estable/gradación etaria en esa comunidad y período, no como una trayectoria simple hacia pérdida total.

Además, un estudio UFRJ de 2026 investiga específicamente coda (r) interna y externa en hablantes periféricos de la muestra FavRio, lo cual confirma que el perfil contemporáneo debe incorporar poblaciones que no son equivalentes al NURC universitario histórico.

El resumen de 2026 no se usa aquí para afirmar resultados que todavía no se han extraído del texto completo.

## 5. Regla editorial

Toda forma carioca de R debe indicar el contexto:

- onset;
- intervocálico;
- coda interna;
- coda externa/final;
- verbo/no verbo cuando sea material.

No se enseñará una sola realización como “la R carioca”.

**Guard de representación:** en esta entrada, **R** funciona como rótulo de la variable/rótica tratada por las fuentes y por la organización editorial. No se interpreta por sí solo como símbolo IPA, archifonema universal ni análisis fonémico definitivo. Cualquier transcripción /…/ o […] futura deberá proceder de una fuente y versión específicamente auditadas.

## 6. Evidencia R33

| claim_id | afirmación | source_id | localizador | alcance | estado |
|---|---|---|---|---|---|
| PTBR007-C01 | El estudio de 1998 analiza tres muestras NURC de los 70/90 sobre R final carioca | SND-SRC-0082 | introducción y metodología, pp. 61–72 | RIO_SUBSCOPE: NURC | VERIFIED |
| PTBR007-C02 | La posición final de palabra favorece especialmente el apagamiento frente a posición interna | SND-SRC-0082 | sección 1, discusión de posición interna/externa | RIO_SUBSCOPE: NURC | VERIFIED |
| PTBR007-C03 | La clase morfológica separa fuertemente verbos y no verbos en el análisis | SND-SRC-0082 | sección 3, análisis de factores | RIO_SUBSCOPE: NURC | VERIFIED |
| PTBR007-C04 | El estudio concluye que el cuadro global es compatible con gradación etaria/variación estable, no con pérdida total simple | SND-SRC-0082 | abstract y sección 6 | RIO_SUBSCOPE: NURC histórico | VERIFIED |
| PTBR007-C05 | Silva (2026) estudia coda (r) interna/externa no verbal en hablantes periféricos/FavRio | SND-SRC-0083 | resumen institucional | RIO_SUBSCOPE: FavRio | VERIFIED |

## 7. Fuentes

Callou, D., Moraes, J., & Leite, Y. (1998). Apagamento do R final no dialeto carioca: um estudo em tempo aparente e em tempo real. *DELTA, 14*(n. esp.), 61–72. https://doi.org/10.1590/S0102-44501998000300006

Silva, K. L. A. da. (2026). *Um estudo sobre a variação da coda (r) com falantes periféricos da comunidade de fala do Rio de Janeiro* [Dissertação de mestrado, Universidade Federal do Rio de Janeiro]. Pantheon/UFRJ. http://hdl.handle.net/11422/29818

## 8. Open questions

- extraer resultados del texto completo de Silva (2026);
- construir subentrada de realizaciones fonéticas concretas por contexto;
- incorporar estudios recientes de R en onset e intervocálico;
- separar patrones de Rio de patrones PB_BROAD.


## 9. Clean reapply wave 01

- **Fecha:** 2026-10-13.
- **Origen:** PR #7277 / blob histórico `0d960005e29ab336bf4138647913ffb172742af8`.
- **Resultado:** integrado como `EVIDENCE_CHECKED` sin promoción adicional.
- **Canonicalización:** `PTBR-W01-SRC-03 → SND-SRC-0082`; `PTBR-W01-SRC-04 → SND-SRC-0083`.
- **Alcance preservado:** NURC histórico para Callou–Moraes–Leite (1998); FavRio/periferias del municipio para Silva (2026).
- **Guard:** el resumen institucional de Silva se usa para diseño/alcance; no se importan resultados finos no auditados del texto completo.
- **Cambios materiales:** ninguno; no se añadieron IPA, realizaciones, porcentajes ni generalizaciones nuevas.


## 10. Revisión lingüística wave 01

- **Fecha:** 2026-10-13.
- **Versión revisada:** blob `6998fa6c5fc73a48330db749769ee03b317b5433`.
- **Resultado:** PASS_WITH_SCOPE_WARNING → `LINGUISTIC_REVIEW`.
- **Variedad:** NURC histórico y FavRio permanecen subalcances distintos dentro de Río de Janeiro; ninguno se presenta como frecuencia o inventario de toda la ciudad contemporánea.
- **Temporalidad:** los conjuntos de 1970/1990 siguen marcados como históricos.
- **Representación:** `R` se trata como rótulo de variable/rótica; no se crea un símbolo IPA, archifonema ni análisis fonémico nuevo.
- **Silva (2026):** el registro/abstract sigue respaldando solo diseño y alcance en esta versión; no se incorporan resultados finos.
- **Cobertura:** onset, intervocálico y realizaciones fonéticas concretas continúan como preguntas abiertas; esa incompletitud no se oculta.
- **Cambios evidenciales:** ninguno.
- **Siguiente gate:** EDITORIAL_REVIEW sobre esta versión concreta.
