# Salud por lote — plan de trabajo

Objetivo: hacer visible el comportamiento de cada lote editorial sin convertir AUTOOPT en un ejecutor autónomo.

## Alcance

1. Leer lotes recientes de `wiki_chat_runs` y `wiki_chat_items`.
2. Reutilizar exclusivamente métricas AUTOOPT vivas de `wiki_autoopt_stats` con `scope='run'`.
3. Mostrar por lote: solicitadas, seleccionadas, publicadas, deferred, preservadas, pendientes, duración, tasa de primer intento e intentos por publicación.
4. Comparar cada lote únicamente con el lote anterior del mismo tipo (`normal` o `rescue-chat`).
5. Exponer endpoint privado de solo lectura y operación OpenAPI.
6. Integrar resumen en el Panel AUTOOPT.
7. Mantener R32, FIFO, publicación, rescate y generación completamente separados del diagnóstico.

## Reglas

- No iniciar, cancelar, reordenar o modificar lotes.
- No cambiar artículos ni deferred.
- No llamar proveedores de IA.
- No inventar métricas cuando no hay muestra suficiente.
- No convertir comparaciones en rankings ni decisiones automáticas.
- Mantener lotes normales y rescates comparados dentro de su propio tipo.

## Prompt operativo

Trabaja exclusivamente en `dpidiaz/llmchatmls`. Mantén MLS R32 como autoridad editorial y AUTOOPT como diagnóstico. Implementa o mejora la salud por lote usando únicamente datos ya persistidos. Conserva separados lotes normales y `rescue-chat`; no modifiques FIFO, artículos, publicaciones, rescates ni generación. Toda comparación debe ser descriptiva y contra el lote anterior del mismo tipo. Antes de merge o deploy ejecuta tests editoriales, predeploy, contrato de deploy y Wrangler dry run.