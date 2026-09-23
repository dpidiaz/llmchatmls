# MLS R33 Evidence Farm Protocol R1

Este archivo es el contrato operativo durable para trabajo Evidence/Provenance R33 concurrente desde múltiples chats.

## Objetivo

Permitir que varios chats colaboren sobre un mismo pool R33 sin duplicar entradas, sin reutilizar leases ajenos y sin colisionar nombres globales del MLS Chat Bridge.

El control plane vive en GitHub Issues y **no consulta D1**. La evidencia real continúa pasando por los endpoints R33 existentes mediante MLS Chat Bridge.

## Pool autorizado

El scheduler solo asigna entradas presentes en el manifiesto activo:

`docs/evidence y provenance/15 Evidence Farm Correction Repeat Pool.json`

El pool inicial es `MLS-R33-CORRECTION-REPEAT-100`.

Este pool ejecuta el Correction Repeat autorizado por el Gate 100 Final Report. **No autoriza Gate 500.**

Cambiar de gate requiere un manifiesto nuevo, explícitamente autorizado y versionado.

## Comando natural

`R33 siguientes N`

equivale a crear exactamente un Issue con:

<!-- R33_EVIDENCE_FARM_COMMAND
{
  "operation": "claim",
  "requested": 25,
  "requestId": "unique-request-id",
  "workerId": "unique-worker-id"
}
-->

Tamaño por defecto: 25. Máximo: 50.

También existen `status_global` y `reap`.

## CHAT ONLY

El comando `R33 siguientes N` se ejecuta en el chat actual. No requiere ChatGPT Work. Cada chat puede actuar como worker independiente.

## Lease

Un claim tiene TTL de 90 segundos antes de convertirse en stale.

Un lease nuevo debe ser reconocido antes de 5 minutos. El primer `heartbeat`, `checkpoint`, `finish` o `cancel` aceptado lo reconoce.

Después del ACK, el TTL móvil es de 60 minutos.

Cada batch tiene:

- `batchId`
- `leaseToken`
- `leaseEpoch`
- `workerId`
- lista exacta de entradas asignadas

Un chat nunca trabaja códigos fuera de su lease.

## Eventos del worker

Los comentarios operativos usan:

`R33_EVIDENCE_FARM_EVENT`

Operaciones:

- `heartbeat`
- `checkpoint`
- `finish`
- `cancel`

Los checkpoints contienen entre 1 y 10 entradas.

Estados terminales aceptados:

- `verified`: la entrada terminó efectivamente en `VERIFIED`.
- `exception`: bloqueo real que requiere diagnóstico/revisión; no se usa para errores transitorios.

Errores transitorios deben terminar en `cancel` para liberar trabajo, no en `exception`.

## Bridge namespaced

Queda prohibido coordinar workers con nombres globales del tipo `command 0331.json`.

Cada batch usa exclusivamente:

`mls chat bridge/commands/r33-farm/<poolId>/<batchId>/<workerId>/<nombre-unico>.json`

Los resultados aparecen en la ruta espejo:

`mls chat bridge/results/r33-farm/<poolId>/<batchId>/<workerId>/<nombre-unico>.json`

Un checkpoint `verified` debe referenciar un `bridgeResultPath` dentro del namespace del propio batch.

Esto elimina la colisión de nombres observada en Gate 100.

## Secuencia de trabajo por entrada

1. Consultar `entradaEvidenceMLS`.
2. Si ya está VERIFIED, reutilizar ese estado sin crear propuesta nueva.
3. Si no está VERIFIED, hacer triage Registry-first.
4. Investigar fuente específica cuando el Registry no alcance.
5. Enviar `proponerEvidenceMLS`.
6. Resolver `EVIDENCE_REVISION_CONFLICT` refrescando la versión; nunca sobrescribir a ciegas.
7. Resolver errores APA enriqueciendo metadata.
8. Ejecutar `verificarEvidenceMLS`.
9. Confirmar estado `VERIFIED`.
10. Emitir checkpoint Evidence Farm con el resultado persistido del Bridge.

No se fabrica `REVIEWED` humano.

## Contrato mínimo del resultado

Un resultado `verified` debe incluir al menos:

- `code`
- `articleGeneratedAt`
- `articleHash`
- `evidenceStatus: "VERIFIED"`
- `evidenceRevision`
- `bridgeResultPath`
- `reviewedHuman: false` o campo omitido

Una excepción debe incluir además `errorCode`.

## Idempotencia

Reenviar exactamente el mismo resultado para un código es seguro.

Enviar un resultado distinto para el mismo código dentro del batch produce `RESULT_HASH_CONFLICT`.

## Cancelación y reap

`cancel` conserva checkpoints ya aceptados y libera solo códigos pendientes.

`reap` cierra leases vencidos o cancelados y preserva resultados parciales.

## Multi-chat

Cada chat crea su propio claim. El scheduler excluye:

- códigos ya terminales en el ledger;
- códigos protegidos por leases activos;
- códigos fuera del pool activo.

Por tanto, 2, 5 o más chats pueden ejecutar `R33 siguientes 25` simultáneamente sin recibir el mismo código.

## Persistencia y reanudación

La fuente de verdad de coordinación son:

- manifiesto del pool;
- Issue ledger;
- Issues batch;
- resultados namespaced del Bridge.

La conversación no es la fuente de verdad. Un nuevo chat puede recuperar el estado únicamente desde GitHub.

## Seguridad de gates

El Evidence Farm no interpreta “siguientes” como permiso para ampliar el universo de trabajo.

Cuando el pool termina, nuevos claims reciben cero asignaciones.

Gate 500 solo puede comenzar después de sustituir explícitamente el manifiesto activo por uno autorizado tras superar el Correction Repeat.
