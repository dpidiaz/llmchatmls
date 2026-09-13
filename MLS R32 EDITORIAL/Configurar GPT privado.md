# MLS Editorial en ChatGPT, sin Work

El GPT redacta; el servidor conserva el lote, aplica los validadores originales R32 y publica el borrador aprobado en D1. No usa proveedores externos de IA ni necesita un despliegue por cada artículo. El flujo anterior de importación por GitHub sigue disponible.

## Configuración inicial

1. En Cloudflare, Worker `llmchatmls`, añade un **Secret** llamado `MLS_EDITORIAL_CHAT_KEY` con una clave aleatoria de al menos 32 caracteres y despliega el Secret. No uses una contraseña personal ni una clave de OpenAI. No guardes esta clave en GitHub ni en una conversación.
2. En ChatGPT, crea un GPT privado llamado **MLS Editorial**. Descripción: «Redacta, calibra, valida y publica lotes FIFO de MASTER LANGUAGE SYSTEM R32».
3. En Instrucciones, pega `GPT privado instrucciones.md`, disponible también en:
   `https://llmchatmls.dpidiaz.workers.dev/api/wiki/editorial/chat/instructions`
4. Activa la búsqueda web para verificar dudas lingüísticas. Work, intérprete de código y generación de imágenes no son necesarios.
5. Añade una Action e importa el esquema desde:
   `https://llmchatmls.dpidiaz.workers.dev/api/wiki/editorial/chat/openapi.json`
6. En autenticación de la Action elige **API Key → Bearer** y pega la misma clave de Cloudflare. Esta clave concede acceso editorial a la enciclopedia: conserva el GPT como **Solo yo**.
7. Guarda y prueba **MLS estado**. Debe devolver la versión 32.0 y el estado del lote, o indicar que no hay uno activo. Este ensayo no publica entradas.

## Comandos

- `MLS siguientes 10`
- `MLS siguientes 30`
- `MLS siguientes 50`
- `MLS siguientes 100`
- `MLS continuar`
- `MLS estado`
- `MLS cancelar`

Cada solicitud selecciona como máximo N pendientes reales en FIFO; omite las que ya estaban publicadas. Solo existe un lote activo. Una solicitud nueva no amplía silenciosamente un lote anterior. El mismo requestId recupera la misma solicitud incluso después de completarla.

El texto se redacta y envía una entrada por vez. El servidor entrega la semilla y las referencias, conserva el contexto exacto, valida el borrador y permite publicar únicamente ese borrador guardado. Los metadatos se toman de la semilla, no de valores escritos libremente por ChatGPT. La revisión lingüística la realiza ChatGPT; la validación automática comprueba el contrato y el formato, no certifica la verdad lingüística.

Si el chat agota sus límites o se interrumpe, usa `MLS continuar` en este mismo GPT. El contador se conserva en D1. No se garantiza terminar 100 artículos en una sola respuesta y no hay generación autónoma cuando el chat se detiene. Si otra visita materializa una entrada seleccionada, se conserva y se informa por separado; no se agrega una sustituta fuera del lote.

## Continuar la conversación

Abre **MLS Editorial**, no un chat genérico sin Actions. Puedes iniciar con: «Retomamos MLS R32. Consulta MLS estado y continúa el lote activo; si no existe, espera mi instrucción MLS siguientes N». La continuidad editorial depende del servidor, no de que ChatGPT recuerde esta conversación de Work.

## Verificación y mantenimiento

- Prueba local: `npm run test:chat-editorial` (Node 24; si el entorno restringe subprocesos, usar `node --test --test-isolation=none test/chat-editorial.test.cjs`).
- Las pruebas usan SQLite en memoria: no publican artículos reales.
- El instalador extrae las funciones de validación del importador existente y el contrato canónico en cada despliegue.
- Sin el Secret, la API editorial devuelve 503. Con clave incorrecta, 401. Nunca se habilitan escrituras anónimas.
- No pongas la clave en la URL, instrucciones, esquema o cuerpo del artículo. Para revocar el acceso, cambia o elimina el Secret y actualiza la autenticación del GPT.

Fuentes: https://developers.openai.com/api/docs/actions/introduction ; https://developers.openai.com/api/docs/actions/authentication ; https://developers.openai.com/api/docs/actions/production
