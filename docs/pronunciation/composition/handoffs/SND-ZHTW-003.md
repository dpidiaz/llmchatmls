# Composition Handoff Manifest — SND-ZHTW-003

## Identidad
- **entry_id:** SND-ZHTW-003
- **title:** Iniciales y finales: mapa fonético/fonológico
- **content_version / commit:** blob `a83a70fa8bba4dc747ca7b437cb537ce778a7e31`
- **handoff_date:** 2026-10-13
- **reviewer / wave:** zhtw003-composition-readiness-wave-01

## Gates
- **EVIDENCE_CHECKED:** PASS como mapa de evidencia — §10
- **LINGUISTIC_REVIEW:** PASS_WITH_SCOPE_WARNING — blob previo `18f9dda5284af0a0d264244a23ff9bfd43470083`
- **EDITORIAL_REVIEW:** PASS_WITH_SCOPE_WARNING — blob `143cd6cac5fe73b1033fc0aa4f257e3274718e6a`
- **COMPOSITION_READINESS:** PASS como mapa de evidencia

## Proyección reader-facing
- **incluido:** encabezado de alcance; §§1–5; §9 como base de fuentes.
- **excluido:** §6 (nota operacional de phone tables), §7 (tabla futura), §8 (tabla R33), §§10–12 (gate/reviews internas).
- **Fuentes y fundamento:** derivado de §9 y claims verificados de §8; mantener muestras, corpus y límites por fuente.
- **nota editorial visible:** el lector debe ver que esta versión es un mapa y no un inventario fonémico definitivo.
- **secciones ambiguas:** ninguna tras la proyección.
- **regla:** COMPOSITION no completa columnas, inventarios ni equivalencias por inferencia.

### Pronunciation Quick Layer (R32)
- **status:** NOT_APPLICABLE
- **reader_locale:** no aplica
- **source_form:** no aplica
- **meaning_or_gloss:** no aplica
- **easy_pronunciation:** no aplica
- **ipa_source:** las realizaciones IPA del texto provienen de la versión aprobada; no son base para respelling.
- **scope_note:** mapa de categorías/evidencia, no forma léxica objetivo.
- **deep_link:** SND-REP-002, SND-REP-003, SND-REP-007, SND-REP-008
- **derivation_note:** no crear pronunciación fácil para símbolos/categorías aisladas.

## Alcance
- **idioma:** mandarín
- **variedad:** Taiwan Mandarin dentro de un marco comparativo de Mandarin
- **tipo de alcance:** mapa segmental de evidencia; no inventario fonémico final
- **fecha/muestra material:** conservar la de cada estudio citado (Taipei, corpus 2024, estudios norte/sur, etc.)

## Representación presente
- [x] /transcripción fonológica/
- [x] [transcripción fonética]
- [x] diacríticos IPA
- [x] referencias a Zhuyin
- [x] referencias a Hanyu Pinyin
- [x] tablas internas R33
- [ ] tabla reader-facing de inventario definitivo

## Evidencia
- **source_ids utilizados:** SND-SRC-0044, 0045, 0046, 0092, 0093, 0094, 0095, 0096
- **claims materiales:** ZHTW003-C01…C10
- **conflictos documentados:** propuesta de cinco vocales permanece ANALYTICAL_CHOICE; inventario integral abierto
- **metadata bibliográfica incompleta:** no para los claims admitidos; SND-SRC-0044 queda HOLD para cualquier claim cuantitativo sin localizador interno fino

## Ejemplos
- **SOURCE_EXAMPLE:** pares aspirado/no aspirado y realizaciones de sibilantes documentadas por las fuentes citadas
- **CORPUS_EXAMPLE:** phone tables de SND-SRC-0094 permanecen infraestructura interna en esta proyección
- **EDITORIAL_EXAMPLE:** ninguno
- **procedencia comprobada:** sí

## Navegación
- **entradas relacionadas:** SND-REP-002, SND-REP-003, SND-REP-007, SND-REP-008, SND-ZHTW-007
- **IDs pendientes/reservados:** inventario fonémico definitivo no se resuelve en esta versión
- **redirects necesarios:** ninguno

## Open questions

### Bloqueantes
- ninguno para la composición de este **mapa**.

### No bloqueantes
- inventario fonémico integral de Taiwan Mandarin;
- elección analítica final de sistema vocálico;
- uso cuantitativo futuro de SND-SRC-0044 con localizador interno fino.

Estas preguntas se vuelven bloqueantes si se intenta convertir esta versión en inventario definitivo.

## Requisitos de composición
- **comenzar en página nueva:** sí
- **caracteres IPA/Unicode especiales:** preservar [pʰ], [tʰ], [kʰ], [tʂ], [tʂʰ], [ts], [tsʰ], [tɕ], [tɕʰ], [s], [ʂ], [ɕ], /n/, /ŋ/
- **tablas complejas:** la tabla R33 no es reader-facing; no crear tabla de inventario por cuenta propia
- **notas tipográficas:** distinguir claramente / / y [ ]; no convertir Zhuyin/Pinyin en IPA
- **otros:** ninguna dependencia de audio

## Resultado
**PASS → READY_FOR_COMPOSITION como mapa de evidencia segmental.**

## Firma editorial del gate
Este manifiesto certifica solo la composición de la versión-map indicada. No certifica un inventario fonémico final ni autoriza resolver OPEN_QUESTION durante maquetación.
