# Claim — status reconciliation 106/91

- Tipo: integration / hot-file reconciliation.
- Base SHA al iniciar: `6020ef0ca75053cdd73a14aaf32896cef02b1704`.
- Rama: `snd/status-reconciliation-106-wave-02`.
- Estado: COMPLETE — ready for integration.

## Objetivo

Sincronizar `STATUS.md`, `WORK-QUEUE.md` e `INTEGRATION-QUEUE.md` con el árbol canónico real: 106 entradas y 91 fuentes.

## Evidencia

- scan completo de 106 entradas en SHA `2d2e782916519f36952b39629df433f798413ec1`;
- diff incremental hasta `6020ef0ca75053cdd73a14aaf32896cef02b1704`: FND-014 → LINGUISTIC_REVIEW y KO-002 → EVIDENCE_CHECKED;
- Source Registry actual v0.19, `SND-SRC-0001…0091`.

## Regla

No modificar contenido lingüístico ni Source Registry. Solo reconciliar estado global y colas con evidencia reproducible.