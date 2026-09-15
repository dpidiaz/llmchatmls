# MLS AUTOOPT: inspección previa

Base inspeccionada: `88510f414a93a991ec6357cc24c84c833ab1abcc` (main).

Las seis Actions se definen en `chat openapi.json` y se resuelven en
`chat workflow.js`: mlsChatStart, mlsChatNext, mlsChatValidate,
mlsChatPublish, y las ramas status/cancel de handleMlsChat.
`scripts/habilitar chat editorial.js` ensambla estas fuentes durante predeploy;
`src/index.js` es reconstruido y no es la fuente que debe editarse.

D1 WIKI_DB conserva wiki_chat_runs (request_id UNIQUE), wiki_chat_items
(reserva parcial UNIQUE por código pendiente y posición FIFO),
wiki_chat_contexts (contexto inmutable por run/código), wiki_chat_drafts
(SHA256 de run/contexto/Markdown válido), wiki_chat_incidents,
wiki_chat_run_meta y wiki_chat_rescue_claims. wiki_articles conserva el
Markdown y audit_model identifica el borrador publicado; INSERT con
ON CONFLICT DO NOTHING y guardas transaccionales impiden sobrescrituras.
Tres rechazos llevan a deferred en un run normal y a needs_review en rescate.
Antes de AUTOOPT, los fallos de validación repetidos no son idempotentes.

mlsChatValidateText reutiliza validateCalibration/validateArticle del
importador y basicArticleValidation del overlay; publicación revalida.
El contrato y runtime fijan promptVersion 32.0. El contexto obtiene seis
referencias completas, reducidas si exceden el presupuesto de Actions, y
perfil de extensión/encabezados. El mínimo del corpus es floor(min*0.5),
el máximo ceil(max*1.8); targetWords del contrato es orientativo cuando
rige el corpus. No debe confundirse con un máximo contractual obligatorio.

WikiStore es un Durable Object SQLite para la coordinación y presupuesto
Workers AI; la generación por visita y sus límites FREE están fuera de
las Actions de redacción. AUTOOPT no modifica esos caminos, bindings ni Secrets.
No se encontró KV ni R2 como persistencia del flujo Chat Editorial.

Baseline: npm run test:chat-editorial, 17/17 pruebas, antes de modificar código.
Los fixtures verifican flujo pero no simulan decisiones de un redactor:
no permiten demostrar una mejora causal de throughput ni de calidad.

Decisión: tablas AUTOOPT separadas en el mismo D1, trigger de agregación
tras INSERT de evento, y evento dentro del batch editorial. Así un fallo
revierte conjuntamente el resultado y su observación. Consultas next solo
leen un agregado familiar; el estado operativo/FIFO sigue siendo autoridad.
Flag apagado por defecto; sin flag no se crean ni consultan tablas AUTOOPT.
