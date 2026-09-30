# MLS BCR siguiente — contrato R4.2

Este documento define exclusivamente el comando **`MLS BCR siguiente`** para
R4.2. Ya no comparte routing con Snapshot Farm R4.3.

R4.3 usa un comando distinto y deliberadamente incompatible:

**`MLS R43 siguiente`**

Su contrato está en `docs/MLS Global Dispatcher/22 R4.3 Worker Command.md`.

Un chat que recibe `MLS BCR siguiente` no debe buscar, reclamar ni producir una
Wave R4.3. Un chat que recibe `MLS R43 siguiente` no debe caer a R4.2.

## Autoridad, alcance y admisión

GitHub es el canon. Antes de actuar, leer el Dispatcher, el único ledger abierto
`[MLS Dispatcher Ledger]`, las reservas y sus ramas. No reconstruir ownership de
memoria. El Scheduler continúa excluyendo los terminales, recoveries, reservas y
leases del circuito anterior al crear nuevas reservas. Un inventario truncado,
ledger duplicado o corrupto detiene la adjudicación.

**Ruta R4.2.** El chat abre un Issue OWNER/MEMBER/COLLABORATOR con título
`[MLS Dispatcher][BCR][REQUEST] <nonce>` y este marcador:

```text
<!-- MLS_BCR_ELASTIC_COMMAND
{"kind":"mls_bcr_elastic_command","version":1,"action":"next","requestId":"bcr-<nonce-unico-de-este-intento>"}
-->
```

Conservar el mismo requestId al recuperar un envío incierto. No crear varias
solicitudes para el mismo intento. La respuesta será un claim, su recibo anterior,
una tarea técnica automática pendiente, STALE o CAPACITY_BUSY. Las solicitudes
sin atender durante dos minutos no reciben trabajo a escondidas. Un chat detiene
el bucle si no recibió lease. Cuando un trabajo termina correctamente y este mismo
chat todavía puede trabajar, aplica la continuación intrachat descrita abajo,
sin esperar otro mensaje del usuario.

Prioridad: reconciliar completions/heartbeats; preservar y recuperar leases
vencidos; Gate de reservas consolidadas; corrección/revisión selectiva; sellado y
sync; recuperar bloques de producción; bloques nuevos; reserva nueva de 25.
Se ejecuta como máximo un Gate y se inspeccionan hasta **50 solicitudes NEXT por tick**. Una ráfaga lógica apunta a **50 trabajadores**, atendidos mediante microciclos serializados: como máximo **15 leases nuevos por ejecución física** (incluidas hasta dos reparaciones), con un máximo de tres reservas nuevas de 25 entradas. No se fuerzan 50 escrituras GitHub simultáneas. Los tickets sobrantes permanecen REQUEST, en orden FIFO y sujetos al límite vigente de dos minutos: no se convierten silenciosamente en leases sin un chat vivo. Tras un ciclo que adjudicó leases y dejó cola, el Scheduler solicita otra ejecución serializada mediante workflow_dispatch. La reparación de una reserva no bloquea globalmente a las demás. Las
recuperaciones R4 anteriores conservan sus locks y su propio proveedor; no se
convierten ni se certifican como BCR por inferencia.

## Continuación automática R4.2 en el mismo chat (multi-pull)

`MLS BCR siguiente` inicia un **bucle de producción R4.2 dentro de la misma
 ejecución del chat**, no únicamente un bloque.

Tras recibir un `LEASED` válido:

1. Procesar únicamente el claim vigente; hacer checkpoints reales, comprobar el
   HEAD remoto, renovar antes de que expire y enviar el `COMPLETE` correspondiente.
2. Esperar y leer el Issue `COMPLETE` hasta recibir `COMPLETED` confirmado por
   el Dispatcher; también vale la repetición inequívoca de un `DONE` ya confirmado.
   No interpretar un Issue `COMPLETE` abierto ni un commit local como éxito.
3. **Si el mismo chat continúa activo y puede razonablemente completar otro
   bloque**, crear por sí mismo un NUEVO Issue autorizado
   `[MLS Dispatcher][BCR][REQUEST] <nonce-nuevo>` con un
   `requestId` diferente y `action:"next"`; esperar su lease y repetir el ciclo.
   No pedir `MLS BCR siguiente` nuevamente al usuario en ese mismo turno.
4. Continuar hasta que el chat esté próximo a sus límites, no haya trabajo
   adjudicable, la solicitud caduque, se alcance `CAPACITY_BUSY`, el cooldown
   403/429 esté activo o exista un resultado técnico que impida continuar.
   Ante incertidumbre sobre `COMPLETE`, reconciliar el recibo original usando
   su mismo identificador; **nunca** pedir otro claim antes de confirmar DONE.

