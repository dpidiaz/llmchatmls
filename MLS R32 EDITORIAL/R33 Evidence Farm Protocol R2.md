# MLS R33 Evidence Farm Protocol R2 — GitHub-native

Este es el contrato operativo activo para Evidence/Provenance R33 concurrente.

## Regla arquitectónica

**GitHub es la única fuente de verdad editorial.**

Durante creación, edición, Source Registry, Evidence, provenance, validación, verificación, Farm y coordinación:

- Cloudflare: prohibido;
- D1: prohibido;
- MLS Chat Bridge: prohibido;
- Workers AI/runtime APIs: no son dependencia editorial.

Cloudflare solo puede consumir artefactos ya consolidados desde GitHub durante despliegue/serving.

## Fuentes canónicas

- artículos: `content/<language>/<code>.json`;
- Evidence: `MLS R32 EDITORIAL/evidence git/entries/<language>/<code>.json`;
- Sources: `MLS R32 EDITORIAL/evidence git/registry/sources/<sourceId>.json`;
- índices derivados: `MLS R32 EDITORIAL/evidence git/indexes/`;
- coordinación: GitHub Issues + ledger.

## Comando

`R33 siguientes N`

crea un claim con `requestId` y `workerId`. Default 25; máximo 50.

## Lease

- claim TTL: 90 s;
- ACK: 5 min;
- lease móvil tras ACK: 10 min;
- heartbeat, checkpoint, finish, cancel y reap se conservan.

## Secuencia por entrada

1. Leer artículo canónico desde GitHub.
2. Leer Evidence Git existente, si lo hay.
3. Leer Source Registry e índices desde GitHub.
4. Seleccionar o investigar Source.
5. Escribir/actualizar Source en GitHub.
6. Escribir propuesta Evidence con optimistic revision.
7. Ejecutar validación local/CI sobre archivos Git.
8. Corregir metadata/locator si falla.
9. Promover a `VERIFIED` en el artefacto Git.
10. Commit.
11. Checkpoint Farm apuntando al artefacto + commit exacto.

No se fabrica `REVIEWED` humano.

## Checkpoint verified

Debe incluir:

- `code`;
- `articleGeneratedAt`;
- `articleHash`;
- `evidenceStatus: "VERIFIED"`;
- `evidenceRevision`;
- `evidenceArtifactPath`;
- `evidenceCommitSha` (40 hex);
- `evidenceArtifactHash` (SHA-256 del archivo exacto);
- `reviewedHuman: false` o omitido.

`bridgeResultPath` está prohibido.

El Worker Events vuelve a leer el Issue vigente y consulta el archivo mediante GitHub Contents API en el commit indicado. Verifica ruta, hash del archivo, código, versión del artículo, status y evidenceRevision antes de aceptar el checkpoint.

## Idempotencia y concurrencia

El lease evita que dos chats trabajen el mismo código. Los eventos se serializan por Issue y el worker hace refetch del estado más reciente antes de aplicar cada evento, evitando lost updates por snapshots viejos del webhook.

Reenviar exactamente el mismo checkpoint es idempotente. Un resultado distinto para un código ya recibido produce `RESULT_HASH_CONFLICT`.

## Reap

`cancel` conserva resultados aceptados y libera pendientes. `reap` cierra leases vencidos/cancelados y fusiona terminales al ledger.

## Gate 500

**No autoriza Gate 500.**

Gate 500 requiere un manifiesto nuevo tras certificar el pipeline GitHub-native con 0 interacciones editoriales Cloudflare/D1.

## Regla de desastre

Si D1/Cloudflare desaparecen por completo, ninguna entrada, Source, Evidence, provenance ni estado editorial puede perderse. Todo debe reconstruirse desde GitHub.
