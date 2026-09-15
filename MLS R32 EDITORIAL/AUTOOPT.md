# MLS AUTOOPT 1.0

Implementación sobre main `88510f414a93a991ec6357cc24c84c833ab1abcc`.
La inspección previa está en `AUTOOPT arquitectura.md`.

AUTOOPT observa el trabajo de ChatGPT y devuelve asesoramiento operativo.
No redacta, no llama modelos, no inicia/continúa lotes, no cambia N ni FIFO,
no sustituye deferred, no resuelve needs_review, no materializa ni regenera.
El contrato, las referencias, el profile y R32 siguen siendo autoridad.
No cambia el validador ni la condición de publicación/no sobrescritura.

## Integración y configuración

`autoopt.js` se ensambla mediante `scripts/habilitar chat editorial.js`.
No editar el `src/index.js` generado. La integración aditiva incluye:

| Action | Comportamiento AUTOOPT |
| --- | --- |
| iniciarLoteMLS | Conserva requestId, selección y reservas originales. |
| siguienteContextoMLS | Lee un agregado familiar; añade autoopt en la raíz de la respuesta. Recalcula la síntesis incluso si el contexto editorial ya estaba guardado. |
| validarBorradorMLS | Invoca el mismo mlsChatValidateText; guarda resultado e incidencias/borrador en una transacción. |
| publicarBorradorMLS | Revalida como antes; añade el evento al mismo batch que publica o preserva. |
| estadoMLS | Añade métricas observadas del run actual. |
| cancelarLoteMLS | Sin cambios operativos; no continúa trabajo. |

La entrega inicial dejaba `AUTOOPT_ENABLED="false"`. Tras la autorización
explícita de activación, ambos wrangler.jsonc incluyen `AUTOOPT_ENABLED="true"`,
incluido el overlay que predeploy copia. Solo `true` booleano o cadena exacta `"true"` activan.
Desactivado: no DDL, lecturas, eventos ni campos AUTOOPT; se usa íntegramente
la validación anterior. Los datos aprendidos se conservan. Reactivar permite
reutilizarlos. La idempotencia mejorada de fallos solo rige estando activado.
Para una cohorte estadística limpia, activar antes de iniciar nuevos runs:
no se reconstruye ni inventa historial anterior a la activación.

## Almacenamiento y atomicidad

`AUTOOPT schema.sql` es una migración aditiva e idempotente, generada con:

```sh
node 'scripts/autoopt admin.cjs' schema
```

No añade bindings, proveedores, bases de datos ni migraciones de Durable
Objects. El módulo crea automáticamente el esquema al primer uso habilitado,
con una promesa compartida por binding/isolate. Si falla, un reintento puede
repetirlo; no se marca instalado prematuramente.

| Objeto | Contenido |
| --- | --- |
| wiki_autoopt_events | id PK, token de transacción, version, prompt, run_id, context_id, code, family, family_key, kind, draft_id, data JSON, response JSON, created_at. |
| wiki_autoopt_stats | PK(version,prompt,scope,scope_id), family, stats JSON, updated_at. |
| wiki_autoopt_accumulate | Trigger AFTER INSERT: inicializa/actualiza tres agregados, global, familiar y del run. |
| Índices | context_id/kind, draft_id/kind y created_at para lecturas puntuales y retención. |

`kind`: validation, published, preserved, deferred, needs_review,
publication_failure. data incluye palabras, secciones ####, referencias
entregadas, mínimo/objetivo estimados, mínimo observado ante fallo de
longitud insuficiente, bucket de longitud, flags de tablas/listas/ejemplos,
categoría/errorCodes normalizados, valid y attempt. Un reintento diferente
puede añadir transformation (expanded, shortened, restructured o revised)
y previousCategory; son inferencias de features, no diagnósticos lingüísticos.
Las publicaciones incluyen elapsedMs desde la primera validación observada.

No se almacena Markdown, review, prompts completos ni headers en AUTOOPT.
Los originales siguen únicamente en las tablas editoriales existentes.
response conserva el recibo compacto de validación o mensaje determinista
del validador para devolver exactamente el resultado en reintentos.
No se guardan errores de infraestructura, Secrets ni claves en observaciones.
Errores de contrato previos a obtener un contexto válido (401/404/409,
JSON inválido) no son intentos editoriales atribuibles y no entrenan familias.

