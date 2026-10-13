# SND-ESGT-002 — Inventario segmental: mapa de evidencia

**Estado:** EDITORIAL_REVIEW — PASS_WITH_SCOPE_WARNING como mapa de cobertura; inventario fonémico final pendiente.
**Idioma:** español de Guatemala.
**Dominio:** segmentos / alcance de evidencia / variación.
**Objetivo:** indicar qué fenómenos cuentan con evidencia suficiente y cuáles siguen abiertos antes de redactar un inventario.

## 1. Regla

Este archivo **no publica un inventario fonémico canónico**.

Las fuentes disponibles mezclan:

- panorama nacional institucional;
- atlas fonético/geolingüístico;
- estudios sociofonéticos;
- evidencia de contacto;
- investigación histórica.

Por eso MLS-SND separa siempre:

1. categoría fonológica;
2. realización fonética;
3. variedad/localidad;
4. contexto;
5. población;
6. tipo de fuente.

**Guard lingüístico:** los estados de las filas (`SOURCE_MAPPED`, `EVIDENCE_MAPPED`, `EVIDENCE_CHECKED_CLUSTER`, etc.) describen el grado y alcance de la **cobertura evidencial**. No equivalen a estatus fonémico, frecuencia nacional, obligatoriedad de una realización ni cierre del inventario. Del mismo modo, “base nacional” identifica el alcance de una fuente y no convierte automáticamente cada fenómeno que registra en rasgo uniforme de todo el país.

## 2. Mapa de cobertura

| Fenómeno | Base nacional | Evidencia especializada | Estado del mapa |
|---|---|---|---|
| Vocales | SND-SRC-0025 | SND-SRC-0053, contacto español–k’ichee’ | EVIDENCE_MAPPED_WITH_CONTACT_SCOPE |
| /b d g/ y relajación | SND-SRC-0003 + SND-SRC-0025 | falta estudio acústico contemporáneo específico | SOURCE_MAPPED |
| /f/ | SND-SRC-0025 | SND-SRC-0054, población bilingüe K’iche’–español | EVIDENCE_MAPPED_WITH_CONTACT_SCOPE |
| /s/ | SND-SRC-0003 + SND-SRC-0025 | SND-ESGT-005 ya desarrollado | EVIDENCE_CHECKED_CLUSTER |
| /x/ | SND-SRC-0003 + SND-SRC-0025 | falta actualización fonética específica | SOURCE_MAPPED |
| /n/ final | SND-SRC-0003 + SND-SRC-0025 | falta estudio contemporáneo específico | SOURCE_MAPPED |
| róticas / asibilación | SND-SRC-0003 + SND-SRC-0025 | waves específicas activas | ACTIVE_RESEARCH |
| yeísmo / palatales | SND-SRC-0003 + SND-SRC-0025 | falta fuente especializada suficiente | SOURCE_MAPPED |
| /ʃ/ en léxico guatemalteco | SND-SRC-0003 | reforzar con historia/contacto y distribución | SOURCE_MAPPED |
| grupos /tl/ y otros | SND-SRC-0003 + SND-SRC-0025 | falta delimitación contemporánea | SOURCE_MAPPED |
| aspiración de /p t k/ | — | SND-SRC-0057 | EVIDENCE_MAPPED / FULLTEXT_REQUIRED_FOR_SPECIFIC_CLAIMS |

## 3. Evidencia de contacto: regla de alcance

SND-SRC-0053 y SND-SRC-0054 son útiles precisamente porque muestran que algunos fenómenos requieren distinguir poblaciones.

No se usarán para afirmar:

> “Así son las vocales / la /f/ del español de Guatemala en general”.

Su función en este mapa es registrar que existe evidencia acústica o sociofonética **en muestras de contacto concretas**.

## 4. Aspiración de oclusivas sordas

SND-SRC-0057 confirma, al nivel permitido por su abstract y metadatos públicos, que existe investigación sociofonética específica sobre aspiración/VOT de /p t k/ en español guatemalteco monolingüe y bilingüe español–kaqchikel.

Mientras el texto completo no haya sido comprobado para cada claim:

- no se publicarán valores numéricos;
- no se cerrarán efectos estadísticos;
- no se atribuirá causalidad de contacto;
- no se generalizará el patrón a todo el país.

## 5. /s/ como primer cluster desarrollado

El cluster /s/ es el primer fenómeno segmental con:

- panorama nacional institucional (SND-SRC-0003);
- atlas/estudio nacional (SND-SRC-0025);
- entrada específica ya desarrollada (SND-ESGT-005).

Por eso se marca como **EVIDENCE_CHECKED_CLUSTER**, sin implicar que su distribución esté agotada.

## 6. Prosodia queda fuera de este mapa

SND-SRC-0058 aporta evidencia de prosodia/entonación con un diseño acotado.

No se incluye como fila del inventario segmental porque pertenece a otro dominio. Su existencia se conserva para las entradas prosódicas correspondientes, con sus límites por muestra, género y tipos de enunciado.

## 7. Evidencia R33 del mapa

