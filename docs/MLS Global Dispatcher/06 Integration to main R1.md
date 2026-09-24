# MLS Global Dispatcher — Integration-to-main R1

Estado: **contrato operativo R1**

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
11. checkpoint usando el merge SHA;
12. finish;
13. reap.

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
