# SND-ESGT-002 — Inventario segmental: mapa de evidencia

**Estado:** EVIDENCE_CHECKED como mapa de cobertura; inventario fonémico final pendiente.
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

Siguientes pasos:
1. completar estudios específicos de los clusters aún SOURCE_MAPPED;
2. resolver róticas mediante sus waves activas;
3. mantener FULLTEXT_REQUIRED para claims finos de SND-SRC-0057;
4. someter cualquier inventario final a LINGUISTIC_REVIEW independiente.
