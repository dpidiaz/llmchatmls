# MLS-SND Master Inventory

Estado: **inventario operativo v0.2**. Este archivo enumera unidades editoriales candidatas; no convierte sus títulos en afirmaciones lingüísticas validadas.

## 1. Convención de IDs

- FND = fundamentos comunes
- REP = representación y transcripción
- ESGT = español de Guatemala
- ENUS = inglés estadounidense
- PTBR = portugués brasileño / carioca
- IT = italiano
- FR = francés
- DE = alemán
- ZHTW = mandarín de Taiwán
- KO = coreano
- JA = japonés
- RU = ruso
- CMP = comparación transversal
- REF = aparato de consulta

## 2. Fundamentos comunes

| ID | Entrada candidata | Dependencias | Estado |
|---|---|---|---|
| SND-FND-001 | El sonido como parte del idioma | — | EVIDENCE_CHECKED |
| SND-FND-002 | Fonética y fonología | terminología v0.2 | LINGUISTIC_REVIEW |
| SND-FND-003 | Fonema, alófono, segmento y realización | FND-002 | LINGUISTIC_REVIEW |
| SND-FND-004 | Producción del habla y tracto vocal | fuentes generales | LINGUISTIC_REVIEW |
| SND-FND-005 | Percepción del habla | fuentes generales | EVIDENCE_CHECKED |
| SND-FND-006 | Consonantes: parámetros articulatorios | IPA | LINGUISTIC_REVIEW |
| SND-FND-007 | Vocales: parámetros articulatorios/acústicos | IPA | LINGUISTIC_REVIEW |
| SND-FND-008 | Sílaba | terminología | LINGUISTIC_REVIEW |
| SND-FND-009 | Fonotáctica | FND-008 | LINGUISTIC_REVIEW |
| SND-FND-010 | Duración y cantidad | terminología | EVIDENCE_CHECKED |
| SND-FND-011 | Acento y prominencia | terminología | LINGUISTIC_REVIEW |
| SND-FND-012 | Ritmo | terminología + fuentes | EVIDENCE_CHECKED |
| SND-FND-013 | Tono | terminología | LINGUISTIC_REVIEW |
| SND-FND-014 | Acento tonal | FND-011, FND-013 | EVIDENCE_CHECKED |
| SND-FND-015 | Entonación | terminología | LINGUISTIC_REVIEW |
| SND-FND-016 | Habla conectada y procesos contextuales | FND-008/009 | EVIDENCE_CHECKED |
| SND-FND-017 | Variación: región, sociedad, estilo y tiempo | varieties-policy | EVIDENCE_CHECKED |
| SND-FND-018 | Norma, descripción y uso | FND-017 | EVIDENCE_CHECKED |

## 3. Representación y escritura

| ID | Entrada candidata | Dependencias | Estado |
|---|---|---|---|
| SND-REP-001 | Sonido, letra y símbolo | terminology | EVIDENCE_CHECKED |
| SND-REP-002 | Qué es el AFI/IPA | SND-SRC-0001/0002 | LINGUISTIC_REVIEW |
| SND-REP-003 | Cómo leer consonantes del IPA | REP-002 | SOURCE_MAPPED |
| SND-REP-004 | Cómo leer vocales del IPA | REP-002 | SOURCE_MAPPED |
| SND-REP-005 | Diacríticos | REP-002 | LINGUISTIC_REVIEW |
| SND-REP-006 | Suprasegmentales y tonos en IPA | REP-002 | LINGUISTIC_REVIEW |
| SND-REP-007 | Transcripción fonológica y fonética | guide v0.2 | LINGUISTIC_REVIEW |
| SND-REP-008 | Transcripción amplia y estrecha | guide v0.2 | LINGUISTIC_REVIEW |
| SND-REP-009 | Ortografía y pronunciación | terminology | EVIDENCE_CHECKED |
| SND-REP-010 | Romanización | terminology | EVIDENCE_CHECKED |
| SND-REP-011 | Transliteración | terminology | EVIDENCE_CHECKED |
| SND-REP-012 | Sistemas locales de anotación | perfiles | EVIDENCE_CHECKED |