**Una sesión posee como máximo un lease activo.** No anticipar NEXT, no crear
solicitudes masivas por adelantado, no adjudicar al bot en nombre de un chat que
ya terminó y no arrancar otra conversación automáticamente. Este bucle solamente
opera mientras ChatGPT siga ejecutando el turno presente; si termina por sus
propios límites, los checkpoints y reservas guardados permanecen en GitHub y
la recuperación es responsabilidad del Dispatcher. No existe trabajo en segundo
plano ni continuación garantizada después de cerrar la respuesta.

## Dos clases de claim; mismo comando

Leer `MLS_BCR_ELASTIC_CLAIM` y cotejarlo con la reserva viva. Un claim de producción
usa block 1..5 y el contrato de once archivos del documento 18. Un claim con
`task:"repair", block:0` incluye hasta cinco códigos con errores reales del Gate,
la rama generacional, outputPrefix, el buffer original por SHA y las correcciones
previas por SHA. Consultar los artículos canónicos y las fuentes realmente.

La reparación escribe únicamente estos tres archivos por código asignado:

```text
<outputPrefix>/entries/<CODE>.json
<outputPrefix>/checkpoints/<CODE>.json
<outputPrefix>/reviews/<CODE>.json
```

El checkpoint conserva el esquema R4.1, code, evidenceArtifactPath, allocationHash,
entrySha calculado sobre el JSON estable, claimedStatus y
assessment `PENDING_CANONICAL_R33_VALIDATION`. Se permiten commits parciales
entrada+checkpoint para recuperación. Añadir el informe de revisión al terminar
la consulta. No cambiar entradas correctas por conveniencia ni sobrescribir los
checkpoints originales. Las correcciones se referencian desde la reserva;
el sellador reconstruye un buffer efectivo desde esos objetos inmutables.

Formato de `reviews/<CODE>.json` (usar valores reales, nunca estos placeholders):

```json
{
  "schema": "MLS-BCR-SOURCE-REVIEW-1",
  "code": "<CODE>",
  "entryHash": "<SHA256 logico de la entrada final>",
  "reviewType": "ai",
  "humanReviewed": false,
  "claims": [{
    "claimId": "<claim canónico>",
    "linkId": "<EvidenceLink canónico>",
    "sourceId": "<Source Registry ID>",
    "locatorHash": "<SHA256 logico del locator>",
    "verdict": "supported",
    "sourceUrl": "<URL HTTPS consultada; igual al locator.url si existe>",
    "accessedAt": "<fecha ISO real de consulta>",
    "rationale": "Explicación específica de cómo el pasaje consultado sostiene la afirmación."
  }]
}
```

Cubrir cada afirmación sustancial una sola vez. La automatización comprueba
identidades, cobertura y registros; **no lee ni verifica semánticamente las
fuentes externas**. Un registro vacío, heredado o una etiqueta VERIFIED no
equivalen a revisión. Si la fuente no respalda la afirmación, corregirla y recalcular
las identidades R33; si no se puede resolver, conservar el checkpoint sin COMPLETE.

## Heartbeat, finalización y recuperación

TTL: cinco minutos desde la adjudicación/renovación confirmada. Verificar reserva,
epoch, expiresAt y HEAD antes de escribir. El chat envía internamente RENEW antes
de vencer y COMPLETE con el SHA remoto confirmado. Usar los mismos marcadores del
documento 18; en reparación añadir `task:"repair"` y `block:0`. No pedir estos
comandos técnicos al usuario. Cada mensaje tiene un requestId único.

El Scheduler acepta mensajes de renovación y finalización enviados antes del vencimiento con hasta diez minutos
de espera, siempre que el epoch aún pertenezca al claim. Una renovación repetida
no extiende otra vez el TTL. Un worker viejo no puede completar el lease nuevo.
Al vencer, se conserva la rama y su HEAD comprobado; el chat siguiente recibe una
rama nueva desde ese snapshot. El antiguo no tiene permiso de seguir escribiendo.
El reaper invalida ownership, nunca libera los códigos de la reserva por TTL.

Los claims se guardan en la reserva antes de crear la rama y publicar la respuesta.
Una respuesta perdida se recupera del recibo durable. La exclusión depende del
único escritor de reservas bajo `concurrency.group: mls-global-dispatcher`, compartido
con sync. GitHub Issues no ofrece una transacción multiobjeto: los pasos parciales
son recuperables y los cambios de refs usan fast-forward sin force y readback.
No ejecutar dos copias manuales del Scheduler fuera de ese mutex.

## Gate, sellado y sincronización automáticos

El Gate ejecuta `canonicalAssessment` R33 y `academic.inspect`, valida checkpoints,
chunks, Source Index y declaraciones de revisión por entrada. Publica un reporte
inmutable, incluso BLOCKED, en `r42-reports/<reserva>/<reportHash>.json` dentro de
la rama del buffer. La reserva conserva su ubicación/SHA y los códigos fallidos.
Un fallo de integridad global detiene el circuito; no habilita otro productor.

