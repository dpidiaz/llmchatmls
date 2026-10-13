# Composition Handoff Manifest — SND-REF-002

## Identidad
- **entry_id:** SND-REF-002
- **title:** Índice IPA de MLS-SND
- **content_version / commit:** blob `bbab709531d29c9b421405c42e8e022583bd0dd5`
- **handoff_date:** 2026-10-13
- **reviewer / wave:** ref002-composition-readiness-wave-01

## Gates
- **EVIDENCE_CHECKED:** PASS; base evidencial previa a la revisión lingüística
- **LINGUISTIC_REVIEW:** PASS_WITH_SCOPE_WARNING — PR #7567
- **EDITORIAL_REVIEW:** PASS_WITH_SCOPE_WARNING — PR #7568
- **COMPOSITION_READINESS:** PASS

## Proyección reader-facing
- **secciones/bloques incluidos en edición de lectura:** §§1–6, §8, §10 y §12.
- **bloques internos excluidos de edición de lectura:** §7, §9, §11 y §§13–16.
- **Fuentes y fundamento visible al lector:** sí; derivado de §12 y de la procedencia de las filas incluidas, sin exponer infraestructura R33 innecesaria.
- **nota editorial visible al lector:** sí; el índice es vivo, parcial por diseño y no equivale a la tabla IPA completa ni a un inventario fonémico.
- **secciones ambiguas:** ninguna tras esta clasificación.
- **regla de proyección:** COMPOSITION no añade formas, reclasifica símbolos ni decide análisis lingüísticos.

### Pronunciation Quick Layer (R32)
- **status:** NOT_APPLICABLE
- **reader_locale:** no aplica
- **source_form:** no aplica
- **meaning_or_gloss:** no aplica
- **easy_pronunciation:** no aplica
- **ipa_source / representación aprobada de origen:** no aplica como respelling; las formas IPA visibles proceden del índice aprobado
- **scope_note:** aparato de consulta de representación, no forma léxica objetivo
- **deep_link / sección de detalle:** SND-REP-002, SND-REP-003, SND-REP-005, SND-REP-006, SND-REP-007, SND-REP-008
- **derivation_note:** no crear pronunciación fácil para símbolos o secuencias IPA aislados

## Alcance
- **idioma:** transversal
- **variedad:** no aplica como variedad única; cada ocurrencia conserva el alcance de su entrada fuente
- **tipo de alcance:** aparato de consulta vivo
- **fecha/muestra material:** conservar la de cada entrada/fuente citada cuando sea material

## Representación presente
- [ ] ortografía
- [ ] escritura original no latina
- [ ] romanización
- [ ] transliteración
- [x] /transcripción fonológica/
- [x] [transcripción fonética]
- [x] diacríticos IPA
- [x] tono/acento/duración
- [x] tablas
- [x] otro: notación SOURCE_SPECIFIC documentada

## Evidencia
- **source_ids utilizados:** SND-SRC-0001 directamente; procedencia adicional mediante las entradas canónicas citadas
- **claims materiales:** no hay tabla propia de claim IDs en REF-002; el gate EVIDENCE_CHECKED de la versión base cubre las inclusiones y la fuente normativa
- **conflictos documentados:** formas SOURCE_SPECIFIC no se promueven a IPA por apariencia tipográfica
- **metadata bibliográfica incompleta:** no para el alcance reader-facing aprobado

## Ejemplos
- **SOURCE_EXAMPLE:** no aplica como categoría de ejemplo; las filas son registros del índice
- **CORPUS_EXAMPLE:** no aplica como bloque independiente
- **EDITORIAL_EXAMPLE:** ninguno
- **procedencia comprobada:** sí para las ocurrencias integradas mediante entradas canónicas

## Navegación
- **entradas relacionadas:** SND-REP-002/003/005/006/007/008; SND-RU-007; SND-ZHTW-003; SND-ZHTW-007; SND-PTBR-006
- **IDs pendientes/reservados:** ninguno necesario para esta versión
- **redirects necesarios:** ninguno

## Open questions

### Bloqueantes
- ninguno

### No bloqueantes
- expansión futura del índice;
- nuevas emisiones oficiales del IPA;
- reclasificación futura de SOURCE_SPECIFIC si nueva evidencia aprobada lo exige.

## Requisitos de composición
- **comenzar en página nueva:** sí
- **caracteres IPA/Unicode especiales:** preservar, entre otros, `ɛ ɔ ø œ ɨ ʌ ʂ ɕ ŋ ʰ ʲ ◌̃ ◌̆ ˈ ˌ ː ˑ ◌‿◌`
- **tablas complejas:** sí; no simplificar categorías para obtener simetría visual
- **notas tipográficas:** distinguir / / y [ ]; no separar diacríticos combinantes de su base; Unicode real copiable
- **otros:** sin dependencia de audio; no convertir Zhuyin/romanización en IPA

## Resultado
**PASS → READY_FOR_COMPOSITION.**

## Firma editorial del gate
Este manifiesto certifica únicamente la versión indicada del índice vivo. No certifica futuras expansiones ni autoriza a COMPOSITION a añadir, reclasificar o reinterpretar formas.
