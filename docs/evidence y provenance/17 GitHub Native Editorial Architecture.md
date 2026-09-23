# MLS R33 — Arquitectura editorial GitHub-native

**Estado:** IMPLEMENTADA EN MIGRACIÓN  
**Fecha:** 2026-09-23 UTC

## Regla canónica

GitHub es la única fuente de verdad del proceso editorial MLS.

ChatGPT crea, lee, modifica, valida y verifica entradas y Evidence mediante archivos versionados en GitHub. Cloudflare no participa en autoría, Farm, Source Registry, Evidence, provenance, verificación ni coordinación.

Cloudflare queda permitido exclusivamente como plataforma de despliegue/serving de artefactos ya consolidados desde GitHub.

```yaml
editorial:
  sourceOfTruth: github
  chatgptToGithub: true
  cloudflareAllowed: false
  d1Allowed: false
deployment:
  source: github
  cloudflareAllowed: true
  runtimeDataIsDerived: true
```

## Layout

- `content/<idioma>/<code>.json`: artículo canónico.
- `MLS R32 EDITORIAL/evidence git/entries/<idioma>/<code>.json`: Evidence canónico por entrada.
- `MLS R32 EDITORIAL/evidence git/registry/sources/<sourceId>.json`: Source Registry.
- `MLS R32 EDITORIAL/evidence git/indexes/`: índices derivados/reconstruibles.
- GitHub Issues: leases, checkpoints, ledger y coordinación multi-chat.

## Regla de reconstrucción

Borrar D1 no puede causar pérdida editorial. El corpus, Evidence, Sources, provenance y estados verificables deben reconstruirse desde GitHub.

## Migración inicial

Las 100 entradas del `MLS-R33-CORRECTION-REPEAT-100` se materializaron a partir de los comandos/resultados históricos ya persistidos en GitHub. La migración no consulta D1.

Los artefactos conservan referencias a los archivos históricos únicamente como provenance de migración. Esas rutas no son dependencia operativa futura.

## Gate 500

Sigue bloqueado. La siguiente certificación debe medir el pipeline GitHub-native y exigir:

- 0 interacciones Cloudflare editoriales;
- 0 D1 reads;
- 0 D1 writes;
- 100% de entradas recuperables desde GitHub;
- checkpoints respaldados por artefacto Git + commit SHA;
- ausencia de lost updates en coordinación;
- auditoría Source ↔ Claim satisfactoria.
