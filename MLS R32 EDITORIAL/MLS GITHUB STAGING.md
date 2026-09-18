# MLS GitHub Staging v1

## Propósito

MLS GitHub Staging es un camino editorial adicional para producir y validar entradas R32 sin consumir D1 durante el trabajo staging. No reemplaza el flujo normal y no cambia sus comandos.

## Invariantes

- El flujo normal sigue usando D1.
- Las rutas staging start, next, status, validate, stage y cancel no llaman a D1.
- Snapshot e integrate son las únicas operaciones staging autorizadas a usar D1.
- Una entrada staged nunca se devuelve como published.
- GitHub nunca se usa como fallback silencioso del flujo normal.
- D1 nunca se usa como fallback silencioso de staging.
- No se usa force push.
- Reconciliación usa INSERT ... ON CONFLICT(code) DO NOTHING.
- wiki_articles.code ya es PRIMARY KEY; no se añade un índice D1 adicional.

## Persistencia

Rama de datos predeterminada: `mls-staging`.

```
mls-staging/
  snapshots/
    latest.json
    <snapshotVersion>/
      manifest.json
      autoopt.json
      targets/<language>.json
      references/<language>.json
  index/
    manifest.json
    MLS-Vxx/0001-0100.json
  requests/<requestHash>.json
  runs/<runId>/
    manifest.json
    autoopt.json
  pending/<code>/
    article.md
    metadata.json
```

Los shards de índice contienen 100 códigos para evitar reescribir un índice global grande.

## Snapshot

Durante `predeploy`, `scripts/generar snapshot staging.js` crea el catálogo estático de 10,133 targets desde las semillas R32 y lo marca con el SHA del build.

Después de un deploy manual, GitHub Actions llama a `/api/wiki/editorial/staging/snapshot`. Ese endpoint puede leer D1 y persiste en GitHub:

- códigos canónicos existentes;
- targets del build;
- banco de hasta 96 referencias publicadas por idioma;
- estadísticas AUTOOPT por familia;
- contrato R32;
- system prompt;
- módulos por idioma;
- sourceCommit.

Un run staging fija `snapshotVersion` y `snapshotCommit`. Si el snapshot no coincide con el build desplegado, no se abre el run.

## Concurrencia

Cada mutación GitHub:

1. lee el HEAD esperado;
2. crea blobs y tree;
3. crea un commit con ese HEAD como padre;
4. intenta mover la ref con `force:false`.

Si otro run avanzó la rama, el update deja de ser fast-forward y se reintenta sobre el estado nuevo. La selección solo queda fijada cuando el commit de reserva tiene éxito.

## Validación y staging

`validarBorradorStagingMLS` ejecuta la misma validación determinista R32. Una validación exitosa devuelve un recibo HMAC y no escribe D1.

`stagearBorradorMLS` vuelve a verificar el borrador y el recibo, y en un commit GitHub guarda article.md, metadata.json, manifest del run, AUTOOPT e índice.

Los fallos editoriales se persisten en GitHub. Tras tres fallos reintentables la entrada pasa a deferred. Fallos no corregibles de snapshot/calibración pasan a needs_review.

## Gemma

Cuando staging está configurado:

- staged puede servirse como R32 antes de integración;
- reserved/drafting/validated bloquean materialización persistente;
- justo antes de publishWikiArticle se hace una comprobación fuerte;
- si GitHub falla en ese punto, se falla cerrado.

Si staging todavía no está configurado, el flujo normal conserva su comportamiento previo.

## Reconciliación

`reconciliarStagingMLS` procesa hasta 400 entradas por pasada.

- consulta existencia por code con `WHERE code IN (...)`;
- usa la PRIMARY KEY existente;
- inserta solo ausentes;
- identifica reintentos propios mediante audit_model staging;
- clasifica conflictos ajenos como preservedExisting;
- suma `meta.rows_read` y `meta.rows_written` de todas sus consultas D1;
- actualiza GitHub después de confirmar D1.

Si quedan más staged, devuelve `status: partial` y `pending > 0`.

## Credenciales y bootstrap

Modo preferido: GitHub App instalada únicamente en `dpidiaz/llmchatmls`.

Permiso de repositorio requerido:

- **Contents: Read and write**

No requiere permiso Workflows porque el Worker solo escribe bajo `mls-staging/` en la rama de datos y no modifica `.github/workflows`.

Secrets de infraestructura para GitHub App:

- `MLS_STAGING_GITHUB_APP_ID`
- `MLS_STAGING_GITHUB_INSTALLATION_ID`
- `MLS_STAGING_GITHUB_APP_PRIVATE_KEY` (PEM RSA PKCS1 o PKCS8)

Fallback de bootstrap:

- `MLS_STAGING_GITHUB_TOKEN`, fine-grained y limitado únicamente a `dpidiaz/llmchatmls`, con Contents: Read and write.

No se almacena ninguna credencial en el repositorio ni se envía a ChatGPT.

El workflow `.github/workflows/bootstrap staging.yml` se ejecuta manualmente desde `main`. Detecta GitHub App primero y token como fallback, instala la credencial en Cloudflare mediante una sola operación `wrangler secret bulk`, crea el snapshot inicial y verifica el endpoint editorial existente.

Los valores deben existir como GitHub Actions secrets antes de ejecutar el bootstrap. ChatGPT no necesita conocerlos.

El snapshot posterior al deploy no invalida un deploy productivo ya exitoso cuando las credenciales staging todavía no han sido configuradas: el workflow de producción emite una advertencia y deja pendiente el bootstrap. Una credencial presente pero inválida sí se considera error de infraestructura staging.

Variables no secretas:

- `MLS_STAGING_GITHUB_OWNER=dpidiaz`
- `MLS_STAGING_GITHUB_REPO=llmchatmls`
- `MLS_STAGING_GITHUB_BRANCH=mls-staging`

## Comandos

- `MLS staging siguientes N`
- `MLS staging continuar`
- `MLS staging estado`
- `MLS staging cancelar`
- `MLS staging integrar`

Máximo por run: 400. La acumulación total no tiene límite editorial artificial.
