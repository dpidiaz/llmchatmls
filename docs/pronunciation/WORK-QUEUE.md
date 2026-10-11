# MLS-SND — Work Queue

Actualizado: 2026-10-11.

Este archivo es la cola canónica orientativa para chats paralelos. Antes de reclamar trabajo, revisar también PRs y ramas recientes porque GitHub puede avanzar entre actualizaciones de este documento.

## Reglas

- Base de trabajo: `feat/mls-snd-foundation`.
- Cada chat trabaja en una rama `snd/<area>-<wave>`.
- Cada PR debe apuntar a `feat/mls-snd-foundation`.
- Si un ID aparece como ACTIVE o COMPLETE_AWAITING_INTEGRATION, no duplicarlo salvo revisión independiente explícita.
- Los archivos globales se actualizan principalmente durante integración.

## Trabajo activo

| Área | IDs / alcance | Estado | PR / rama |
|---|---|---|---|
| 🇧🇷 pt-BR-rio | PTBR-001, 006, 007, 008 | ACTIVE | PR #7277 |
| 🇺🇸 en-US | ENUS-002, 003, 009 | ACTIVE | PR #7278 |
| 🇯🇵 japonés | JA-002, 003, 005 | ACTIVE | PR #7290 |
| 🇹🇼 zh-TW | ZHTW-001, 004, 005, 009 | COMPLETE_AWAITING_INTEGRATION / overlapping wave | PR #7291 |
| 🇹🇼 zh-TW | ZHTW-004, 005, 008 | COMPLETE_AWAITING_INTEGRATION | PR #7286 |
| 🇰🇷 coreano | KO-001, 002, 003 | COMPLETE_AWAITING_INTEGRATION | PR #7287 |
| 🇰🇷 coreano | KO-001..008, KO-010 | ACTIVE / OVERLAP_WARNING | PR #7288 |
| 🇷🇺 ruso wave 1 | RU-001, 003, 005, 006, 008 | COMPLETE_AWAITING_INTEGRATION | PR #7283 |
| 🇷🇺 ruso wave 2 | RU-002, 004, 007 | COMPLETE_AWAITING_INTEGRATION | PR #7289 |
| 🇫🇷 francés | FR-001, 002, 009 | COMPLETE_AWAITING_INTEGRATION | PR #7282 |
| 🇩🇪 alemán | DE-001, 007, 008 | COMPLETE_AWAITING_INTEGRATION | PR #7284 |
| Fundamentos review | FND-002, 003, 004, 006, 007, 008, 009, 011, 013, 015 | INTEGRATED — LINGUISTIC_REVIEW | PR #7281 |
| Representación IPA lectura | REP-003, REP-004 | ACTIVE / branch present | snd/representation-ipa-reading-wave-01 |
| Representación IPA signos | REP-005, REP-006 | ACTIVE / branch present | snd/representation-diacritics-suprasegmentals-wave-01 |

## Integrado en la matriz

- REP-007, REP-008.
- IT-001, IT-004, IT-008 y mapa local de fuentes italiano.
- FND-010, FND-017.
- ESGT-001, ESGT-002, ESGT-005 y SOURCE-MAP.
- Auditoría R33 piloto consolidada.
- REP-002, ENUS-001, ZHTW-007, KO-009, JA-001.
- Primer gate de fundamentos.

## Trabajo elegible no reclamado

Prioridad sugerida:

1. **EDITORIAL_REVIEW del primer gate fundacional**, una vez integrado PR #7281.
2. **FND-001 — El sonido como parte del idioma.**
3. **FND-005 — Percepción del habla.**
4. **FND-012 — Ritmo**, con fuente especializada; evitar la dicotomía simplista stress-timed/syllable-timed.
5. **FND-014 — Acento tonal**, después de coordinar con japonés.
6. **FND-016 — Habla conectada y procesos contextuales.**
7. **FND-018 — Norma, descripción y uso.**
8. **REP-001 — Sonido, letra y símbolo.**
9. **REP-009 — Ortografía y pronunciación.**
10. **REP-010/011/012 — Romanización, transliteración y sistemas locales**, cuidando no duplicar perfiles.
11. **ESGT-003/004/006/007/008/009/010**, excepto lo reclamado por futuras waves.
12. **IT-002/003/005/006/007/009**, preservando el estado de IT-004.
13. Capítulos comparativos permanecen BLOQUEADOS salvo CMP-001.

## Alertas de solapamiento

- Coreano tiene dos waves parcialmente solapadas (#7287 y #7288). El integrador debe preservar la mejor versión por ID y no sumar claims incompatibles sin revisión.
- zh-TW tiene dos waves parcialmente solapadas (#7286 y #7291). Resolver por alcance y evidencia, no por “último commit gana”.
- Varias ramas antiguas de auditoría permanecen en GitHub aunque sus PRs ya fueron cerrados; no deben considerarse trabajo activo.

## Criterio para tomar el siguiente trabajo

Elegir primero una unidad que:

1. no esté reclamada;
2. tenga fuentes admisibles o un gap investigable claro;
3. desbloquee otras unidades;
4. pueda dejar una salida auditable sin modificar innecesariamente archivos globales.
