# Profesor IA — auditoría de costo

## Estado

Fase 16 del roadmap del Profesor IA.

## Resultado

La arquitectura del Profesor IA mantiene el principio de costo controlado sin añadir un segundo proveedor ni una segunda ruta de inferencia.

## Guardrails verificados

- El contexto enviado por el cliente se limita a `MAX_CLIENT_CONTEXT_CHARS = 11500`.
- La conversación corta queda limitada a 10 mensajes y 8000 caracteres mediante `sessionStorage`.
- Las capas adicionales del Profesor IA no realizan `fetch`, `XMLHttpRequest`, `sendBeacon` ni `WebSocket` propios.
- La observabilidad permanece local y no crea tráfico de telemetría.
- La materialización conserva `cloudflareOnly: true`, `externalProvidersConfigured: []` y `approvedExternalModels: {}`.
- No se añade OpenAI, Anthropic ni otro proveedor externo al flujo de materialización.

## Alcance

Esta auditoría verifica contratos de código y límites deterministas. No afirma un costo monetario por respuesta individual porque ese valor depende de la cuota y metering del proveedor en el momento de uso.

## Validación automática

`test/profesor ia auditoria costo.test.cjs` convierte estos límites en regresiones de CI. Si una capa nueva introduce tráfico adicional, amplía los límites definidos o reintroduce proveedores externos, la suite debe fallar.
