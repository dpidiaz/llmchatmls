# SND-REF-002 — Linguistic review — 2026-10-13

## Versión
- **Entrada:** SND-REF-002
- **Blob revisado:** `14489d902b89a69e2d707fc9fa8d98bd75805027`
- **Gate de entrada:** EVIDENCE_CHECKED
- **Gate evaluado:** LINGUISTIC_REVIEW
- **Objeto:** índice IPA vivo de MLS-SND; no inventario fonémico ni copia integral de la tabla IPA.

## Controles

### 1. Alcance lingüístico
PASS_WITH_SCOPE_WARNING. REF-002 indexa formas ya presentes o explicadas en MLS-SND. Su función es de consulta y trazabilidad; no decide por sí mismo el valor fonético/fonológico de una lengua.

### 2. Símbolo, diacrítico y secuencia
PASS tras aclaración. El índice puede contener símbolos simples, diacríticos y secuencias atestiguadas. Una cadena como `pʰ`, `tʂ` o `tɕʰ` no se presenta automáticamente como un único símbolo atómico del IPA.

### 3. Nivel de representación
PASS. Se conserva la separación entre /fonológico/ y [fonético] de SND-REP-007. La identidad del carácter no colapsa el nivel analítico.

### 4. Grado de detalle
PASS. REF-002 no genera transcripción más estrecha que la validada en la entrada fuente; esto es coherente con SND-REP-008.

### 5. Sistemas no IPA
PASS. Zhuyin y romanización permanecen fuera del índice salvo uso explícito como IPA. La notación `/S/` del perfil carioca sigue marcada como SOURCE_SPECIFIC y no se convierte en símbolo IPA por apariencia tipográfica.

### 6. Dependencia de estados ajenos
PASS tras reparación. Se eliminó del cuerpo la afirmación volátil de que SND-ZHTW-003 seguía en RESEARCHED_PARTIAL. REF-002 ahora describe su relación con esa entrada por función y alcance, no por un gate que puede cambiar.

### 7. Evidencia
PASS para el alcance del gate. No se añadieron símbolos, IPA, fuentes, localizadores ni claims lingüísticos nuevos; se revisó la arquitectura de representación de la versión ya EVIDENCE_CHECKED.

## Veredicto

**PASS_WITH_SCOPE_WARNING → LINGUISTIC_REVIEW.**

Advertencia superviviente: REF-002 es un índice vivo. Una expansión material futura debe volver a comprobar clasificación, procedencia, nivel /…/ vs […] y si una forma es símbolo, diacrítico, secuencia o notación externa antes de heredar este resultado.

Siguiente gate: EDITORIAL_REVIEW sobre la versión producida por esta wave.