| claim_id | afirmación | fuente | localizador | estado |
|---|---|---|---|---|
| ESGT002-C01 | ASALE ofrece un panorama nacional de fonética/fonología y declara que no es exhaustivo | SND-SRC-0003 | sección “Fonética y fonología”, p. 209 | VERIFIED |
| ESGT002-C02 | Utgård ofrece cobertura segmental geolingüística nacional con 22 localidades y 88 informantes en la investigación asociada | SND-SRC-0025 | cap. pp. 49–82; metodología registrada en Source Registry | VERIFIED |
| ESGT002-C03 | Existe evidencia acústica de espacios vocálicos en muestras español–k’ichee’ que no debe generalizarse a todo el país | SND-SRC-0053 | abstract del capítulo | VERIFIED_WITH_CONTACT_SCOPE |
| ESGT002-C04 | Existe evidencia específica sobre /f/ en población bilingüe K’iche’–español, con alcance de contacto explícito | SND-SRC-0054 | Abstract; §1; §6 | VERIFIED_WITH_CONTACT_SCOPE |
| ESGT002-C05 | SND-SRC-0057 documenta investigación sobre aspiración/VOT de oclusivas sordas, pero claims finos requieren texto completo | SND-SRC-0057 | Abstract + estructura del artículo | VERIFIED_ABSTRACT_SCOPE |
| ESGT002-C06 | El cluster /s/ cuenta con dos fuentes nacionales y una entrada específica ya desarrollada | SND-SRC-0003 + SND-SRC-0025 | ASALE p. 209; Utgård pp. 49–82 | VERIFIED |
| ESGT002-C07 | SND-SRC-0058 pertenece a prosodia/entonación y no debe funcionar como evidencia segmental | SND-SRC-0058 | cobertura y limitación del Source Registry | VERIFIED_SCOPE_ONLY |

## 8. Riesgos analíticos

- una realización cartografiada no prueba por sí sola un fonema;
- un préstamo o secuencia gráfica no determina análisis fonológico;
- una muestra bilingüe no representa automáticamente a hablantes monolingües;
- una fuente normativa no reemplaza datos fonéticos;
- una fuente antigua o impresionista no se presenta como medición acústica contemporánea;
- “evidencia disponible” no equivale a “inventario cerrado”.

## 9. Entradas relacionadas

- **SND-ESGT-001** — Alcance y variedades del español de Guatemala.
- **SND-ESGT-003** — Vocales.
- **SND-ESGT-004** — Consonantes.
- **SND-ESGT-005** — /s/ y variación regional.
- **SND-ESGT-009** — Contacto lingüístico.
- **SND-FND-017** — Variación.

## 10. Gate

**R33: EVIDENCE_CHECKED como mapa de cobertura.**

Este gate valida la trazabilidad y el alcance del mapa; **no valida un inventario fonémico final**.

La **LINGUISTIC_REVIEW de esta versión del mapa queda cerrada con `PASS_WITH_SCOPE_WARNING`**. Este resultado valida la arquitectura lingüística del mapa —separación entre categoría fonológica, realización, variedad, muestra y fuente—, no un inventario fonémico final.

Siguientes pasos:
1. completar estudios específicos de los clusters aún SOURCE_MAPPED;
2. resolver róticas mediante sus waves activas;
3. mantener FULLTEXT_REQUIRED para claims finos de SND-SRC-0057;
4. someter cualquier inventario final futuro a un nuevo gate sobre su versión concreta.

## 11. Revisión lingüística

**Versión revisada:** blob previo `0b526339e7fba945039ac34cdd9ff34cafddf25a`.

**Veredicto:** `PASS_WITH_SCOPE_WARNING`.

La versión vigente es lingüísticamente coherente **como mapa de cobertura** porque:

- no transforma realizaciones cartografiadas en fonemas;
- distingue fuentes nacionales, geolingüísticas, sociofonéticas, de contacto e históricas;
- mantiene las muestras K’iche’–español y español–kaqchikel fuera de cualquier generalización automática a todo Guatemala;
- conserva `FULLTEXT_REQUIRED` para claims finos de SND-SRC-0057;
- trata SND-SRC-0058 como evidencia prosódica fuera del mapa segmental;
- conserva clusters insuficientemente documentados como `SOURCE_MAPPED` o `ACTIVE_RESEARCH` en vez de cerrar el inventario por analogía.

**Advertencias que sobreviven al gate:** el inventario fonémico nacional sigue abierto; varios clusters requieren investigación especializada; la cobertura nacional de una fuente no autoriza uniformidad nacional del fenómeno; cualquier inventario futuro será una nueva versión y deberá reabrir los gates afectados.

## 12. Revisión editorial

- **Fecha:** 2026-10-13.
- **Versión revisada:** blob `42181e98a6c5bd9bbd1897ba84b3c7c994cb51aa`.
- **Resultado:** PASS_WITH_SCOPE_WARNING → `EDITORIAL_REVIEW`.
- **Identidad editorial:** la entrada permanece explícitamente definida como **mapa de cobertura segmental**, no inventario fonémico canónico del español de Guatemala.
- **Alcance:** se conservan separadas la base nacional, las muestras de contacto, la evidencia sociofonética y los clusters todavía `SOURCE_MAPPED` / `ACTIVE_RESEARCH`.
- **Evidencia limitada:** `FULLTEXT_REQUIRED` para claims finos de SND-SRC-0057 sigue visible y no se sustituye por inferencia.
- **Reader safety:** estados de cobertura evidencial no se presentan como frecuencia, obligatoriedad ni estatus fonémico.
- **Siguiente gate:** composition readiness de esta versión-map; un inventario fonémico final será una versión distinta y reabrirá gates.
