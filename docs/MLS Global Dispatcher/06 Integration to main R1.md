# MLS Global Dispatcher — Integration-to-main R1

Estado: **contrato operativo R1.1**

## Objetivo

Permitir que work items `integration` lleven outputs ya certificados a `main` sin convertir al worker en un escritor arbitrario de la rama principal.

## Contrato

Todo integration work item ejecutable debe fijar:

- PR exacto;
- `base: main`;
- `expectedHeadSha` de 40 hex;
- método de merge;
- checks pre-merge obligatorios;
- checks post-merge cuando apliquen;
- work item de certificación previo cuando exista;
- lock global `system:main-integration`.

## Secuencia obligatoria

1. adquirir assignment y ACK;
2. leer PR exacto;
3. comprobar base y head contra el spec;
4. comprobar que no sea draft y que GitHub no lo marque no-mergeable;
5. comprobar todos los checks requeridos;
6. ejecutar merge usando **expected_head_sha**;
7. volver a leer PR;
8. capturar merge SHA;
9. verificar que `main` contiene el merge SHA;
10. verificar checks post-merge;
11. Worker Events valida el checkpoint de integración contra PR merged + head certificado + merge SHA + ancestry en `main` (no contra `allowedPaths` de la rama worker);
12. checkpoint usando el merge SHA;
13. finish;
14. reap.

## Head drift

Si el head observado difiere de `expectedHeadSha`, el worker falla cerrado con `INTEGRATION_HEAD_DRIFT`. Debe existir una nueva certificación antes de reintentar.

## Idempotencia

Si el PR ya aparece merged, el worker no vuelve a mergear. Solo puede considerar el trabajo completo cuando:

- el PR conserva el head certificado;
- existe merge SHA verificable;
- `main` contiene ese merge;
- los checks post-merge requeridos están verdes.

Esto permite recuperar de un chat que murió después del merge pero antes del checkpoint.

## Recovery

No se depende de progreso en la rama worker para recuperar un merge. El estado durable es GitHub:

- PR merged;
- merge SHA;
- ancestry/contenido en main;
- checks.

Un retry reevalúa el mismo spec y converge idempotentemente a DONE.

## Locks

Todo integration work item a `main` debe incluir:

`system:main-integration`

Además puede conservar locks específicos del subsistema.

Solo un merge controlado a main puede estar activo bajo este contrato.

## Preparación paralela R33 Gate 1000

Cuando el pool activo declare `execution.parallelIntegrationPreparation: true`, la integración R33 se divide en dos fases:

1. **Preparación paralela** (`r33-index-preparation`): cada ola integra sus Evidence blobs exactos en una rama independiente, regenera los cuatro índices derivados, ejecuta validación y abre un PR a `main` **sin mergearlo**. Estas preparaciones no poseen `system:main-integration` ni `system:r33-index-integration`, por lo que olas disjuntas pueden coexistir.
2. **Integración final serial** (`r33-index-integration`): consume únicamente una preparación terminal y certificada a la vez, parte del `main` vigente, vuelve a derivar los índices contra ese estado, ejecuta checks, usa `expected_head_sha`, mergea y verifica post-merge.

Los cuatro índices globales continúan siendo monolíticos; por eso la fase final conserva:

`system:main-integration`

`system:r33-index-integration`

La preparación paralela no relaja provenance: el work item conserva los `sourceRefs` del Farm y la integración final conserva además un `preparedRef` con branch + commit SHA de la preparación que consumió.

El orden de prioridad favorece llenar primero la cola de preparaciones; cuando ya no quedan preparaciones sin reclamar, las integraciones finales avanzan serialmente. Un pool que no habilite `parallelIntegrationPreparation` conserva el comportamiento R1 serial anterior.

## Seguridad editorial

Este contrato no autoriza:

- escritura editorial a Cloudflare;
- lectura/escritura editorial D1;
- fabricación de REVIEWED humano;
- cambio de head certificado;
- merge de un PR distinto.

## Implementación

La lógica pura vive en:

`MLS R32 EDITORIAL/global dispatcher/integration.js`

Los tests contractuales viven en:

`test/mls global dispatcher integration.test.cjs`


## Semántica especial de checkpoint de integración

Los work items `integration` no producen el diff del PR dentro de la rama worker. Por tanto, aplicarles la regla normal `branch HEAD + allowedPaths` produce falsos `BRANCH_HEAD_MISMATCH` / `CHECKPOINT_SCOPE_VIOLATION`.

R1.1 exige que Worker Events valide un checkpoint de integración mediante estado GitHub durable:

- PR exacto del spec;
- `base: main`;
- head del PR idéntico a `expectedHeadSha`;
- PR efectivamente merged;
- `commitSha` idéntico a `merge_commit_sha`;
- `main` igual o descendiente de ese merge SHA.

La validación de branch/scope permanece sin cambios para `code_task`, `validation`, `editorial_batch`, `deployment` y `recovery`.
