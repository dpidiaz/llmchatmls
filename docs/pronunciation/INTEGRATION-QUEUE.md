# MLS-SND — Integration Queue

Actualizado: 2026-10-11.

Este archivo es mantenido por el chat integrador. No sustituye `STATUS.md`: registra **PRs, solapamientos, bloqueos y decisiones de reconciliación** entre chats paralelos.

## Reglas

- Ningún PR entra por volumen de trabajo; entra por gate.
- Un PR draft puede estar completo pero esperar revisión.
- Un PR `ready for review` puede seguir bloqueado si arrastra cambios ajenos a su claim.
- Cuando dos PRs cubren el mismo ID, se designa una ruta canónica y el otro se convierte en revisión/superseded.
- Los Source IDs globales se asignan solo al integrar para evitar colisiones.

## Cola actual

| PR | Área | Estado integrador | Acción |
|---|---|---|---|
| #7301 | Foundations linguistic review | BLOCKED_BY_DIVERGENCE | Conceptualmente válido, pero no mergeable contra base viva. Reemplazar por integración limpia; no forzar. |
| #7303 | Foundations clean integration | ACTIVE_REAPPLY | Ruta preferida para reaplicar contenido de #7301 sobre base actual sin hot files globales. |
| #7294 | CMP-001 comparación | CONTENT_PASS / GLOBALS_PENDING | Fuentes externas verificadas; limpiar inventario y canonicalizar CMP-PROP-001/002 antes de EVIDENCE_CHECKED. |
| #7288 | 🇰🇷 Coreano | CANONICAL_KO | Ruta canónica amplia. Absorbe revisión de #7287; mantener norma NIKL, habla de Seúl y romanización separadas. |
| #7287 | 🇰🇷 Coreano paralelo | CLOSED_SUPERSEDED_REVIEW | Hallazgos transferidos a #7288. No revivir como ruta canónica. |
| #7291 | 🇹🇼 zh-TW | CANONICAL_ZHTW_PENDING_RECONCILIATION | Absorber ZHTW-008 y cautelas de #7286; unificar ZHTW-004/005. |
| #7286 | 🇹🇼 zh-TW tono/Zhuyin | HOLD_FOR_TRANSFER | Conservar hasta transferir ZHTW-008 y reconciliar 004/005 en #7291. |
| #7282 | 🇫🇷 Francés | EVIDENCE_WAVE_COMPLETE | FR-001/002/009 EVIDENCE_CHECKED; siguiente gate: LINGUISTIC_REVIEW. |
| #7278 | 🇺🇸 Inglés EE. UU. | PROFILE_WAVE_ACTIVE | Revisar al cierre; evitar “General American” homogéneo. |
| #7277 | 🇧🇷 Portugués carioca | PROFILE_WAVE_ACTIVE | Revisar al cierre; mantener PB_BROAD vs RIO_CARIOCA. |
| #7284 | 🇩🇪 Alemán | RESEARCH_WAVE_COMPLETE | DE-007 EVIDENCE_CHECKED; DE-001/008 aún RESEARCHED hasta canonicalizar fuentes nacionales. |
| #7290 | 🇯🇵 Japonés mora | RESEARCH_WAVE_COMPLETE | JA-002/003/005 RESEARCHED; decisión prudente: no promover sin bibliografía fonológica adicional. |
| #7283 | 🇷🇺 Ruso wave 1 | EVIDENCE_WAVE_COMPLETE | RU-001/003/005/006/008 EVIDENCE_CHECKED; requiere revisión lingüística. |
| #7289 | 🇷🇺 Ruso wave 2 | EVIDENCE_WAVE_COMPLETE | RU-002/004/007 EVIDENCE_CHECKED; requiere revisión lingüística. |
| #7292 | 🇷🇺 Ruso escritura | RESEARCHED_PENDING_SOURCE_ID | RU-009 espera canonicalización de fuente ortográfica. |
| #7294 | CMP-001 comparación | CANONICAL_CMP001 | Ruta canónica; absorber `editorial/comparison-checklist.md` de #7297; canonicalizar dos fuentes locales y limpiar inventario. |
| #7297 | CMP-001 paralelo | HOLD_FOR_CHECKLIST_TRANSFER | Conservar solo el checklist editorial; cerrar como superseded después de transferirlo a #7294. |
| #7293 | navegación editorial | ACTIVE | Esperar salida; vigilar que no renumere IDs globales sin reconciliación. |
| #7295/#7299 | representación/escritura | ACTIVE | Coordinar con waves IPA para evitar entradas duplicadas. |
| #7300 | FND-005 percepción | CANONICAL_FND005_RESEARCH | Ruta canónica por mayor profundidad; canonicalizar fuentes candidatas antes de EVIDENCE_CHECKED. |
| #7302 | fundamentos wave 02 | REDUCE_SCOPE | Conservar como salida canónica FND-012/016/018; FND-004 y FND-005 quedan como revisión paralela, no segunda ruta. |
| #7304 | FND-001 + FND-014 | ACTIVE / NONOVERLAP | FND-001 evidence-checked; FND-014 researched con fuente Hyman pendiente de canonicalización. |

## Decisiones de integración vigentes

### Foundations

La revisión lingüística de diez fundamentos es aceptada **en contenido**, con estas condiciones ya detectadas:

- una sola ruta canónica para FND-004;
- una sola ruta canónica para FND-006;
- una sola ruta canónica para FND-007;
- `fraseo y entonación`, no `fraseo e entonación`;
- stress/acento no se universaliza;
- F0 no se trata como sinónimo físico de pitch/tono;
- fonación no se reduce a voiced/voiceless.

No integrar #7301 directamente si sigue dirty; usar reaplicación limpia.

### Coreano

#7288 es canónico. #7287 queda como revisión independiente absorbida.

### Taiwan Mandarin

#7291 es la ruta canónica amplia. Debe absorber de #7286:

- ZHTW-008 — Zhuyin vs IPA;
- cautela de no tratar ZHTW-004 como descripción integral cerrada;
- límites de ZHTW-005.

**Metadatos Fon & Chuang:** mantener conflicto visible entre issue/volume 2024 y publicación online/PDF 2025 hasta canonicalización bibliográfica; no corregir silenciosamente.

### Comparación

CMP-001 puede existir antes de que todos los perfiles estén cerrados porque define **método**, no compara inventarios completos.

Los capítulos CMP-002…CMP-011 siguen bloqueados por perfiles.

## Siguiente gate del integrador

1. aceptar una integración limpia de foundations cuando sea mergeable;
2. canonicalizar fuentes de CMP-001 y ejecutar gate R33;
3. reconciliar zh-TW;
4. solicitar/revisar LINGUISTIC_REVIEW de waves EVIDENCE_CHECKED completas;
5. solo después actualizar `STATUS.md` y documentos globales en un batch coordinado.


### Source integration

- **#7320 — READY_FOR_INTEGRATION:** protocolo de source IDs/deduplicación auditado contra 60 entradas canónicas.
- SOURCE-ID-INTEGRITY-01: PASS.
- Únicos IDs locales restantes: DE-001, DE-008, ESGT-002, KO-005; todos en estados pre-R33.
