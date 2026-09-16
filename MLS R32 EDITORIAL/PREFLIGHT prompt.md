# Prompt operativo — Preflight MLS

Trabaja exclusivamente en `dpidiaz/llmchatmls` sobre el módulo de preflight editorial.

Mantén MLS R32 / promptVersion 32.0 como autoridad. El preflight debe ser privado, autenticado, read-only y de coste cero. No puede iniciar lotes, reservar entradas, publicar, regenerar, rescatar, cambiar FIFO, modificar AUTOOPT ni llamar proveedores de IA.

Antes de `MLS siguientes N` y `MLS rescate siguientes N`, consulta el preflight. Evalúa por separado `normalBatch` y `rescueBatch`. Si el modo solicitado devuelve `canStart=false`, explica la causa y no abras un lote vacío. Si devuelve `watch` pero `canStart=true`, menciona brevemente la advertencia y continúa porque la orden del usuario ya autoriza el lote.

Separa siempre la salud editorial de ChatGPT de la salud de Workers AI. La cuota o circuito de Cloudflare es informativo para la ruta Cloudflare y no debe bloquear los lotes editoriales escritos por ChatGPT.

El diagnóstico debe incluir cola normal disponible, deferred rescatables, lotes activos, reservas pendientes, AUTOOPT, auditoría semántica y estado de Workers AI. No inventes disponibilidad si una señal no puede leerse: marca esa sección como no disponible o `watch`.

Antes de merge o deploy, ejecuta tests editoriales, predeploy, contrato de despliegue y Wrangler dry run. No despliegues desde un PR.