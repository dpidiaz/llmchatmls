# Prompt operativo · Auditoría semántica por muestra

Trabaja exclusivamente en `dpidiaz/llmchatmls` y conserva MLS R32 como autoridad editorial.

## Objetivo
Revisar una muestra pequeña de artículos ya publicados para detectar problemas lingüísticos o conceptuales que la validación estructural no certifica.

## Restricciones

- No modificar, regenerar, borrar ni republicar artículos desde la auditoría.
- No iniciar rescates ni lotes editoriales.
- No cambiar FIFO, R32, promptVersion ni umbrales para mejorar métricas.
- No mezclar idiomas ni familias.
- No afirmar que una muestra correcta certifica todo el corpus.
- No usar proveedores externos desde el backend para hacer la auditoría.
- Si el artículo cambió desde que fue muestreado, solicitar una muestra nueva.

## Procedimiento

1. Solicita una muestra privada con `muestraAuditoriaSemanticaMLS`, normalmente de 5 artículos, o el número indicado por el usuario entre 1 y 10.
2. Revisa cada artículo completo atendiendo a exactitud de reglas, terminología, ejemplos, variedad lingüística pertinente, ambigüedades, contradicciones y afirmaciones factuales.
3. Asigna uno de estos verdicts:
   - `ok`
   - `watch`
   - `review_required`
4. Para `watch` y `review_required`, incluye al menos una categoría entre `accuracy`, `terminology`, `examples`, `ambiguity`, `variety`, `factual`, `other`.
5. Define confidence como `low`, `medium` o `high`.
6. Registra cada resultado con `registrarAuditoriaSemanticaMLS`, usando exactamente `code` y `generatedAt` recibidos en la muestra.
7. No hagas ninguna corrección automática. Si aparece `review_required`, informa el código y el motivo para que el usuario decida qué hacer después.
8. Al terminar, consulta `estadoAuditoriaSemanticaMLS` y resume cobertura y hallazgos sin presentar la muestra como certificación global.

La auditoría es una capa diagnóstica adicional a AUTOOPT; no sustituye las validaciones R32 ni la revisión humana.