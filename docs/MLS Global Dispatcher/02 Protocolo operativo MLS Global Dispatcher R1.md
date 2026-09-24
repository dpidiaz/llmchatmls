# MLS Global Dispatcher R1 — Protocolo operativo

Versión: 1.0  
Estado: **ACTIVE / CERTIFIED R1** en `main`.

## 1. Arquitectura

```text
Chat A ─┐
Chat B ─┼── MLS siguiente
Chat C ─┘
          │
          ▼
 GitHub Global Dispatcher
          │
    ┌─────┼──────────┬────────────┬────────────┐
    ▼     ▼          ▼            ▼            ▼
 MLS    R33       Code Queue   Validation   Deployment
 Farm   Farm                                / Runtime
    │     │          │            │            │
    └─────┴──────────┴────────────┴────────────┘
                       │
                 commits/checkpoints
                       │
                       ▼
                    GitHub
```

GitHub es autoridad sobre asignación, ownership y progreso durable.

## 2. Componentes

### Work Registry
Define qué trabajos existen, sus dependencias, prioridad, locks, ramas y criterios de finalización.

### Dispatcher Scheduler
Single-writer para claims, adjudicación, expiración y cambios de ownership.

### Assignment Issues
Estado durable de cada lease activo o histórico.

### Resource Lock Index
Conjunto derivado de locks pertenecientes a assignments activos no vencidos.

### Reaper
Recupera assignments abandonados y clasifica commits huérfanos.

### Specialized providers
MLS Farm, R33 Evidence Farm y futuras colas especializadas pueden entregar unidades al Dispatcher sin perder sus invariantes internas.

## 3. Comando

Entrada universal:

`MLS siguiente`

No recibe workstream ni cantidad como requisito.

El chat crea un claim marcado `MLS_GLOBAL_DISPATCH_COMMAND`.

## 4. Claim lifecycle

Estado:

`pending → assigned | no_work | stale | rejected`

Requisitos:

- `requestId` único;
- `workerId` único por chat;
- issue timestamp autoritativo;
- claim TTL corto;
- el Scheduler debe drenar claims pendientes en orden determinista.

No convertir un claim stale en assignment.

## 5. Dispatcher single-writer

Workflow conceptual:

```yaml
concurrency:
  group: mls-global-dispatcher
  cancel-in-progress: false
```

Antes de cada adjudicación:

1. leer estado vigente;
2. ejecutar lazy reap;
3. reconstruir active locks;
4. resolver dependencies;
5. seleccionar work item;
6. crear assignment/lease;
7. persistir ownership;
8. cerrar claim o convertirlo en assignment.

No calcular varios leases sobre un snapshot viejo en paralelo.

## 6. Algoritmo de selección

Orden obligatorio:

1. recovery del mismo trabajo si existe progreso huérfano válido;
2. work item `ready`;
3. dependencias satisfechas;
4. sin owner/lease válido;
5. sin lock conflict;
6. worker capabilities compatibles;
7. prioridad efectiva;
8. createdAt más antiguo;
9. `workId` lexicográfico como desempate.

La prioridad no puede saltarse dependencias ni locks.

## 7. Prioridad

Convención recomendada: entero menor = mayor prioridad.

Ejemplo:

- 10: recovery urgente;
- 20: bloqueador de varios workstreams;
- 30: trabajo normal;
- 40: validación no bloqueante;
- 50: mantenimiento.

El registry puede añadir `aging` para evitar starvation, pero debe ser determinista.

## 8. Dependencias

Un work item puede declarar:

```json
{
  "dependsOn": [
    "public-evidence-generator",
    "reader-static-evidence"
  ]
}
```

Solo es elegible cuando los dependencies requeridos alcanzan el estado definido, normalmente `done` o `certified`.

## 9. Assignment state machine

```text
leased
  ├── done
  ├── cancelled
  ├── expired
  ├── recovery_required
  └── failed_closed
```

`recovery_required` conserva ownership histórico pero libera el worker anterior.

## 10. Timing

Valores canónicos:

- ACK deadline: 5 minutos;
- rolling lease: 10 minutos;
- reaper cadence: 5 minutos;
- lazy reap: en cada nuevo claim;
- heartbeat recomendado: 3–5 minutos cuando no hay checkpoint.

El cron es recuperación, no requisito de corrección.

## 11. Locks

Los locks son strings normalizados y jerárquicos.

Clases mínimas:

- `entry:<code>`
- `path:<repo-path>`
- `branch:<branch>`
- `system:<subsystem>`
- `deployment:<target>`

Reglas:

- mismo lock exacto = conflicto;
- un `path:a/b` bloquea descendientes `path:a/b/c`;
- un lock exclusivo de sistema bloquea subtrabajos declarados dentro de ese sistema;
- locks read-only pueden añadirse en una versión posterior; R1 debe preferir locks exclusivos simples.

