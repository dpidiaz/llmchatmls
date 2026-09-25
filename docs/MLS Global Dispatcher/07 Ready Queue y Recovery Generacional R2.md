# MLS Global Dispatcher R2 — Ready Queue y Recovery Generacional

Versión: 2.0  
Estado: **IMPLEMENTATION / PR VALIDATION**  
Objetivo operativo: sostener ráfagas de **20–30 chats workers** sin doble ownership y sin detener el resto de la producción cuando un worker desaparece.

## Principio

El chat es desechable. GitHub conserva la verdad durable.

La cola preparada no es fuente de verdad ni crea ownership. Solo acelera la selección. El lease efectivo nace únicamente cuando el Scheduler adjudica un assignment.

## Ready Queue

- Target de prefetch por provider: **50 work items**.
- R33 Evidence Farm y MLS Farm materializan candidatos en bloque, no uno por claim.
- Los candidatos prefetched son disjuntos por construcción.
- El Scheduler conserva un runtime registry cacheado durante una pasada.
- Todos los claims pendientes de esa pasada consumen la misma cola.
- Si la cola deja de ofrecer trabajo seleccionable, se hace un refresh antes de responder `NO_WORK`.
- `selectNextWork` vuelve a comprobar terminales, dependencias, assignments activos y resource locks al adjudicar.

## Ventana de concurrencia

- Claim TTL: **10 minutos**.
- ACK: **5 minutos**.
- Rolling lease: **10 minutos**.
- Reaper: **5 minutos** + lazy reap al entrar al Scheduler.
- El TTL de claim más largo evita que una ráfaga de issues expire mientras GitHub Actions serializa el single-writer.

## Recovery prioritario

Los recoveries siguen ordenándose antes que trabajo nuevo.

Cuando un worker expira:

1. GitHub conserva branch, checkpoints, completedUnits y cualquier orphan head.
2. El siguiente assignment **no reutiliza la rama vieja**.
3. Se crea una rama generacional nueva con el issue/assignment nuevo.
4. Si existe checkpoint válido, ese commit es un punto de reanudación durable.
5. Si hay commits posteriores al checkpoint, el Scheduler compara ancestry y changed files contra allowedPaths.
6. El orphan head solo se reutiliza si pasa esa validación.
7. Si el orphan no pasa, se conserva como evidencia pero la producción continúa desde el último checkpoint/base seguro.

Esto evita que un worker antiguo que “revive” pueda escribir sobre la rama del recovery nuevo.

## Zombie fencing

Cada assignment mantiene `assignmentId + leaseToken + leaseEpoch`.

Un evento emitido por un worker viejo contra una generación nueva falla cerrado. La rama vieja queda aislada y ya no es el branch activo del recovery.

## Integración

La producción editorial puede escalar horizontalmente. La integración compartida sigue serializada mediante los locks existentes:

- `system:main-integration`
- `system:r33-index-integration`
- rutas compartidas de índices.

R2 no habilita merges paralelos de índices ni escrituras concurrentes a `main`.

## Métricas

`dispatchProgress` expone `readyQueue`; las respuestas del Scheduler añaden `queueTarget`.

La intención es distinguir trabajo preparado, assignments activos, recoveries y terminales sin interpretar `ready: 1` como si solo existiera un trabajo editorial posible.

## Invariantes

- GitHub-only para el plano editorial.
- Cloudflare editorial interactions: **0**.
- D1 editorial reads/writes: **0**.
- No nested leases.
- No doble ownership.
- No escritura directa a `main`.
- Recovery antes que trabajo nuevo.
- Candidato prefetched ≠ lease.
- Lease expirado ≠ permiso para que el worker viejo reviva.
