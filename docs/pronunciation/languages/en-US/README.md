# 🇺🇸 Inglés estadounidense

**Estado de referencia:** MULTI_REFERENCE.
**Wave activa:** en-US pilot wave 01.

## Estado de entradas

| ID | Tema | Estado |
|---|---|---|
| SND-ENUS-001 | Por qué no usamos “General American” como una sola voz | EVIDENCE_CHECKED |
| SND-ENUS-002 | Sistema consonántico: mapa de evidencia | SOURCE_MAPPED |
| SND-ENUS-003 | Sistemas vocálicos y variación regional | RESEARCHED |
| SND-ENUS-004 | Reducción en conversación | RESEARCHED |
| SND-ENUS-005 | Acento léxico | INVENTORY |
| SND-ENUS-006 | Habla conectada: corpus y alcance | RESEARCHED |
| SND-ENUS-007 | Ritmo, organización temporal y prominencia | RESEARCHED |
| SND-ENUS-008 | Entonación y variación prosódica regional | RESEARCHED |
| SND-ENUS-009 | Southern Michigan como perfil documentado | EVIDENCE_CHECKED |
| SND-ENUS-010 | Comparaciones con español/portugués | BLOCKED_BY_PROFILES |

## Decisión de arquitectura

El perfil no usa una sola voz “General American”. Se organiza con:

1. contrastes de alcance amplio solo cuando varias fuentes permiten sostenerlos;
2. perfiles regionales explícitos;
3. variación regional/social/temporal cuando sea material;
4. realizaciones fonéticas siempre ligadas a fuente y alcance.

## Fuentes

Fuentes globales ya registradas: SND-SRC-0004 y SND-SRC-0005.

Fuentes candidatas de esta wave se documentan en SOURCE-MAP.md, incluidas:
- Atlas of North American English;
- Clopper, Pisoni & de Jong (2005), seis variedades regionales;
- Nationwide Speech Project.

## Gap principal

Falta justificar un inventario consonántico de alcance amplio sin extrapolar una sola Illustration regional. Para vocales, la evidencia regional ya es suficiente para fijar la arquitectura, pero faltan promover fuentes candidatas al Source Registry global y verificar localizadores internos antes de pasar SND-ENUS-003 a EVIDENCE_CHECKED.

## Próximo bloque elegible

Después de integrar esta wave:
- promover las fuentes candidatas con IDs globales no conflictivos;
- auditar SND-ENUS-003;
- promover fuentes prosódicas y conversacionales candidatas al Source Registry global y ejecutar sus gates R33;
- avanzar SND-ENUS-005 (acento léxico) con fuentes específicas.