## 4. Perfiles lingüísticos

### 🇬🇹 Español de Guatemala — ESGT

| ID | Entrada/cluster | Estado |
|---|---|---|
| SND-ESGT-001 | Alcance y variedades del español de Guatemala | EVIDENCE_CHECKED |
| SND-ESGT-002 | Inventario segmental: mapa de evidencia | SOURCE_MAPPED |
| SND-ESGT-003 | Vocales y variación | INVENTORY |
| SND-ESGT-004 | Consonantes y realizaciones | INVENTORY |
| SND-ESGT-005 | /s/ y variación regional | EVIDENCE_CHECKED |
| SND-ESGT-006 | Róticas | INVENTORY |
| SND-ESGT-007 | Acento y prominencia | INVENTORY |
| SND-ESGT-008 | Entonación | INVENTORY |
| SND-ESGT-009 | Contacto lingüístico y alcance | INVENTORY |
| SND-ESGT-010 | Ortografía y pronunciación | INVENTORY |

### 🇺🇸 Inglés estadounidense — ENUS

| ID | Entrada/cluster | Estado |
|---|---|---|
| SND-ENUS-001 | Por qué no usamos “General American” como una sola voz | EVIDENCE_CHECKED |
| SND-ENUS-002 | Sistema consonántico: mapa de contrastes | SOURCE_MAPPED |
| SND-ENUS-003 | Sistemas vocálicos y variación regional | SOURCE_MAPPED |
| SND-ENUS-004 | Reducción vocálica | INVENTORY |
| SND-ENUS-005 | Acento léxico | INVENTORY |
| SND-ENUS-006 | Habla conectada | INVENTORY |
| SND-ENUS-007 | Ritmo y prominencia | INVENTORY |
| SND-ENUS-008 | Entonación | INVENTORY |
| SND-ENUS-009 | Southern Michigan como perfil documentado | EVIDENCE_CHECKED |
| SND-ENUS-010 | Comparaciones con español/portugués | BLOCKED_BY_PROFILES |

### 🇧🇷 Portugués brasileño — referencia carioca — PTBR

| ID | Entrada/cluster | Estado |
|---|---|---|
| SND-PTBR-001 | PB amplio vs. habla carioca | DRAFTED |
| SND-PTBR-002 | Inventario vocálico: mapa de evidencia | INVENTORY |
| SND-PTBR-003 | Nasalidad | INVENTORY |
| SND-PTBR-004 | Vocales pretónicas/postónicas | INVENTORY |
| SND-PTBR-005 | Consonantes: mapa general | INVENTORY |
| SND-PTBR-006 | /s/ en coda y variación carioca | EVIDENCE_CHECKED |
| SND-PTBR-007 | Róticas y variación | SOURCE_MAPPED |
| SND-PTBR-008 | /l/ en coda y variación | SOURCE_MAPPED |
| SND-PTBR-009 | Acento y ritmo | INVENTORY |
| SND-PTBR-010 | Entonación carioca | INVENTORY |

### 🇮🇹 Italiano — IT

| ID | Entrada/cluster | Estado |
|---|---|---|
| SND-IT-001 | Estándar, variedades regionales y mainstream | EVIDENCE_CHECKED |
| SND-IT-002 | Vocales | SOURCE_MAPPED |
| SND-IT-003 | Consonantes | SOURCE_MAPPED |
| SND-IT-004 | Geminación/duración consonántica | EVIDENCE_CHECKED |
| SND-IT-005 | Acento | INVENTORY |
| SND-IT-006 | E y O: pronunciación y ortoepía | SOURCE_MAPPED |
| SND-IT-007 | S y Z: pronunciación y ortoepía | SOURCE_MAPPED |
| SND-IT-008 | Grafía y pronunciación | EVIDENCE_CHECKED |
| SND-IT-009 | Variación regional | INVENTORY |

### 🇫🇷 Francés — FR

