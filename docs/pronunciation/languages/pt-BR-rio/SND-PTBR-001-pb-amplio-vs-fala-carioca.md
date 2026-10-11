# SND-PTBR-001 — Portugués brasileño amplio vs. fala carioca

**Estado:** EVIDENCE_CHECKED.  
**Idioma:** portugués brasileño.  
**Variedad:** Río de Janeiro con subalcances explícitos.  
**Dominio:** alcance / variación.

## 1. Por qué esta distinción es obligatoria

MLS-SND no utilizará “portugués brasileño” y “carioca” como etiquetas intercambiables.

Una afirmación puede pertenecer a:

- **PB_BROAD** — alcance brasileño amplio respaldado por fuentes adecuadas;
- **RIO_CARIOCA** — municipio/comunidad de habla de Río de Janeiro;
- **RIO_SUBSCOPE** — subconjunto concreto de la ciudad o de una muestra;
- **FLUMINENSE** — otras comunidades del estado de Río de Janeiro.

## 2. La fala carioca no es homogénea

Callou describe el falar carioca como heterogéneo y, en los datos que resume, muestra condicionamiento por variables como edad, género, escolaridad y área de residencia.

Eso obliga a que MLS-SND etiquete la muestra antes de convertir un patrón en descripción de referencia.

## 3. Diferentes corpus describen diferentes Ríos

Gran parte del perfil clásico de Callou utiliza datos NURC de habla urbana con escolaridad universitaria, además de comparaciones entre décadas.

Un estudio de 2022 analiza específicamente seis hablantes de Copacabana mayores de 56 años para /S/ postvocálico.

Un trabajo de 2026 se concentra, en cambio, en hablantes periféricos/favelas del municipio para la variación de coda (r).

Los tres son datos “cariocas”, pero no son la misma población.

## 4. Decisión MLS

La referencia editorial seguirá siendo **RIO_CARIOCA**, pero ninguna entrada podrá omitir el subalcance cuando éste cambie la interpretación.

No se convertirá:

- NURC/culta → en “todo Río”;
- Copacabana >56 → en “todo Río”;
- FavRio → en “todo Río”;
- fala fluminense → en “fala carioca”.

## 5. Evidencia R33

| claim_id | afirmación | source_id | localizador | alcance | estado |
|---|---|---|---|---|---|
| PTBR001-C01 | Callou presenta la fala carioca como heterogénea y no como pronunciación única | SND-SRC-0007 | p. 131, introducción | RIO_CARIOCA | VERIFIED |
| PTBR001-C02 | El capítulo usa datos de 30 entrevistas NURC de cinco ciudades para /r/, /s/ y /l/ y compara variables sociales/geográficas | SND-SRC-0007 | pp. 133–143 y nota metodológica en p. 133 | RIO_SUBSCOPE: NURC | VERIFIED |
| PTBR001-C03 | Nanini (2022) delimita su análisis a seis residentes de Copacabana mayores de 56 años | SND-SRC-0081 | resumen del registro UFRJ | RIO_SUBSCOPE: Copacabana >56 | VERIFIED |
| PTBR001-C04 | Silva (2026) delimita su estudio a hablantes periféricos/favelas de Río y a coda (r) interna/externa no verbal | SND-SRC-0083 | resumen del registro UFRJ | RIO_SUBSCOPE: FavRio | VERIFIED |

## 6. Fuentes

Callou, D. (2009). *Um perfil da fala carioca*. En *Dos sons às palavras: nas trilas da Língua Portuguesa* (pp. 129–152). EDUFBA.

Nanini, R. F. (2022). *O /S/ pós-vocálico na fala carioca: uma análise dos falantes mais velhos de Copacabana*. UFRJ.

Silva, K. L. A. da. (2026). *Um estudo sobre a variação da coda (r) com falantes periféricos da comunidade de fala do Rio de Janeiro*. UFRJ.

## 7. Nota editorial

**EVIDENCE_CHECKED** aquí significa que los claims de alcance fueron comprobados. No equivale todavía a LINGUISTIC_REVIEW del perfil completo.
