# Panel de salud AUTOOPT

El panel de salud es un diagnóstico privado y de solo lectura para MLS AUTOOPT 1.0.
No genera artículos, no inicia ni continúa lotes, no publica, no modifica FIFO, no rescata deferred, no cambia R32 y no modifica configuración alguna.

## Acceso

Vista móvil:

`https://llmchatmls.dpidiaz.workers.dev/autoopt.html`

La página pide la misma clave privada `MLS_EDITORIAL_CHAT_KEY` del flujo Chat Editorial. La clave se mantiene únicamente en memoria de la página; no se guarda en `localStorage` ni se devuelve en las respuestas.

Endpoint JSON privado:

`GET /api/wiki/editorial/chat/autoopt/health`

Autenticación: `Authorization: Bearer <MLS_EDITORIAL_CHAT_KEY>`.

## Fuentes

El panel reutiliza exclusivamente `wiki_autoopt_events`, `wiki_autoopt_stats`, `wiki_autoopt_history_batches`, `wiki_autoopt_history_items` y `wiki_autoopt_history_stats`. No necesita migraciones nuevas ni duplica métricas.

La evidencia viva y la evidencia histórica se presentan por separado. El historial nunca fabrica `firstPassSuccessRate` ni `attemptsPerPublication`: ambos permanecen `null` porque esas tasas no pueden reconstruirse de forma fiable a partir de los datos históricos.

Las agrupaciones vivas parten de `family_key = idioma:nivel:familia`. Las vistas por familia y nivel conservan siempre el idioma como parte de su clave; por tanto una familia inglesa no recibe conclusiones lingüísticas de español ni de otro idioma.

## Alertas

Las alertas son diagnósticas y nunca detienen ni alteran publicaciones.

* `evidencia insuficiente`: menos de 8 primeros intentos y menos de 5 publicaciones vivas, salvo que exista una señal concreta de `needs_review`.
* `vigilar`: existe `needs_review`, o con muestra suficiente aparece deferred >= 15 % con al menos 2 casos, rechazos R32 >= 30 % con al menos 10 validaciones, o tasa de primer intento < 70 % con al menos 10 primeros intentos.
* `estable`: hay muestra suficiente y ninguna de las señales anteriores está presente.

No son certificaciones lingüísticas ni decisiones automáticas. Las recomendaciones de AUTOOPT continúan subordinadas al contrato, las referencias publicadas, el profile y R32.

## Privacidad y fail open

El endpoint devuelve únicamente agregados y metadatos operativos permitidos. No expone Markdown, prompts completos, artículos, tokens de modelo, secretos, headers, revisiones editoriales ni datos personales.

Si faltan las tablas históricas o una consulta diagnóstica falla, el panel marca el resultado como parcial. Esa falla no participa en `validarBorradorMLS`, `publicarBorradorMLS`, `MLS siguientes N`, rescates ni materialización.