| ID | Entrada/cluster | Estado |
|---|---|---|
| SND-FR-001 | Selección de variedad de referencia | EVIDENCE_CHECKED |
| SND-FR-002 | Vocales y contrastes | EVIDENCE_CHECKED |
| SND-FR-003 | Vocales nasales | INVENTORY |
| SND-FR-004 | Schwa | INVENTORY |
| SND-FR-005 | Consonantes finales | INVENTORY |
| SND-FR-006 | Liaison | INVENTORY |
| SND-FR-007 | Enchaînement y habla conectada | INVENTORY |
| SND-FR-008 | Acento/prominencia y frase | INVENTORY |
| SND-FR-009 | Variación documentada en PFC | EVIDENCE_CHECKED |

### 🇩🇪 Alemán — DE

| ID | Entrada/cluster | Estado |
|---|---|---|
| SND-DE-001 | Alemán estándar y estándares nacionales | EVIDENCE_CHECKED |
| SND-DE-002 | Vocales | SOURCE_MAPPED |
| SND-DE-003 | Longitud y calidad vocálica | SOURCE_MAPPED |
| SND-DE-004 | Consonantes | SOURCE_MAPPED |
| SND-DE-005 | Acento | INVENTORY |
| SND-DE-006 | Procesos contextuales | INVENTORY |
| SND-DE-007 | Duden e IPA | EVIDENCE_CHECKED |
| SND-DE-008 | DE/AT/CH: mapa de diferencias | RESEARCHED |

### 🇹🇼 Mandarín de Taiwán — ZHTW

| ID | Entrada/cluster | Estado |
|---|---|---|
| SND-ZHTW-001 | Qué entendemos por Taiwan Mandarin | EVIDENCE_CHECKED |
| SND-ZHTW-002 | Estructura silábica | INVENTORY |
| SND-ZHTW-003 | Iniciales y finales: análisis fonético/fonológico | RESEARCHED_PARTIAL |
| SND-ZHTW-004 | Sistema tonal: mapa de evidencia | EVIDENCE_CHECKED |
| SND-ZHTW-005 | Variación tonal norte/centro | EVIDENCE_CHECKED |
| SND-ZHTW-006 | Procesos tonales | INVENTORY |
| SND-ZHTW-007 | Zhuyin/Bopomofo | EVIDENCE_CHECKED |
| SND-ZHTW-008 | IPA y Zhuyin: funciones distintas | EVIDENCE_CHECKED |
| SND-ZHTW-009 | Romanización latina | DRAFTED |
| SND-ZHTW-010 | Variación por contacto | EVIDENCE_CHECKED |

### 🇰🇷 Coreano — KO

| ID | Entrada/cluster | Estado |
|---|---|---|
| SND-KO-001 | Estándar y habla de Seúl | LINGUISTIC_REVIEW |
| SND-KO-002 | Sistema consonántico | SOURCE_MAPPED |
| SND-KO-003 | Oclusivas y cambios contemporáneos | LINGUISTIC_REVIEW |
| SND-KO-004 | Vocales | LINGUISTIC_REVIEW |
| SND-KO-005 | Estructura silábica | LINGUISTIC_REVIEW |
| SND-KO-006 | Procesos fonológicos contextuales | LINGUISTIC_REVIEW |
| SND-KO-007 | Prosodia | LINGUISTIC_REVIEW |
| SND-KO-008 | Hangul y pronunciación | LINGUISTIC_REVIEW |
| SND-KO-009 | Romanización Revisada | LINGUISTIC_REVIEW |
| SND-KO-010 | Romanización vs. IPA | LINGUISTIC_REVIEW |

### 🇯🇵 Japonés — JA

| ID | Entrada/cluster | Estado |
|---|---|---|
| SND-JA-001 | Referencia de Tokio/lengua común y sus límites | EVIDENCE_CHECKED |
| SND-JA-002 | Mora | INVENTORY |
| SND-JA-003 | Vocales y duración | SOURCE_MAPPED |
| SND-JA-004 | Consonantes | SOURCE_MAPPED |
| SND-JA-005 | Estructura moraica/silábica | INVENTORY |
| SND-JA-006 | Acento tonal de Tokio | SOURCE_MAPPED |
| SND-JA-007 | Variación y cambio acentual | SOURCE_MAPPED |
| SND-JA-008 | Kana y pronunciación | INVENTORY |
| SND-JA-009 | Kanji, lecturas y pronunciación | INVENTORY |
| SND-JA-010 | Romanización | REFERENCE_OPEN |

