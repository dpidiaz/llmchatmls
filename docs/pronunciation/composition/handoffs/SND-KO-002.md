# Composition Handoff Manifest — SND-KO-002

## Identidad
- **entry_id:** SND-KO-002
- **title:** Sistema consonántico: mapa de evidencia
- **content_version / commit:** blob `9af8b7292140e3179944ea980964c9122f73fdbf`
- **handoff_date:** 2026-10-13
- **reviewer / wave:** ko002-composition-readiness-wave-01

## Gates
- **EVIDENCE_CHECKED:** PASS_WITH_SCOPE_BOUNDARY — `audits/KO-002-EVIDENCE-GATE-2026-10-11.md`
- **LINGUISTIC_REVIEW:** PASS_WITH_SCOPE_WARNING — `reviews/SND-KO-002-LINGUISTIC-REVIEW-20261012.md`
- **EDITORIAL_REVIEW:** PASS_WITH_SCOPE_WARNING — `reviews/SND-KO-002-EDITORIAL-REVIEW-20261013.md`
- **COMPOSITION_READINESS:** PASS como mapa parcial

## Proyección reader-facing
- **incluido:** §§1, 3–5, 7 y 9
- **§2:** incluir solo `Cluster`, `Base histórica` y `Evidencia contemporánea`; excluir la columna interna `Estado`
- **excluido:** §6 (tabla R33 bruta), §8 (gate interno), §§10–11 (workflow/revisiones), tokens internos `EVIDENCE_AVAILABLE` y `SOURCE_MAPPED`
- **Fuentes y fundamento:** derivado de SND-SRC-0020/0021/0033 con fechas, Seúl y posición prosódica visibles cuando sean materiales
- **nota editorial visible:** sí, la condición de mapa parcial y la advertencia histórica deben permanecer visibles
- **secciones ambiguas:** ninguna.

### Pronunciation Quick Layer (R32)
- **status:** NOT_APPLICABLE
- **reader_locale:** no aplica
- **source_form:** no aplica
- **meaning_or_gloss:** no aplica
- **easy_pronunciation:** no aplica
- **ipa_source / representación aprobada de origen:** no aplica
- **scope_note:** mapa de cobertura, sin forma léxica objetivo
- **deep_link / sección de detalle:** no aplica
- **derivation_note:** no generar respelling.

## Alcance
- **idioma:** coreano
- **variedad:** Seúl únicamente cuando las fuentes contemporáneas lo especifican
- **tipo de alcance:** mapa de evidencia consonántica parcial
- **fecha/muestra material:** Lee 1993 como ancla histórica; Bang et al. 2018 y Schweizer et al. 2026 para evidencia contemporánea delimitada

## Representación presente
- [ ] ortografía como forma objetivo
- [ ] hangul de ejemplo
- [ ] romanización
- [ ] transliteración
- [ ] /transcripción fonológica/
- [ ] [transcripción fonética]
- [ ] diacríticos IPA
- [x] categorías lax / tense / aspirated
- [x] VOT / f0 como pistas acústicas descritas
- [x] tabla de cobertura derivable sin estados internos

## Evidencia
- **source_ids:** SND-SRC-0020, SND-SRC-0021, SND-SRC-0033
- **claims materiales:** KO002-C01…C04
- **conflictos documentados:** no hay conflicto bloqueante; existe una frontera temporal explícita entre la Illustration de 1993 y la evidencia contemporánea de Seúl
- **metadata bibliográfica incompleta:** no

## Ejemplos
- **SOURCE_EXAMPLE:** ninguno presentado como ejemplo léxico
- **CORPUS_EXAMPLE:** ninguno
- **EDITORIAL_EXAMPLE:** ninguno
- **procedencia comprobada:** no aplica

## Navegación
- **entradas relacionadas:** SND-KO-001, SND-KO-003, SND-FND-006, SND-FND-017
- **IDs pendientes/reservados:** ninguno necesario para entender el mapa actual
- **redirects necesarios:** ninguno

## Open questions

### Bloqueantes
- ninguno para el objeto editorial “mapa parcial”

### No bloqueantes
- actualización contemporánea de fricativas
- actualización contemporánea de africadas
- procesos/contexto contemporáneos de nasales
- alofonía contemporánea de líquidas
- fuente fonética contemporánea integral para codas

Estas preguntas se mantienen abiertas y **no** pueden ser resueltas por COMPOSITION.

## Requisitos de composición
- **comenzar en página nueva:** sí
- **caracteres IPA/Unicode especiales:** ninguno material en la proyección actual
- **tablas complejas:** tabla simple de cobertura; no mostrar columna de estado interno
- **notas tipográficas:** preservar cursivas de términos ingleses, VOT y f0; no convertir las categorías en traducciones “sonora/sorda”
- **audio:** no requerido

## Resultado
**PASS → READY_FOR_COMPOSITION como mapa parcial de evidencia.**

## Firma editorial del gate
Este manifiesto certifica únicamente que la versión indicada puede entrar al carril COMPOSITION como mapa de cobertura parcial. No certifica un inventario consonántico canónico ni autoriza completar gaps durante maquetación.