La actualización incremental se hace en SQL, sin ciclos read/modify/write
de contadores en JavaScript. El INSERT de evento y las escrituras editoriales
pertenecen al mismo batch D1: se confirman o revierten juntos. El trigger solo
se ejecuta cuando se inserta un evento nuevo. Véase la garantía transaccional
oficial de [D1 batch](https://developers.cloudflare.com/d1/worker-api/d1-database/).

## Idempotencia y concurrencia

Validación: SHA256 del array canónico [runId, contextId, code, Markdown,
referenceCodes únicos ordenados, editorialReview]. El orden de propiedades
JSON y de referencias no crea otro intento. Un cambio de texto o de revisión
sí constituye otra solicitud editorial; enviar el mismo fallo tres veces
no equivale a tres revisiones. Se conserva el requestId de inicio existente.
El borrador mantiene el SHA256 original de run/contexto/Markdown normalizado.

El número de intento se calcula dentro del INSERT transaccional a partir de
las observaciones del contexto. Un token UUID interno condiciona las
escrituras editoriales al INSERT ganador; dos requests concurrentes iguales
no duplican incidencias ni drafts. Una cancelación/deferred que gane la carrera
impide el nuevo evento mediante guardas SQL. Los replays ya confirmados pueden
recuperar el recibo aunque el lote se haya completado; no publican nada.

Publicación: clave publication:runId:code, y verificación de audit_model del
borrador. Se registra éxito solo si ese artículo pertenece al borrador. Un
artículo externo produce preserved, nunca crédito editorial. El reintento de
un draft ya publicado usa el recibo existente y no genera otro evento.
Tres rechazos distintos mantienen la transición original a deferred o, en
rescate, needs_review; el evento terminal copia los features y el intento.
No se abre ninguna entrada sustituta. Las reservas y el orden original no
se modificaron.

publicationFailures cuenta borradores distintos con fallo de publicación,
no cada timeout repetido. Su registro es best effort si D1 está caído; nunca
oculta ni reemplaza el error original. Una publicación ya confirmada no se
marca fallida por un timeout posterior. No se promete medir fallos que una
base completamente inaccesible no puede almacenar.

## Familias, versiones y estadísticas

Heurística determinista: normalizar acentos/mayúsculas y buscar patrones del
título; si no hay coincidencias, usar capítulo y parte. Una sola coincidencia
elige familia; varias o ninguna devuelven unknown. No inspecciona el cuerpo
ni la semilla para inferir una regla, y no llama IA. Las doce familias son:

norma_variacion, conjugacion_verbal, pronombres_regimen, concordancia,
subordinacion, modalidad_pragmatica, variedad_guatemalteca,
escritura_academica, ortografia_morfologia, lexico_construcciones,
discurso_cohesion y unknown.

La clave familiar añade idioma y nivel. El agregado global resume todas las
familias; next usa solo la familia/idioma/nivel de la versión actual.
Todas las filas tienen autooptVersion 1.0 y promptVersion, sin mezclar 32.0
con futuras versiones. La integración editorial sigue bloqueada a R32/32.0
como antes: AUTOOPT no autoriza actualizar el estándar. Una nueva semántica
de agregación debe migrar explícitamente el trigger/versionado, no reutilizar
silenciosamente el esquema 1.0.

Contadores: validationAttempts, validationFailures, successfulFirstPass,
firstAttempts, published, publicationsWithAttemptHistory, firstPassPublished,
attemptsForPublished, preservedExisting, deferred, needsReview,
publicationFailures, lengthFailures, r32FalsePositiveLikeFailures,
ruleFailures, markdownFailures, contractFailures, otherFailures y
consecutiveFirstPassSuccesses. Sumas: wordsSuccessful, sectionsSuccessful,
referencesSuccessful y elapsedMsSuccessful; mínimo/máximo exitosos;
learnedMinimum y flags estructurales exitosos.

Cinco buckets: <300, 300–599, 600–999, 1000–1599, >=1600 palabras. Cada uno
conserva Attempts, Valid y Published. Permiten comparar tasa de validación
por rango sin recopilar artículos. Son evidencia descriptiva, no prueba de
que la longitud cause aprobación. Los patrones de encabezados no se copian:
se recomiendan conteos solo con tres publicaciones y limitados por profile;
tablas/listas/ejemplos se expresan como tasas, no plantillas obligatorias.

Fórmulas para inspección:

* First-pass de validación = successfulFirstPass / firstAttempts.
* Porcentaje de publicaciones al primer intento = firstPassPublished / published.
* Intentos de artículos publicados = attemptsForPublished / publicationsWithAttemptHistory.
* Carga total = validationAttempts / published (incluye intentos que terminaron deferred).
* Longitud media exitosa = wordsSuccessful / published.
* Secciones/referencias típicas = sus sumas / published.
* Tasa del bucket = bucketNValid / bucketNAttempts; soporte publicado = bucketNPublished.

Las métricas son observaciones desde activación/reset; no un backfill de
artículos históricos. Un draft validado antes de activar puede publicarse
con intento desconocido (0); se excluye del promedio de intentos conocidos.
La duración incluye pausas del chat y no mide tiempo puro del modelo.
Para medir throughput por periodo, tomar snapshots de contadores y tiempos
con condiciones comparables; no interpretar first-pass como precisión
lingüística garantizada. Las clasificaciones R32 indican sospecha operativa,
no un falso positivo demostrado. No hay señal fiable de semillas defectuosas
en el validador actual: no se inventa esa estadística ni un diagnóstico.

## Recomendación de longitud

El mínimo vigente es el contractual y el del corpus (floor(profile.words.min
* 0.5)); el máximo del corpus es ceil(profile.words.max * 1.8), acotado por un
maximumWords contractual si existiera. El contrato actual no define ese
máximo; targetWords son objetivos orientativos, no el límite duro del corpus.
El límite de 16000 caracteres de la Action sigue intacto.

Se eleva el mínimo asesorado usando fallos de longitud insuficiente, limitado
por el máximo vigente. Margen base 8%; los fallos de longitud añaden hasta
4 puntos porcentuales según su tasa. Si el menor artículo exitoso está muy
por encima del mínimo, el exceso se reduce como 1/(1+publicaciones), con piso
0.1. Se toma el mayor entre mínimo con margen y mínimo más exceso residual;
no se suman ambos márgenes. El máximo recomendado añade 10%, sin exceder
el límite vigente. Publicaciones válidas más cortas pueden reducir un mínimo
histórico elevado por otro profile, respetando el mínimo actual. Si los
requisitos contractuales son incompatibles, recommendedWordRange=null y se
explica el conflicto; nunca se relaja R32 para resolverlo.

confidence = publicaciones/(publicaciones+8), soporte de evidencia y no
probabilidad calibrada de aprobación. Sin historial se devuelve
history=insufficient, confidence=0 y tasas desconocidas=null. Así ChatGPT
recibe asesoramiento básico explícitamente sin fingir aprendizaje previo.
Las referencias y el profile tienen prioridad sobre toda sugerencia.

## Ejemplo ejecutado en pruebas

Fixture sintético para ejercitar longitud, usando el validador R32 real:
no se presenta como un artículo lingüísticamente revisado ni publicación de
producción. La primera entrada tiene mínimo de referencia 1158, por tanto
mínimo coherente 579.

1. Intento 1: 526 palabras → 422; lengthFailures=1, learnedMinimum=579.
2. next del mismo contexto: rango 579/649/714, patrón length.
3. Intento 2: 640 palabras → valid=true; transformation=expanded, attempt=2.
4. Publicar ese draft → published=1, minimumSuccessful=640,
   attemptsForPublished=2, firstPassPublished=0.
5. next de la siguiente entrada de esa familia: objeto exacto siguiente.

```json
{
  "version": "1.0",
  "promptVersion": "32.0",
  "family": "ortografia_morfologia",
  "history": "observed",
  "confidence": 0.111,
  "observations": 2,
  "publications": 1,
  "recommendedWordRange": {"min": 579, "target": 637, "max": 701},
  "maximumCharacters": 16000,
  "firstPassSuccessRate": 0,
  "historicalAttemptsPerPublish": 2,
  "deferredRate": 0,
  "r32Risk": "low",
  "knownFailurePatterns": ["length"],
  "recommendations": [
    "Mantener tono enciclopédico; referencias, profile y contrato tienen prioridad.",
    "Preservar variantes legítimas y voseo cuando sea pertinente; no imponer tuteo ni añadir voseo artificialmente.",
    "Respetar el mínimo actual del corpus con un pequeño margen; ampliar explicación lingüística, sin relleno."
  ]
}
```

Con tres éxitos se añaden preferredSectionCount cuando el profile permite
calcularlo y successfulStructure con tablesRate, listsRate y examplesRate.
No se devuelven observaciones individuales ni cientos de filas históricas.

## Retención, reset y mantenimiento

En cada validación nueva se purgan hasta 100 recibos de runs cerrados de más
de 90 días y hasta 100 agregados de runs cerrados antiguos. Los agregados
globales/familiares conservan solo contadores fijos. La limpieza no usa timers
ni cron. Puede ejecutarse también manualmente. Runs activos conservan sus
recibos para no perder idempotencia: un run abandonado debe cancelarse mediante
el flujo editorial autorizado si se desea que expire. AUTOOPT nunca cancela
runs. Tras expirar recibos, validar un run cerrado es rechazado; publicar un
draft antiguo usa la lógica original del artículo, sin sumar otra vez.

Tooling administrativo local, sin endpoints nuevos ni permisos públicos:

```sh
node 'scripts/autoopt admin.cjs' inspect > 'AUTOOPT consulta.sql'
node 'scripts/autoopt admin.cjs' reset all > 'AUTOOPT reset.sql'
node 'scripts/autoopt admin.cjs' reset global > 'AUTOOPT reset.sql'
node 'scripts/autoopt admin.cjs' reset family conjugacion_verbal > 'AUTOOPT reset.sql'
node 'scripts/autoopt admin.cjs' reset prompt 32.0 > 'AUTOOPT reset.sql'
node 'scripts/autoopt admin.cjs' prune > 'AUTOOPT limpieza.sql'
```

Estos comandos SOLO imprimen SQL. Revisar el archivo y ejecutar con el acceso
D1 administrativo existente, por ejemplo:

```sh
npx wrangler d1 execute WIKI_DB --remote --file 'AUTOOPT consulta.sql'
```

El repositorio contiene binding WIKI_DB, no un database_id de producción;
usar la configuración autenticada existente. No inventar IDs ni reemplazar
Secrets. Para ensayos utilizar --local. Nunca mandar SQL de reset a una Action.

reset all borra únicamente agregados AUTOOPT; global solo el scope global;
family solo sus agregados familiares (todos los idiomas/niveles/versiones);
prompt todos los agregados de esa versión. No borran recibos: repetir una
llamada anterior al reset no reconstruye estadísticas borradas. Un reset
parcial no resta retrospectivamente datos de otros scopes; es intencional.
No elimina ni actualiza artículos, runs, drafts, contextos o incidencias.

## Pruebas, benchmark y despliegue

Las pruebas se integran en `test/chat-editorial.test.cjs`, con node:test,
node:sqlite y los validadores/fixtures reales existentes. Hay cobertura de los
15 escenarios solicitados, además de reset, retención, rollback de eventos,
flag apagado, estructura, métricas, publicación fallida y benchmark. Una prueba
usa Miniflare/workerd y D1 reales locales, reinicia el runtime conservando la
base en disco, prueba requests concurrentes y rollback. No accede a producción.
El binario local disponible admite fecha 2026-08-18; solo ese test usa esa
fecha. La configuración de despliegue conserva 2026-09-08.

Benchmark fijo de dos publicaciones, cuatro llamadas de validación (incluye
un fallo repetido idéntico), excluido bootstrap de esquema:

| Medida | Antes | AUTOOPT |
| --- | ---: | ---: |
| Llamadas validar | 4 | 4 |
| Intentos contabilizados | 4 | 3 |
| Intentos por publicación | 2 | 1.5 |
| Publicaciones first-pass | 50% | 50% |
| Palabras medias | 487 | 487 |
| Sentencias D1 desde el cliente | 164 | 188 |
| Viajes API D1 (batch cuenta uno) | 68 | 75 |

No es evidencia de mejora de redacción ni latencia: la diferencia de intentos
es deduplicación, y el mismo contenido se publica en ambos casos. El trigger
además actualiza tres agregados por evento; sus escrituras internas no están
incluidas en el contador de sentencias cliente. next añade una lectura
indexada, sin escanear corpus. El bootstrap añade seis sentencias una vez por
binding/isolate. La instrumentación permite medir mejoras posteriores sin
inventarlas. No hay costo de inferencia adicional; sí uso adicional de D1,
que debe observarse dentro de las cuotas existentes.

Validación de entrega:

```sh
npm run test:chat-editorial
node --check 'MLS R32 EDITORIAL/autoopt.js'
node --check 'MLS R32 EDITORIAL/chat workflow.js'
node --check 'scripts/autoopt admin.cjs'
npm run predeploy
npm run check
node_modules/.bin/tsc --noEmit
git diff --check
```

No existe script lint. checkJs está desactivado en el tsconfig original;
por ello tsc comprueba las fuentes TS reconstruidas, mientras los módulos
nuevos JS se verifican con parseo, build y pruebas de ejecución. predeploy
reconstruye src/public; sus salidas no forman parte del cambio de fuentes.
No ejecutar npm run deploy como simple prueba: despliega realmente. Para la
activación autorizada se cambió a `wrangler deploy --keep-vars`: conserva las
variables remotas no declaradas y ya no ejecuta limpieza de colas, escritura
de Secrets ni importación de lotes. Los comandos administrativos independientes
de importación y limpieza siguen existiendo, pero no se invocan al desplegar.

Despliegue de revisión:

1. Revisar/mergear el cambio y ejecutar las pruebas en el checkout limpio.
2. Mantener AUTOOPT_ENABLED=false y construir con npm run predeploy/check.
3. Desplegar mediante el proceso existente autorizado. La migración puede
   preaplicarse con el archivo SQL o dejarse al primer request habilitado.
4. Activar AUTOOPT_ENABLED=true en el overlay/configuración que controla el
   despliegue; reconstruir/desplegar sin modificar Secrets ni importar artículos.
5. Actualizar en el GPT privado el esquema y las instrucciones aditivas si se
   administran como copia, aunque las Actions antiguas siguen siendo compatibles.
6. En un run solicitado por el usuario, comprobar autoopt en next/estado;
   tras una validación nueva sube validationAttempts; su repetición no lo cambia;
   solo publicar confirmado incrementa published y actualiza el perfil familiar.

Rollback inmediato: AUTOOPT_ENABLED=false, sin borrar datos. Ante un problema
de esquema habilitado se responde error y se revierte el batch; no se publica
sin observación silenciosamente. Desactivar restaura el camino editorial previo.
También puede desplegarse el commit anterior: ignora las tablas adicionales.
No es necesario ejecutar DROP ni hacer una migración destructiva.

Limitaciones: las heurísticas pueden abstenerse con unknown; las observaciones
no certifican calidad lingüística; un flag cambiado a mitad de run no permite
reconstruir intentos previos; una indisponibilidad completa de D1 impide contar
fallos de infraestructura. No se ha probado ni afirmado rendimiento en producción.

Resultado de la verificación de entrega: 33/33 pruebas (17 originales y 16
nuevas), parseo JS correcto, predeploy correcto, wrangler deploy --dry-run
correcto y tsc --noEmit sin errores. No se ejecutó despliegue remoto, reset
remoto, importación editorial ni modificación de Secrets.

Archivos modificados: `chat workflow.js`, `chat openapi.json`,
`GPT privado instrucciones.md`, `scripts/habilitar chat editorial.js`,
`test/chat-editorial.test.cjs`, `wrangler.jsonc` y
`MLS R32 OVERLAY/wrangler.jsonc`.
Archivos nuevos: `autoopt.js`, `AUTOOPT schema.sql`, `AUTOOPT arquitectura.md`,
este `AUTOOPT.md` (los cuatro en MLS R32 EDITORIAL), y
`scripts/autoopt admin.cjs`.

## Verificar activación sin publicar contenido

El endpoint público `/api/wiki/editorial/chat/openapi.json` devuelve los headers
`x-mls-autoopt-enabled` y `x-mls-autoopt-version`, calculados del entorno real.
Solo revelan flag y versión, sin historial ni información privada; no inicializa
tablas ni valida/publica artículos. `true` y `1.0` confirman que el Worker servido
tiene AUTOOPT activo. La creación aditiva del esquema ocurre en la primera
Action autenticada. El cambio de activación también modifica package.json para
que Cloudflare Builds despliegue sin efectos editoriales secundarios.

Validación de activación: 34/34 pruebas, incluido el diagnóstico público sin
acceso a almacenamiento; build con AUTOOPT_ENABLED=true y typecheck correctos.