### 🇷🇺 Ruso — RU

| ID | Entrada/cluster | Estado |
|---|---|---|
| SND-RU-001 | Ruso literario contemporáneo: alcance | EVIDENCE_CHECKED |
| SND-RU-002 | Vocales | EVIDENCE_CHECKED |
| SND-RU-003 | Reducción vocálica | EVIDENCE_CHECKED |
| SND-RU-004 | Consonantes | EVIDENCE_CHECKED |
| SND-RU-005 | Palatalización | EVIDENCE_CHECKED |
| SND-RU-006 | Acento léxico | EVIDENCE_CHECKED |
| SND-RU-007 | Procesos contextuales | EVIDENCE_CHECKED |
| SND-RU-008 | Norma ortoépica y variantes | EVIDENCE_CHECKED |
| SND-RU-009 | Cirílico y pronunciación | INVENTORY |

## 5. Comparación transversal

Estos capítulos permanecen bloqueados hasta que los perfiles pertinentes superen al menos EVIDENCE_CHECKED.

| ID | Entrada candidata | Estado |
|---|---|---|
| SND-CMP-001 | Cómo comparar sonidos sin asumir identidad | EVIDENCE_CHECKED |
| SND-CMP-002 | Sistemas vocálicos en perspectiva | BLOCKED_BY_PROFILES |
| SND-CMP-003 | Sistemas consonánticos en perspectiva | BLOCKED_BY_PROFILES |
| SND-CMP-004 | Sílaba y fonotáctica | BLOCKED_BY_PROFILES |
| SND-CMP-005 | Duración y cantidad | BLOCKED_BY_PROFILES |
| SND-CMP-006 | Acento y prominencia | BLOCKED_BY_PROFILES |
| SND-CMP-007 | Tono y acento tonal | BLOCKED_BY_PROFILES |
| SND-CMP-008 | Ritmo | BLOCKED_BY_PROFILES |
| SND-CMP-009 | Entonación | BLOCKED_BY_PROFILES |
| SND-CMP-010 | Escritura y pronunciación | BLOCKED_BY_PROFILES |
| SND-CMP-011 | Qué significa “tener acento” | BLOCKED_BY_PROFILES |

## 6. Aparato de consulta

| ID | Salida | Estado |
|---|---|---|
| SND-REF-001 | Glosario canónico | IN_PROGRESS |
| SND-REF-002 | Índice IPA | IN_PROGRESS |
| SND-REF-003 | Índice por fenómeno | INVENTORY |
| SND-REF-004 | Índice por idioma | INVENTORY |
| SND-REF-005 | Tabla de romanizaciones/transliteraciones | INVENTORY |
| SND-REF-006 | Bibliografía general | IN_PROGRESS |
| SND-REF-007 | Bibliografías por perfil | IN_PROGRESS |
| SND-REF-008 | Grafo de referencias cruzadas | INVENTORY |

## 7. Conteo inicial

- Fundamentos: 18 entradas.
- Representación: 12 entradas.
- Perfiles lingüísticos: 94 entradas/clusters candidatos.
- Comparación: 11 entradas.
- Aparato de consulta: 8 salidas.

**Total inicial inventariado: 143 unidades editoriales candidatas.**

Este conteo no es una cuota ni un límite. Las unidades pueden dividirse o fusionarse después de investigación.

## 8. Primer gate de producción

Antes de redactar en masa:

1. terminar fuentes base de FND/REP;
2. cerrar terminología v0.2;
3. usar la plantilla canónica;
4. redactar 8–12 entradas de fundamentos;
5. someterlas a R33;
6. producir tres perfiles piloto;
7. congelar arquitectura solo después del piloto.
