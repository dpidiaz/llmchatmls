# Alertas finas de regresión editorial

## Objetivo

Detectar cambios negativos de tendencia en la evidencia viva de AUTOOPT sin modificar R32, FIFO, lotes, artículos, deferred ni decisiones editoriales.

## Ventanas

- Ventana reciente: últimos 7 días.
- Baseline: 21 días inmediatamente anteriores.
- Solo se usa evidencia viva de `wiki_autoopt_events` para la versión AUTOOPT y `promptVersion` actuales.
- Los idiomas, niveles y familias permanecen separados.

## Señales

Se comparan:

- tasa de éxito al primer intento;
- tasa de rechazo R32;
- tasa de deferred;
- presencia reciente de `needs_review`.

Para declarar una tendencia comparable se requieren al menos 8 primeros intentos recientes y 12 en el baseline. Si no existe esa evidencia, el estado es `evidencia insuficiente`, nunca `estable` por defecto.

Una alerta `vigilar` aparece cuando, con muestra suficiente:

- la tasa de primer intento cae al menos 15 puntos porcentuales;
- los rechazos R32 suben al menos 15 puntos porcentuales;
- deferred sube al menos 10 puntos porcentuales y existen al menos 2 deferred recientes;
- o aparece un evento `needs_review` reciente.

## Integración

- Endpoint privado: `GET /api/wiki/editorial/chat/regression/status`.
- Comandos: `MLS alertas regresión`, `MLS estado regresión` o `MLS regresión`.
- El Panel AUTOOPT muestra estado general y familias con señales de regresión.
- El preflight puede elevar su estado a `watch` cuando existe una regresión, pero nunca cancela automáticamente un lote autorizado.

## Restricciones

Este módulo es diagnóstico y read only. No genera, publica, rescata, reintenta, reordena FIFO, cambia prompts, cambia R32 ni llama proveedores de IA.

## Prompt operativo para continuar en ChatGPT

Trabaja exclusivamente en `dpidiaz/llmchatmls` y continúa el módulo de Alertas finas de regresión editorial. Conserva MLS R32 como autoridad. Usa únicamente evidencia viva de AUTOOPT y mantén separados idioma, nivel y familia. No conviertas evidencia insuficiente en estabilidad. Las alertas deben ser diagnósticas y nunca deben iniciar, cancelar, publicar, regenerar, rescatar, reordenar FIFO o debilitar validaciones. Antes de merge o deploy ejecuta la suite editorial, predeploy, contrato de despliegue y Wrangler dry run. Corrige cualquier fallo en el mismo PR y solo fusiona cuando todo esté verde.