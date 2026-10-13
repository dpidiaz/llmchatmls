# MLS-SND — Plan de trabajo R44

R44 organiza **trabajo y entregas**. No determina análisis lingüístico, terminología ni redacción.

## 1. Unidad de trabajo

Formato sugerido de ID: SND-<AREA>-<LANG>-<NNNN>.

Ejemplos:
- SND-FND-X-0001 — fonética vs. fonología;
- SND-SEG-ESGT-0001 — inventario candidato de consonantes;
- SND-PRO-ZHTW-0001 — mapa de fuentes para tono;
- SND-WRT-KO-0001 — hangul, romanización e IPA.

## 2. Estados

INVENTORY → SOURCE_MAPPED → RESEARCHED → DRAFTED → EVIDENCE_CHECKED → LINGUISTIC_REVIEW → EDITORIAL_REVIEW → READY_FOR_COMPOSITION.

## 3. Campos por unidad

- work_id;
- área;
- idioma/variedad;
- entradas incluidas;
- fuentes requeridas;
- dependencias;
- decisiones abiertas;
- claims esperados;
- responsable;
- estado;
- versión;
- bloqueos;
- salida/commit.

## 4. Tamaño de lote

Un lote debe ser pequeño y semánticamente coherente. La meta no es maximizar número de entradas por paquete sino minimizar mezcla de dependencias.

Recomendación inicial:
- fundamentos: 3–8 entradas relacionadas;
- perfiles: 1 fenómeno o pequeño cluster por lote;
- fuentes: una familia de fuentes o un hueco claramente definido;
- revisión: una entrada o cluster con claims ya estabilizados.

## 5. Dependencias duras

No redactar producción masiva si falta:
1. referencia de variedad suficiente;
2. convención de transcripción aplicable;
3. al menos una fuente admisible para el fenómeno;
4. localizadores verificables;
5. terminología canónica.

## 6. Carriles

### RESEARCH
Busca y registra evidencia.

### DRAFT
Redacta solo a partir de evidencia registrada.

### R33
Mapea claim ↔ source ↔ locator y resuelve conflictos.

### LINGUISTIC_REVIEW
Comprueba análisis, variedad, IPA y límites.

### EDITORIAL_REVIEW
Comprueba claridad, estructura, enlaces y consistencia.

### COMPOSITION
Solo recibe entradas listas; no corrige contenido lingüístico.

## 7. Backfill

Cuando una unidad termina, la siguiente elegible debe provenir del mismo carril o de una dependencia desbloqueada. No se reencola automáticamente una unidad bloqueada sin cambiar la causa del bloqueo.

## 8. Primeras waves

- WAVE-01: fundamentos y plantilla.
- WAVE-02: es-GT fuentes y alcance.
- WAVE-03: en-US variación y fuentes.
- WAVE-04: pt-BR-rio fuentes y alcance.
- WAVE-05: it/fr/de referencias europeas.
- WAVE-06: zh-TW/ko/ja sistemas de escritura y prosodia.
- WAVE-07: ru descripción + ortoepía.

## 9. Regla de calidad

R44 nunca autoriza a rebajar un gate R33 para aumentar throughput.