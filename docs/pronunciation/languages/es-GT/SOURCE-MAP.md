# 🇬🇹 Español de Guatemala — Source map

Estado: **PARTIALLY_CANONICALIZED**.

Este archivo conserva el historial de fuentes propuestas para el perfil es-GT. Las fuentes P01, P03 y P04 ya fueron resueltas a IDs globales; P02 permanece como candidato local hasta una wave posterior.

## Fuente ya canónica

### SND-SRC-0003 — Herrera & Montenegro / ASALE

**Referencia:** Herrera, G., & Montenegro, R. (2021). “Una aproximación al español en Guatemala en los albores del siglo XXI”. En *Crónica de la lengua española 2021*. Asociación de Academias de la Lengua Española / Real Academia Española.

**Cobertura útil:** panorama nacional, fonética/fonología, contacto, variación regional y generacional.

**Localizadores verificados:**
- capítulo: pp. 206–216 de la obra;
- “Fonética y fonología”: pp. 209–211 impresas (PDF pp. 230–232);
- bibliografía del capítulo: pp. 216–217 impresas.

**Fortaleza:** fuente institucional guatemalteca/panhispánica con alcance nacional explícito.

**Límite declarado por la propia fuente:** el informe no pretende una descripción fonético-fonológica exhaustiva.

---

## Propuesta de alta al registro global

### ESGT-SRC-P01 → SND-SRC-0025 — Utgård, estudio geolingüístico nacional

**Fuente:** Katrine Utgård, “La pronunciación del español guatemalteco: Atlas lingüístico-etnográfico de Guatemala. Nivel fonético segmental. Análisis geolingüístico pluridimensional”.

**Acceso consultado:** copia de autor disponible públicamente en ResearchGate.

**Cobertura:** estudio geolingüístico segmental nacional; 22 localidades; 88 informantes; mapas de vocales y consonantes.

**Localizadores útiles:**
- introducción/metodología: red de 22 localidades y criterios de selección;
- sección de /s/: mapas 19–31; páginas internas visibles 17–24;
- conclusiones: páginas internas visibles 38–41;
- referencias: páginas internas 44–46.

**Datos metodológicos verificados:**
- incluye Ciudad de Guatemala y otras 21 localidades;
- la mayoría de informantes son monolingües criados en su localidad;
- Livingston contiene excepciones bilingües/multilingües;
- el análisis se describe como fonética articulatoria de carácter impresionista.

**Limitación:** el diseño prioriza población monolingüe y centros urbanos/políticos/comerciales; no puede usarse como descripción integral del español en contacto con lenguas mayas.

**Problema bibliográfico abierto:** distintas referencias externas muestran fechas editoriales diferentes para esta versión/artículo. Antes de asignar un ID global debe resolverse el año y la referencia exacta de publicación. La obra relacionada y estable de Utgård es:

Utgård, K. (2010). El español de Guatemala. En M. Á. Quesada Pacheco (Ed.), *El español hablado en América Central: Nivel fonético* (pp. 49–82). Iberoamericana/Vervuert. https://doi.org/10.31819/9783865278708-003

**Resultado de integración:** DEDUP_MATCH → **SND-SRC-0025** (Utgård 2010). El ID local no debe volver a citarse en entradas canónicas.

---

### ESGT-SRC-P02 — McKinnon 2025

McKinnon, S. (2025). La variación fonológica del español guatemalteco. En M. Díaz-Campos & J. M. Hernández-Campoy (Eds.), *Enciclopedia concisa de los dialectos del español en el mundo*. https://doi.org/10.1002/9781394349135.ch31

**Cobertura:** revisión reciente de lo documentado empíricamente sobre variación fonético-fonológica; énfasis en estudios recientes de contacto con kaqchikel y k’iche’.

**Acceso:** resumen y metadatos verificables; texto completo no comprobado en esta wave.

**Uso permitido ahora:** mapa de investigación y constatación del gap documental declarado por el propio resumen.

**No usar todavía para:** claims fonéticos específicos sin acceso al pasaje correspondiente.

**Estado propuesto:** SOURCE_MAPPED / FULLTEXT_REQUIRED_FOR_SPECIFIC_CLAIMS.

**Resultado wave 06:** sin canonicalizar. P02 no es necesario para resolver ESGT-002 y permanece candidato local para una wave posterior.

---

### ESGT-SRC-P03 → SND-SRC-0057 — McKinnon 2020

McKinnon, S. (2020). Un análisis sociofonético de la aspiración de las oclusivas sordas en el español guatemalteco monolingüe y bilingüe (español-kaqchikel). *Spanish in Context, 17*(1), 1–29. https://doi.org/10.1075/sic.00051.mck

**Cobertura:** aspiración/VOT de /p t k/ en comunidades monolingües y bilingües español-kaqchikel.

**Acceso:** resumen y metadatos verificables; texto completo no abierto en la fuente editorial consultada.

**Resultado de integración:** CANONICAL_NEW → **SND-SRC-0057**. Se mantiene FULLTEXT_REQUIRED_FOR_SPECIFIC_CLAIMS: la canonicalización no amplía el acceso ni el alcance del resumen editorial.

---

### ESGT-SRC-P04 → SND-SRC-0058 — Congosto Martín 2020

Congosto Martín, Y. (2020). El español guatemalteco en contacto: prosodia y entonación. *Estudios de Fonética Experimental, 29*, 153–194.

**Acceso:** copia institucional de la Universidad de Sevilla.

**Cobertura:** prosodia/entonación; comparación entre hablantes guatemaltecos en Guatemala y Los Ángeles; metodología vinculada a AMPER.

**Límite:** estudio circunscrito a entonación femenina y tipos concretos de enunciados del corpus; no generalizar a toda la prosodia guatemalteca.

**Resultado de integración:** CANONICAL_NEW → **SND-SRC-0058**, con ADMITTED_WITH_SCOPE_WARNING. La limitación por género, corpus y tipos de enunciado se conserva.

## Gaps prioritarios

1. Resolver la referencia bibliográfica exacta de la versión nacional de Utgård usada para mapas.
2. Conseguir una fuente contemporánea abierta o accesible sobre habla urbana de Ciudad de Guatemala si se desea convertirla en subreferencia.
3. Completar fuentes de róticas/asibilación con el estudio de Acevedo-Halvick.
4. Investigar vocalismo contemporáneo con datos acústicos, no solo impresionistas.
5. Ampliar prosodia más allá del diseño AMPER femenino/declarativas/interrogativas de las fuentes actuales.
6. Mantener separado español monolingüe, español como L2 y español en contacto con lenguas mayas.


## Reconciliación wave 06

| ID local | Resultado | ID canónico |
|---|---|---|
| ESGT-SRC-P01 | DEDUP_MATCH | SND-SRC-0025 |
| ESGT-SRC-P03 | CANONICAL_NEW | SND-SRC-0057 |
| ESGT-SRC-P04 | CANONICAL_NEW | SND-SRC-0058 |

**Pendiente:** ESGT-SRC-P02 (McKinnon 2025) sigue siendo candidato local y no se cita desde ESGT-002.