## 12. Allowed paths

Los locks definen exclusión. `allowedPaths` define el perímetro de escritura.

Un worker puede leer dependencias necesarias, pero no debe escribir fuera de `allowedPaths`.

Si descubre que necesita modificar otro recurso:

1. checkpoint;
2. no editar el recurso;
3. marcar `scope_extension_required`;
4. Dispatcher crea/actualiza work item apropiado.

## 13. Ramas

Patrón recomendado:

`worker/<workId>/<assignmentEpoch>`

o rama fija del workstream si el registry lo exige.

Nunca escribir directamente a `main`.

Un assignment recuperado puede continuar la misma rama si es seguro y el epoch nuevo queda registrado.

## 14. Commit/checkpoint

Regla de orden:

`commit → validate → checkpoint`

Checkpoint debe apuntar al commit exacto.

La validación puede ser:

- tests;
- schema validation;
- content hash;
- Evidence validation;
- static guard;
- build;
- combinación declarada por el work item.

## 15. Reaper

Cada barrido:

1. obtiene assignments activos;
2. calcula vencimiento usando estado actual;
3. para cada vencido:
   - invalida token/epoch;
   - preserva checkpoints;
   - inspecciona branch head;
   - compara con `lastCheckpointCommit`;
   - clasifica `clean_expiry` o `orphan_progress`;
   - libera locks;
   - actualiza work item.

### clean_expiry
No existen commits posteriores al checkpoint. Trabajo pendiente vuelve a `ready`.

### orphan_progress
Existen commits posteriores. Work item pasa a `RECOVERY_REQUIRED`.

## 16. Recovery assignment

Debe contener:

- rama existente;
- último checkpoint;
- orphan head SHA;
- lista de commits huérfanos;
- locks requeridos;
- validaciones obligatorias;
- instrucciones de reconciliación.

El recovery worker no debe regenerar todo de cero.

## 17. Specialized Farms

Para un `editorial_batch`, el Dispatcher puede delegar allocation interno a MLS Farm/R33 Farm.

El ownership externo debe mapearse al lease especializado sin crear dobles propietarios.

Ejemplo:

```text
Global assignment
    ↓
provider=R33 Evidence Farm
    ↓
batchId + leaseToken especializado
```

Al expirar cualquiera de las capas, la liberación debe ser consistente y fail-closed.

La implementación puede optar por usar directamente el lease especializado como assignment para evitar leases anidados.

## 18. Idempotencia

- claim con mismo requestId: no crear segundo assignment;
- heartbeat repetido: seguro;
- checkpoint idéntico: seguro;
- finish repetido después de done: no mutar resultado;
- resultado distinto sobre unidad ya cerrada: conflicto explícito.

## 19. Concurrencia de worker events

Eventos de cada assignment deben serializarse por assignment:

`mls-global-assignment-<assignmentId>`

Assignments diferentes pueden procesarse en paralelo.

## 20. Integración

Un work item de tipo `integration`:

1. toma refs certificados;
2. confirma base actual;
3. verifica ausencia de conflictos fuera de scope;
4. integra;
5. ejecuta tests requeridos;
6. abre/fusiona PR según política;
7. registra merge SHA;
8. termina y libera locks.

No usar integración automática si faltan checks requeridos.

## 21. Deployment

Deployment está separado del trabajo editorial.

Un assignment `deployment` puede:

- generar bundles desde GitHub;
- ejecutar build;
- publicar runtime;
- interactuar con Cloudflare si está explícitamente autorizado.

Nunca debe convertir Cloudflare en fuente de verdad editorial.

## 22. Fallo cerrado

El Dispatcher no asigna trabajo si:

- registry inválido;
- active lock index ambiguo;
- lease state corrupto;
- dependency cycle sin resolver;
- branch base inexistente;
- work item requiere permiso no disponible.

Debe producir error durable y no improvisar ownership.

## 23. Métricas

Registrar al menos:

- claims;
- assignments;
- active leases;
- expirations;
- recoveries;
- orphan commits;
- lock conflicts evitados;
- stale worker events rechazados;
- mean checkpoint interval;
- completed work items;
- failed_closed;
- D1 editorial reads/writes = 0;
- Cloudflare editorial interactions = 0.

## 24. Criterio de certificación R1

Antes de activar `MLS siguiente` como comando productivo:

1. test de claims simultáneos;
2. test de locks solapados;
3. test de lease expiry;
4. test de zombie event;
5. test de orphan commit recovery;
6. test de checkpoint idempotente;
7. test de crash antes de ACK;
8. test de crash después de commit/antes de checkpoint;
9. test de dependency ordering;
10. test de no escritura directa a main;
11. guard editorial GitHub-only;
12. prueba con al menos 4 workers concurrentes sobre work items distintos y resource locks compatibles.

Hasta pasar esta certificación, el Dispatcher permanece en estado de especificación.
