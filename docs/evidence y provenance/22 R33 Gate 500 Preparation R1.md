# MLS R33 — Gate 500 Preparation R1

**Estado:** PREPARED / NOT AUTHORIZED  
**Arquitectura:** GitHub-native  
**Cloudflare editorial:** 0  
**D1 editorial:** 0  
**Ejecución:** Global Dispatcher only

## 1. Objetivo

Preparar Gate 500 sin iniciar todavía producción editorial.

Gate 500 se ejecutará únicamente después de autorización explícita y después de que este paquete de hardening esté integrado y certificado.

## 2. Pool candidato

Manifest:

`docs/evidence y provenance/20 R33 Gate 500 Pool.json`

Contrato:

- poolId: `MLS-R33-GITHUB-NATIVE-GATE-500`;
- 500 entradas;
- 10 idiomas;
- 50 entradas por idioma;
- selección determinista por cuantiles;
- exclusión de Pilot 20 + Gate 100 + Correction Repeat 100 + Benchmark 100;
- 320 códigos previos excluidos;
- `contentBlobSha` fijado por entrada;
- `status: prepared`;
- `active: false`;
- `gate500Authorized: false`;
- `dispatcherOnly: true`.

El pool no es ejecutable mientras conserve esos tres flags de bloqueo.

## 3. Selector de pool activo

Control:

`docs/evidence y provenance/21 R33 Active Pool Control.json`

Mientras Gate 500 no esté autorizado:

- `activePoolPath` sigue apuntando a Benchmark 100;
- Gate 500 aparece únicamente como candidato;
- `evidence farm core.js` resuelve el pool mediante este control, no mediante un path Gate 100/Benchmark hardcodeado.

Esto permite preparar el próximo gate sin cambiar accidentalmente el control plane activo.

## 4. Activación fail-closed

Herramienta:

`scripts/R33 gate500 control.cjs`

Preflight:

```bash
npm run r33:gate500:check
```

Comprueba:

- 500 códigos únicos;
- 50 por idioma;
- 0 overlap con los 320 códigos previos;
- flags GitHub-only;
- `dispatcherOnly: true`;
- existencia de todos los contentPath;
- coincidencia exacta del Git blob SHA actual con cada `contentBlobSha`;
- coherencia del Active Pool Control.

La activación requiere explícitamente:

```bash
node 'scripts/R33 gate500 control.cjs' --activate --confirm=GATE500
```

No ejecutar ese comando sin autorización explícita posterior.

La activación muta exclusivamente:

- `20 R33 Gate 500 Pool.json`;
- `21 R33 Active Pool Control.json`.

No produce Evidence.

## 5. Semántica del work item `gate500`

El antiguo placeholder editorial vacío fue reemplazado por un work item de **activación**:

- `workType: validation`;
- `provider: global`;
- status inicial `blocked`;
- allowedPaths limitados al manifest y al control;
- validaciones Gate 500 + R33;
- no puede escribir Evidence.

Después de autorización explícita, se cambia a `ready` y el assignment de activación ejecuta el preflight/activación en una rama normal.

## 6. Ownership

El manifest Gate 500 tiene:

`dispatcherOnly: true`

Por tanto, cuando Gate 500 esté activo, el scheduler R33 legado rechaza claims editoriales directos con:

`GLOBAL_DISPATCHER_REQUIRED`

El único owner de nuevas entradas será MLS Global Dispatcher.

Esto elimina el riesgo de que el scheduler legado y el Global Dispatcher leaseen el mismo código simultáneamente.

## 7. Bootstrap del ledger

El provider Global Dispatcher puede arrancar con ledger R33 sintético vacío cuando todavía no exista el issue ledger especializado.

Regla:

- 0 ledgers → bootstrap sintético seguro;
- 1 ledger → se utiliza;
- >1 ledgers → fail closed.

El cron del Evidence Farm puede crear posteriormente el ledger especializado del pool activo, pero el primer claim Global no depende de esperar ese cron.

## 8. Producción por waves

Parámetros:

- claim default: 25;
- claim máximo: 50;
- checkpoint máximo: 10;
- wave de integración: 50.

Secuencia recomendada:

1. assignment editorial 25;
2. assignment editorial 25;
3. al existir 50 Evidence terminales no integradas, Global Dispatcher materializa una integración R33;
4. se pausa nueva producción mientras esa integración está activa;
5. la integración copia los blobs exactos desde las ramas terminales;
6. reconstruye índices;
7. valida;
8. abre PR;
9. merge protegido;
10. verifica main;
11. checkpoint/finish;
12. siguiente wave.

Así Gate 500 requiere aproximadamente 10 waves de 50, sin mantener 500 archivos divergentes antes de integrar.

## 9. Integración serializada de índices

Herramienta:

`scripts/R33 evidence indexes.cjs`

Check:

```bash
npm run r33:indexes:check
```

Rebuild:

```bash
npm run r33:indexes:write
```

Índices derivados:

- `by-code.json`;
- `by-language.json`;
- `by-source.json`;
- `verified.json`.

La herramienta usa directamente `evidence git.js::buildIndexes/writeIndexes`, por lo que no existe una segunda implementación del algoritmo.

Después del rebuild ejecuta validación del store completo.

## 10. Integration assignment dinámico

Cuando el Global Dispatcher detecta 50 Evidence terminales del pool activo que aún no aparecen en `verified.json`, materializa:

`provider: r33-index-integration`

Locks:

- `system:main-integration`;
- `system:r33-index-integration`;
- path completo de índices;
- locks de las entradas de la wave.

Allowed paths:

- Evidence exactos de la wave;
- cuatro índices derivados.

Cada código incluye `sourceRefs` con rama y commit terminal de su assignment editorial.

## 11. PR creado por el assignment

Las integrations de wave usan policy:

`mode: assignment-pr`

El PR no existe al inicio del assignment.

Después de construir la rama:

1. crear PR a `main`;
2. fijar el head SHA exacto;
3. exigir `R33 GitHub Native Tests`;
4. merge con `expected_head_sha`;
5. verificar que main contiene el merge SHA;
6. checkpoint con:
   - `integrationPrNumber`;
   - `integrationHeadSha`;
   - merge commit SHA.

El Worker Events valida esos tres valores antes de aceptar checkpoint/finish.

## 12. CI

R33 GitHub Native CI observa:

- Evidence Farm core;
- Global Dispatcher R33 integration;
- manifest Gate 500;
- Active Pool Control;
- herramienta de Gate 500;
- test Gate 500;
- package scripts.

El suite R33 incluye además:

- Gate 500 preparation test;
- Evidence index derivability check;
- Gate 500 fail-closed preflight;
- GitHub-only guard.

## 13. Estado de salida de preparación

Gate 500 está listo para autorización solamente cuando:

- PR de preparación merged;
- Global Dispatcher Tests PASS;
- R33 GitHub Native Tests PASS;
- R33 Evidence Farm Tests PASS;
- manifest candidato = 500;
- 0 overlap;
- 0 blob drift;
- active pool todavía Benchmark 100;
- Gate 500 todavía blocked / unauthorized;
- recoveries globales = 0.

Hasta entonces no cambiar `gate500Authorized`.


## 14. Preflight PR

La preparación se integra únicamente si PR CI confirma:

- Global Dispatcher Tests;
- R33 GitHub Native Tests;
- R33 Evidence Farm Tests;
- pool candidato 500 sin drift;
- Gate 500 todavía no autorizado.

Un PR sin runs esperados no se considera certificado.
