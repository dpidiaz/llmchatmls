# Composition Handoff Manifest — SND-ESGT-002

## Identidad
- **entry_id:** SND-ESGT-002
- **title:** Inventario segmental: mapa de evidencia
- **content_version / commit:** blob `a12da08274eaa68f6a56c99eb2ecc07872f296c3`
- **handoff_date:** 2026-10-13
- **reviewer / wave:** esgt002-composition-readiness-wave-01

## Gates
- **EVIDENCE_CHECKED:** PASS como mapa de cobertura — §10
- **LINGUISTIC_REVIEW:** PASS_WITH_SCOPE_WARNING — blob previo `0b526339e7fba945039ac34cdd9ff34cafddf25a`
- **EDITORIAL_REVIEW:** PASS_WITH_SCOPE_WARNING — blob `42181e98a6c5bd9bbd1897ba84b3c7c994cb51aa`
- **COMPOSITION_READINESS:** PASS como mapa de cobertura

## Proyección reader-facing
- **incluido:** encabezado/objetivo; §§1, 3–6, 8–9.
- **excluido:** §2 raw coverage-status table; §7 R33 claim table; §§10–12 gate/review metadata.
- **Fuentes y fundamento:** derivado de §7 y de las fuentes mencionadas en §§3–6; conservar alcance de muestras y limitaciones.
- **nota editorial visible:** sí: la edición debe explicar que el contenido es un mapa de cobertura y no un inventario fonémico final.
- **secciones ambiguas:** ninguna tras la proyección.
- **regla:** COMPOSITION no traduce estados internos como `SOURCE_MAPPED` o `ACTIVE_RESEARCH` a categorías lingüísticas ni completa clusters por inferencia.

### Pronunciation Quick Layer (R32)
- **status:** NOT_APPLICABLE
- **reader_locale:** no aplica
- **source_form:** no aplica
- **meaning_or_gloss:** no aplica
- **easy_pronunciation:** no aplica
- **ipa_source / representación aprobada de origen:** no aplica como capa derivada
- **scope_note:** mapa de cobertura evidencial por fenómeno; no contiene una forma léxica objetivo
- **deep_link / sección de detalle:** SND-ESGT-003, 004, 005 y futuras entradas específicas
- **derivation_note:** no crear respelling a partir de grafías o categorías listadas.

## Alcance
- **idioma:** español
- **variedad:** español de Guatemala; muestras específicas se mantienen delimitadas
- **tipo de alcance:** mapa segmental de cobertura de evidencia
- **fecha/muestra material:** conservar los datos de cada fuente; las muestras de contacto no representan automáticamente el país completo

## Representación presente
- [x] /transcripción fonológica/ en nombres de fenómenos
- [x] símbolos IPA aislados
- [ ] [transcripción fonética] como tabla reader-facing
- [ ] romanización
- [ ] transliteración
- [x] tabla interna de cobertura
- [x] tabla interna R33

## Evidencia
- **source_ids utilizados:** SND-SRC-0003, 0025, 0053, 0054, 0057, 0058
- **claims materiales:** ESGT002-C01…C07
- **conflictos documentados:** insuficiencia de evidencia específica para varios clusters; diferencias de alcance entre fuentes nacionales, contacto y sociofonética
- **metadata bibliográfica incompleta:** no para los claims admitidos
- **restricción:** SND-SRC-0057 conserva `FULLTEXT_REQUIRED_FOR_SPECIFIC_CLAIMS`

## Ejemplos
- **SOURCE_EXAMPLE:** ninguno como ejemplo léxico reader-facing
- **CORPUS_EXAMPLE:** ninguno
- **EDITORIAL_EXAMPLE:** ninguno
- **procedencia comprobada:** no aplica

## Navegación
- **entradas relacionadas:** SND-ESGT-001, SND-ESGT-003, SND-ESGT-004, SND-ESGT-005, SND-ESGT-009, SND-FND-017
- **IDs pendientes/reservados:** clusters futuros y eventual inventario fonémico final
- **redirects necesarios:** ninguno

## Open questions

### Bloqueantes
- ninguno para la composición del **mapa de cobertura**.

### No bloqueantes
- cierre de /b d g/, /x/, /n/ final, yeísmo/palatales, /ʃ/, grupos /tl/ y otros;
- róticas/asibilación mientras continúe su investigación;
- claims finos de aspiración /p t k/ sujetos a texto completo de SND-SRC-0057;
- inventario fonémico nacional definitivo.

Estas cuestiones pasan a ser bloqueantes si se intenta convertir esta versión en inventario final.

## Requisitos de composición
- **comenzar en página nueva:** sí
- **caracteres IPA/Unicode especiales:** preservar /b d g/, /f/, /s/, /x/, /n/, /ʃ/, /tl/, /p t k/ y cualquier diacrítico aprobado
- **tablas complejas:** no publicar §2 raw como tabla reader-facing en esta versión; §7 permanece interna
- **notas tipográficas:** mantener símbolos fonológicos separados de ortografía y de realizaciones
- **otros:** ninguna dependencia de audio

## Resultado
**PASS → READY_FOR_COMPOSITION como mapa de cobertura segmental.**

## Firma editorial del gate
Este manifiesto certifica solo la versión-map indicada. No certifica un inventario fonémico final ni autoriza a composición a cerrar evidencia pendiente.
