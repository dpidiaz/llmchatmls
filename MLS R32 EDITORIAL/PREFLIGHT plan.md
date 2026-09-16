# Preflight de salud antes de cada lote

## Objetivo

Comprobar el estado operativo antes de iniciar trabajo editorial sin reservar entradas ni modificar el corpus.

## Principios

- Solo lectura y cero coste de proveedor.
- Separar el flujo editorial de ChatGPT de la ruta de generación Cloudflare.
- No confundir cuota de Workers AI con capacidad del flujo editorial ChatGPT.
- No cambiar FIFO, R32, promptVersion, artículos, deferred ni AUTOOPT.
- No impedir lotes por advertencias diagnósticas cuando el modo solicitado tiene trabajo disponible.
- No abrir lotes vacíos cuando no existen entradas normales o deferred disponibles.

## Señales

1. Cola normal disponible y estados de `wiki_jobs`.
2. Incidencias deferred rescatables.
3. Lotes editoriales activos y reservas pendientes.
4. Salud AUTOOPT y señales de auditoría semántica.
5. Estado separado de Workers AI: binding, presupuesto, reservas y circuito de cuota.
6. R32 / promptVersion vigente.

## Estados

- `ready`: no hay advertencia operativa relevante.
- `watch`: el trabajo puede comenzar, pero existe una señal que conviene observar.
- `blocked`: ese modo concreto no puede empezar con el estado actual.

`normalBatch` y `rescueBatch` se evalúan por separado. Un rescate vacío no bloquea un lote normal y viceversa.

## Flujo

`orden de lote → preflight read-only → informar advertencias → iniciar si canStart=true → flujo R32 normal`

El comando privado de consulta es `MLS preflight`.
