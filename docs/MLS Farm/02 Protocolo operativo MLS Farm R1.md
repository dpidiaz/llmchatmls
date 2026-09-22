# MLS Farm R1 — Protocolo operativo

## Arquitectura

```
ChatGPT workers
      ↓
GitHub Issues
      ↓
Scheduler + lease ledger
      ↓
checkpoint comments
      ↓
Reaper / collector
      ↓
terminal ledgers
      ↓
reconciliación posterior
      ↓
GitHub Evidence canónica
```

Cloudflare no forma parte de este flujo.

## Capacidad

- corpus: 10,133 entradas;
- batch: 1–100;
- default: 25;
- claim TTL: 90 segundos;
- ACK del worker: máximo 2 minutos desde `claimedAt`;
- lease confirmado: 60 minutos desde último progreso válido;
- reaper: cada 15 minutos;
- checkpoint: 1–10 entradas;
- workers simultáneos: limitados por GitHub/ChatGPT, no por un lock editorial global.

## Estados

Comando:

`claim → leased | stale | complete | rejected`

Batch:

`leased (awaiting ACK) → leased (acknowledged) → done | expired | cancelled`

Resultado por entrada:

`pending → submitted | needs_review`

Después de reconciliación podrán existir estados posteriores, pero Farm no los inventa.

## Recuperación

Un batch abandonado puede contener:

- 10 submitted
- 2 needs_review
- 13 pending

Al vencer:

- 12 se preservan;
- 13 vuelven al pool.

Un nuevo `MLS Farm siguientes 25` puede recibir esas 13 más otras 12 entradas FIFO libres.

## Idempotencia

Un resultado repetido con el mismo hash es aceptado sin duplicación.

Un resultado posterior diferente para el mismo código dentro del mismo lease falla con `RESULT_HASH_CONFLICT`.

## Worker zombi

Un lease sin `ack` antes de `ackDeadlineAt` se considera abandonado aunque su `expiresAt` de 60 minutos todavía no haya llegado.

Después del ACK, un comentario posterior a `expiresAt` no renueva el lote.

Un batch nuevo utiliza otro issue, otro token y otro epoch.


## Recuperación de comandos

Todos los comandos operativos nuevos usan el marcador canónico `MLS_FARM_COMMAND`.

El Scheduler drena en una sola ruta idempotente `claim`, `status_global` y `reap`. Los claims legacy con JSON suelto se pueden leer para saneamiento, pero si ya excedieron el TTL se cierran como `STALE` y nunca se convierten retroactivamente en leases.

Cuando el último checkpoint deja el batch listo para cerrar, el worker crea un comando canónico `reap` para que el Scheduler consolide los resultados y cierre el Issue sin depender únicamente del cron.

## Coste Cloudflare

Durante Farm:

- D1 reads = 0
- D1 writes = 0
- Workers requests = 0
- Workers AI neurons = 0

La publicación a runtime es una fase independiente.
