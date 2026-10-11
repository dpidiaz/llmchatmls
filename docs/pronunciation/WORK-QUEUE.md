# MLS-SND — Work Queue

Actualizado: 2026-10-11.

La rama matriz contiene **60 entradas integradas**. Antes de reclamar trabajo, revisar `STATUS.md`, `INTEGRATION-QUEUE.md`, ramas `snd/*` y PRs abiertos.

## Reglas

- Base: `feat/mls-snd-foundation`.
- Cada chat trabaja en `snd/<area>-<wave>`.
- PRs apuntan a la rama matriz, no a `main`.
- Si una entrada ya existe en la matriz, una wave nueva debe ser **review**, no un segundo archivo canónico.
- Global hot files se actualizan durante integración.
- Source IDs locales no se convierten en SND-SRC globales hasta deduplicación.

## Trabajo activo prioritario

| Área | Alcance | Ruta / PR | Nota |
|---|---|---|---|
| FND-005 | percepción del habla | #7300 | **Ruta canónica de investigación**; canonicalizar fuentes antes de EVIDENCE_CHECKED. |
| FND-012/016/018 | ritmo, procesos, norma/uso | #7302 | Reducir scope; FND-004/005 no son salidas canónicas de esta PR. |
| FND-001/014 | sonido + acento tonal | #7304 | FND-014 permanece RESEARCHED hasta canonicalizar Hyman y fuentes por perfil. |
| FND-017 review | variación | #7311 | La entrada ya está en LINGUISTIC_REVIEW; tratar esta wave como revisión independiente. |
| REP-001/009/012 | escritura y sistemas locales | #7295 | Evitar duplicar perfiles. |
| REP-010/011 | romanización/transliteración | #7299 | Mantener separado de IPA y de sistemas locales. |
| REP-003/004 | lectura IPA | ramas representation activas | Integrar después de review. |
| CMP-001 | método comparativo | #7294 | **Ruta canónica**; canonicalizar dos fuentes y absorber checklist de #7297. |
| CMP-001 paralelo | checklist | #7297 | Conservar checklist; cerrar entrada duplicada después de transferencia. |
| 🇺🇸 en-US | clusters de variación | #7278 | Sigue activo. |
| 🇧🇷 pt-BR-rio | clusters cariocas | #7277 | Sigue activo. |
| 🇯🇵 ja | mora/duración/estructura | #7290 | RESEARCHED; requiere bibliografía fonológica antes de gate. |
| 🇯🇵 ja | romanización oficial | #7313 | Nueva wave; verificar norma vigente. |
| 🇩🇪 de | core segmental/prosódico | #7309 | Continuación del perfil ya integrado parcialmente. |
| 🇮🇹 it | acento | #7306 | No solapa IT-004/008. |
| 🇮🇹 it | E/O ortoepía | #7316 | Coordinar con core wave italiana. |
| 🇮🇹 it | core vowels/consonants/variación | #7317 | Evitar duplicar IT-006 con #7316. |
| 🇷🇺 ru | cirílico/pronunciación RU-009 | #7292 | Fuente ortográfica pendiente de canonicalización. |
| 🇰🇷 ko | revisión lingüística | #7307 | Perfil 001–010 ya está integrado; esta wave debe revisar, no reescribir. |
| REF-001 | glosario | #7315 | Derivar de terminología canónica, sin inventar definiciones nuevas. |
| REF-002 | índice IPA | #7310 | Seed de índice; no sustituye IPA Chart. |
| REF-003/004 | índices fenómeno/idioma | #7314/#7319 | Índices vivos derivados del corpus. |
| editorial | navegación/frontmatter/evidence display | #7293/#7318/#7308 | Mantener libro de consulta; sin ejercicios/evaluación. |
| source integration | protocolo/deduplicación | #7320 | Debe reducir colisiones de IDs locales antes de integración masiva. |

## Integrado — no reclamar como draft nuevo

### Fundamentos
FND-002, 003, 004, 006, 007, 008, 009, 010, 011, 013, 015, 017.

### Representación
REP-002, 005, 006, 007, 008.

### Perfiles
- ESGT-001/002/005.
- ENUS-001/009.
- PTBR-001/006.
- IT-001/004/008.
- FR-001/002/009.
- DE-001/007/008.
- ZHTW-001/003/004/005/007/008/009/010.
- KO-001…010.
- JA-001.
- RU-001…008.

Una wave nueva sobre cualquiera de esos IDs debe declararse como **revisión, ampliación compatible o corrección**, no como segundo canónico.

## Trabajo todavía claramente abierto

Además de las waves activas:

- ESGT-003/004/006/007/008/009/010.
- ENUS-004/005/006/007/008.
- PTBR-002/003/004/005/009/010.
- FR-003/004/005/006/007/008.
- JA-004/006/007/008/009, respetando claims nuevos.
- RU-009 hasta integración.
- capítulos comparativos CMP-002…011 permanecen bloqueados por perfiles.

## Criterio de siguiente trabajo

1. no duplicado;
2. desbloquea dependencias;
3. tiene evidencia verificable;
4. reduce un gap crítico;
5. puede terminar con salida auditable;
6. no rebaja R33 para aumentar throughput.
