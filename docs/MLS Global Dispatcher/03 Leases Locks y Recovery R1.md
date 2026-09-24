# MLS Global Dispatcher R1 — Leases, Locks y Recovery

## Objetivo

Hacer que la desaparición de un chat sea un fallo rutinario de worker, no una pérdida de proyecto ni una fuente de corrupción concurrente.

## 1. Modelo de amenaza

El sistema asume que un chat puede:

- no llegar a ACK;
- detenerse mientras razona;
- morir después de un checkpoint;
- morir después de un commit pero antes del checkpoint;
- reaparecer tarde y enviar eventos;
- perder contexto y repetir una operación;
- intentar trabajar con un snapshot viejo;
- chocar con otro chat sobre archivos o entradas.

Todos estos casos deben ser recuperables o rechazados de forma segura.

## 2. Lease

Fases:

### Unacknowledged
Desde `claimedAt` hasta `ackDeadlineAt`.

Duración: 5 minutos.

### Acknowledged
Después del primer evento válido.

`expiresAt = lastAcceptedEventAt + 10 minutos`

Heartbeat/checkpoint/finish válido renueva el lease según corresponda.

## 3. Epoch

Cada nueva propiedad de un work item incrementa `leaseEpoch`.

La combinación efectiva es:

`assignmentId + leaseToken + leaseEpoch`

Un evento con epoch viejo jamás puede mutar estado vigente.

## 4. Reaper

Cadencia: 5 minutos.

También existe lazy reap al procesar claims nuevos.

Por tanto, un trabajo puede ser reconocido como vencido incluso antes del siguiente cron si llega una nueva solicitud.

## 5. Resource locks

Los locks representan exclusión lógica, no solo archivos.

Ejemplos:

```text
entry:MLS-V06-0101
path:data/evidence/by-code
system:public-evidence-generator
deployment:production
```

Un assignment puede poseer múltiples locks.

Todos se adquieren atómicamente o ninguno.

No se permite adquisición parcial.

## 6. Lock acquisition

Transacción lógica del Scheduler:

1. snapshot fresco de work items;
2. eliminar leases vencidos;
3. construir set de locks activos;
4. seleccionar candidato;
5. verificar todos sus locks;
6. persistir assignment y locks como una sola adjudicación serializada.

Si algún lock ya no está disponible, reintentar selección con estado fresco.

## 7. Lock release

Se liberan cuando:

- finish aceptado;
- cancel consolidado;
- lease expirado;
- assignment failed_closed después de registrar estado;
- integración explícita transfiere ownership según protocolo.

Liberar locks no implica borrar ramas ni commits.

## 8. Checkpoint boundary

Checkpoint es el límite de progreso confirmado por el control plane.

Debe registrar:

- commit exacto;
- unidades completadas;
- hashes relevantes;
- validación;
- timestamp GitHub.

Nada después del checkpoint se considera perdido automáticamente; puede existir como orphan progress.

## 9. Orphan progress

Definición:

`branchHead != lastCheckpointCommit`

y los commits posteriores pertenecen al assignment.

El reaper clasifica ese estado como `RECOVERY_REQUIRED`.

No debe:

- borrar la rama;
- resetearla;
- reasignar el mismo recurso para generación desde cero;
- asumir que esos commits son correctos.

Debe preservar y validar.

## 10. Recovery procedure

Nuevo worker:

1. adquiere locks con epoch nuevo;
2. lee work item;
3. lee `lastCheckpointCommit`;
4. lee orphan head;
5. inspecciona diff limitado al assignment;
6. ejecuta validaciones obligatorias;
7. clasifica cada cambio:
   - reusable;
   - needs_fix;
   - invalid;
8. crea commit de reconciliación si hace falta;
9. checkpoint;
10. continúa pendientes.

## 11. Worker zombi

Ejemplo:

```text
10:00 heartbeat
10:10 lease expira
10:12 reaper libera
10:13 Chat B obtiene epoch 8
10:15 Chat A vuelve con epoch 7
```

El evento de Chat A debe rechazarse con `LEASE_EPOCH_MISMATCH` o `LEASE_EXPIRED`.

Nunca renovar un lease histórico por actividad tardía.

## 12. Crash matrix

| Momento del crash | Estado durable | Recuperación |
|---|---|---|
| antes del ACK | solo assignment | reaper libera |
| después del ACK, sin cambios | lease | expira y vuelve a ready |
| después de checkpoint | checkpoint + commit | conservar; continuar pendientes |
| después de commit, antes de checkpoint | orphan commit | RECOVERY_REQUIRED |
| durante validación | commit + logs parciales | recovery vuelve a validar |
| después de finish aceptado | terminal | no reasignar |
| después de merge | merge SHA | terminal/integration complete |

## 13. Idempotencia

El sistema debe tolerar que un chat repita el último evento por incertidumbre de red/UI.

Mismo payload/hash:

- no duplica;
- no incrementa dos veces;
- puede devolver estado vigente.

Payload diferente para una unidad ya confirmada:

- conflicto;
- fail closed;
- requiere reconciliación explícita.

## 14. Lost-update prevention

Nunca aplicar un worker event directamente sobre el snapshot recibido por webhook.

Worker Events debe:

1. refetch Issue/assignment vigente;
2. validar token/epoch;
3. aplicar mutación;
4. persistir;
5. serializar por assignment.

## 15. Protección de main

Un worker muerto jamás debe dejar `main` a medias porque workers normales no escriben a `main`.

Main cambia solo por integración controlada/certificada.

## 16. Límite inevitable

No existe recuperación para razonamiento que:

- solo vivía en la memoria/contexto del chat;
- no produjo commit, checkpoint ni Issue update.

Mitigación:

- persistir cada 2–3 operaciones significativas;
- checkpoint frecuente;
- commits pequeños y coherentes;
- no acumular un lote entero antes del primer write durable.

## 17. Invariante de desastre

Si todos los chats activos desaparecen al mismo tiempo:

- GitHub conserva work registry;
- assignments conservan estado;
- ramas conservan commits;
- checkpoints conservan progreso confirmado;
- reaper libera ownership muerto;
- nuevos chats pueden continuar mediante `MLS siguiente`.

No debe requerirse reconstruir manualmente qué estaba haciendo cada chat.
