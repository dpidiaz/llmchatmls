# pt-BR/Rio editorial review — wave 01

**Fecha:** 2026-10-11  
**Alcance:** SND-PTBR-001 y SND-PTBR-006.  
**Dependencia:** revisión lingüística independiente ya integrada como artefacto.  
**Tipo:** EDITORIAL_REVIEW.

## Resultado global

**PASS_WITH_EDITORIAL_CHANGES**

No se modificaron claims, fuentes, localizadores ni porcentajes.

## SND-PTBR-001

**Dictamen:** PASS_WITH_EDITORIAL_CHANGES.

### Cambios

- El metadato `Brasil / Río de Janeiro` se sustituyó por una etiqueta de alcance explícita:
  - PB_BROAD;
  - RIO_CARIOCA;
  - CORPUS_OBSERVED cuando la afirmación procede de NURC-RJ.
- Se añadieron enlaces canónicos a PTBR-006/007/008 y FND-017.
- La antigua sección “Revisión lingüística wave 01” se convirtió en un gate editorial/lingüístico coherente con el workflow vigente.
- Se hace explícito que la entrada no equivale a un perfil carioca completo ni a READY_FOR_COMPOSITION.

### Preservado

- REFERENCE_PROVISIONAL.
- PTBR001-C01…C04.
- La separación PB_BROAD / RIO_CARIOCA.
- Las cautelas sobre corpus/submuestras.

## SND-PTBR-006

**Dictamen:** PASS_WITH_EDITORIAL_CHANGES.

### Cambios

- La variedad se etiqueta como `RIO_CARIOCA` y la muestra como `fala culta carioca` de los conjuntos NURC descritos.
- Se añaden tipos de alcance visibles:
  - CORPUS_OBSERVED;
  - DOCUMENTED_VARIANT;
  - DATE_SCOPE_WARNING.
- El gate final explicita que los porcentajes pertenecen a los años 1970/1990 y que no son tasas urbanas de 2026.
- Se conserva /S/ como notación analítica de la fuente.

### Preservado

- 85/72 % en los 70;
- 91/76 % en los 90;
- PTBR006-C01…C05;
- la variación social;
- el carácter no obligatorio de la palatalización.

## Consistencia con normas MLS-SND

- separación variedad/alcance: PASS;
- fecha/muestra visibles: PASS;
- IDs canónicos: PASS;
- referencias cruzadas: PASS;
- evidencia separada de decisión editorial: PASS;
- ninguna dependencia de audio: PASS;
- ningún ejercicio/evaluación: PASS.

## Invariantes para PTBR-002…010

Las waves futuras deben conservar:

1. PB_BROAD ≠ RIO_CARIOCA;
2. fluminense ≠ ciudad de Río de Janeiro;
3. NURC histórico ≠ frecuencia urbana contemporánea;
4. afiliación institucional del investigador ≠ procedencia dialectal del hablante;
5. /S/, /R/ y /L/ pueden ser etiquetas analíticas de fuente y no realizaciones fonéticas únicas;
6. OPEN_QUESTION no se resuelve por simetría editorial.

## Gate

- PTBR-001: EDITORIAL_REVIEW = PASS_WITH_EDITORIAL_CHANGES.
- PTBR-006: EDITORIAL_REVIEW = PASS_WITH_EDITORIAL_CHANGES.

No promover automáticamente a READY_FOR_COMPOSITION. El perfil carioca sigue incompleto mientras PTBR-002…010 mantengan holds y contenido pendiente.
