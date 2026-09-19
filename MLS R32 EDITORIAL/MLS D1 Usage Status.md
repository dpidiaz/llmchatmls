# MLS D1 Usage Status

Este módulo añade métricas diarias de Cloudflare D1 a:

- `/api/wiki/status`
- `/status`

## Fuente

Las métricas usan la API oficial Cloudflare GraphQL Analytics y consultan `d1AnalyticsAdaptiveGroups` a nivel de cuenta.

Campos principales expuestos por `/api/wiki/status`:

- `d1Usage.rowsRead`
- `d1Usage.rowsWritten`
- `d1Usage.readLimit`
- `d1Usage.writeLimit`
- `d1Usage.readPercent`
- `d1Usage.writePercent`
- `d1Usage.readsRemaining`
- `d1Usage.writesRemaining`
- `d1Usage.state`
- `d1Usage.resetAt`
- `d1Usage.resetInSeconds`
- `d1Usage.sampledAt`

El límite gratuito usado por el módulo es:

- rows read: 5,000,000 por día
- rows written: 100,000 por día
- reset: 00:00 UTC

## Activación segura

El Worker necesita dos bindings configurados directamente en Cloudflare:

1. Secret `D1_ANALYTICS_TOKEN`
2. Variable `D1_ANALYTICS_ACCOUNT_ID`

El token debe ser independiente del token de despliegue y tener solamente:

- Account
- Account Analytics
- Read

No reutilizar `CLOUDFLARE_API_TOKEN` del deployment.

El deploy de MLS usa `wrangler deploy --keep-vars`, por lo que una variable o secret configurado directamente en Cloudflare se conserva en despliegues posteriores.

## Comportamiento si Analytics no está configurado

El status nunca inventa cifras.

`d1Usage.available` será `false` y `d1Usage.reason` será:

- `analytics_not_configured`, o
- `analytics_unavailable`

Los límites y el próximo reset siguen disponibles, y el countdown de `/status` continúa funcionando sin consultar D1.

## Comportamiento durante cuota agotada

Si D1 rechaza consultas por cuota diaria:

- `/api/wiki/status` continúa devolviendo JSON degradado con HTTP 503.
- `d1Usage.quotaExhausted` se marca como `true`.
- `d1Usage.state` se marca como `exhausted`.
- `/status` sigue mostrando el countdown hasta 00:00 UTC.
- Las métricas Analytics, si están configuradas, se consultan fuera de D1 y pueden seguir mostrándose.

## Caché

Las métricas GraphQL se cachean en memoria del isolate durante 60 segundos cuando es posible. La cuenta regresiva se actualiza cada segundo en el navegador y no genera peticiones adicionales.