Después de corregir, Actions vuelve a ejecutar el Gate completo. Solo un PASS
real de 25/25 permite sellar; el sellador vuelve a ejecutar R33. Publica un único
bundle validado e inmutable en `r41/inbox/<reserva>`. Reutiliza la solicitud original
autorizada para SYNC y despacha `R4.1 Buffered Sync` automáticamente. No crea una
solicitud de autoridad ficticia como bot. El workflow revalida el Issue vivo.

SYNC usa el escritor único existente, validación y staging `r41/staged/<reserva>`.
El Dispatcher solo registra CERTIFIED_STAGED tras confirmar que el run terminó con
éxito, su identidad, el commit y la ausencia de colisiones. STAGED no es integración
en main ni despliegue. Los runs fallidos conservan QUARANTINED y el mismo paquete.
Los dispatches inciertos esperan quince minutos; máximo tres intentos automáticos.
Otro `MLS BCR siguiente` puede reabrir ese presupuesto después del backoff.

## Capacidad, coste y límites reales

**Techo activo R4.2-50:** hasta 50 leases BCR activos sobre al menos diez reservas independientes de 25 entradas (cinco bloques por reserva). En cada tick se examinan hasta 50 NEXT, se conceden hasta 15 leases y se crean como máximo tres reservas nuevas, con no más de dos solicitudes destinadas al mantenimiento. El escritor de GitHub Actions permanece serializado; los chats tienen ramas exclusivas. Esto no significa 50 escritores GitHub ilimitados ni garantiza 50 adjudicaciones instantáneas. Noventa chats son noventa solicitudes, no noventa leases. No se puede impedir que un
colaborador con permisos GitHub escriba por fuera del protocolo; las validaciones
rechazan contenido ajeno o ownership desplazado. Los leases heredados se conservan
y cuentan para no admitir otro chat BCR mientras estén activos.

Un RENEW/COMPLETE auténtico enviado antes del vencimiento protege su claim contra reap y reasignación durante hasta diez minutos de cola. El Dispatcher vuelve a programar otra ejecución serializada cuando avanzó en una cola de completions o renovaciones. La protección no extiende el TTL por sí sola ni adjudica trabajo a chats ausentes. Las solicitudes NEXT conservan la ventana estricta de dos minutos para evitar adjudicaciones ocultas a chats abandonados.

Ante 403/429 se detienen las llamadas de esa ejecución. El cooldown guarda
Retry-After, reset de cuota primaria y backoff exponencial con jitter (base un
minuto, componente exponencial máximo una hora). Actions conserva este pequeño
registro entre runs mediante cache. El buffer y la reserva no se borran. La cache
es una optimización de backoff, nunca autoridad editorial; su pérdida no autoriza
claims duplicados y puede ocasionar una nueva llamada que vuelva a fallar cerrada.
Los cron de GitHub pueden retrasarse: cinco minutos de TTL no promete reaping en
cinco minutos de reloj.

FREE ONLY: repositorio público y runner estándar `ubuntu-latest`, sin OpenAI API,
otras APIs de IA pagadas, Work, Cloudflare o despliegues. No introducir credenciales
privadas ni IDs de conversaciones. GitHub documenta los [runners estándar gratuitos
en repositorios públicos](https://docs.github.com/en/billing/concepts/product-billing/github-actions)
y permite [workflow_dispatch desde GITHUB_TOKEN](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows).

## Auditoría y adopción de #1881

Snapshot auditado: main `fd52083` y buffer
`bc261a392073dac31b3fdef4001cf2750add22e6`. El Issue #1881 dice
JOINED_AWAITING_CANONICAL_R33_GATE, cinco bloques DONE. Se comprobaron 25 checkpoints
íntegros, sin paquete. La ejecución real del Gate encontró **0/25 aprobados**:
25 fallos canónicos, seis entradas con secciones académicas sin cubrir y ausencia
del nuevo registro explícito de revisión. Son resultados técnicos; no se declara
que se haya leído de nuevo la bibliografía. Ver `reports/1881-universal-gate.json`.

El ledger #709 pudo descomprimirse y comprobar su hash; contenía 311 terminales y
tres recoveries al snapshot `2026-09-29T14:31:32.314Z`. No equivale a que estos sean
los últimos cambios de todos los Issues; el Scheduler reconcilia DONE posteriores
antes de asignar. La auditoría no cerró recoveries ni liberó códigos.

La adopción es aditiva: al activar esta infraestructura, el primer NEXT examina la
reserva consolidada y añade el estado universal con un Gate ejecutado en ese momento.
Conserva allocationHash, cinco bloques, commit original y checkpoints. No se
migra el Issue vivo antes de que exista la infraestructura revisada en main.
No hacer merge de esta implementación ni tocar producción como parte del audit.

Validación: `node --test 'test/r4 universal bcr.test.cjs' 'test/r4 elastic bcr.test.cjs'`.
Las pruebas de 90 chats simulan llegadas concurrentes a la cola serializada; no son
90 chats reales ni una prueba de carga contra GitHub. Las fixtures de revisión
académica son sintéticas y están marcadas como tales; no certifican contenido nuevo.

