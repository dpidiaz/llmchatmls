# MLS-SND — Reconciliación editorial de JA-006

- **Entrada:** SND-JA-006 — Acento tonal de Tokio como referencia
- **Fecha:** 2026-10-13
- **Rama:** `snd/ja006-dependency-reconcile-wave-01`
- **Versión de partida:** blob `8cec7ad23bc699d563bf26ecf48e09452d2a0d2d`
- **Resultado:** `EDITORIAL_REVIEW / DEPENDENCIES_RESOLVED`

## 1. Blocker anterior

La wave japonesa de composition readiness bloqueó JA-006 porque JA-007 y la arquitectura prosódica del perfil todavía estaban pendientes de integración/reconciliación.

## 2. Estado actual

- JA-007 está `READY_FOR_COMPOSITION` y mantiene visible variación, cambio y alcance temporal.
- FND-014 está `READY_FOR_COMPOSITION` y conserva “acento tonal” como rótulo de trabajo con definición local.
- FND-015 está `READY_FOR_COMPOSITION` y mantiene entonación separada de tono/acento.
- JA-001 ya había pasado composition readiness como política de referencia con límites.

Por tanto, el handoff de JA-006 ya no depende de una pieza prosódica pendiente para interpretar su núcleo.

## 3. Invariantes

- Tokio/lengua común es ancla prosódica, no Japón universal.
- OJAD se usa como recurso institucional de acento para enseñanza/consulta.
- palabra aislada no agota patrón natural de pitch;
- “acento tonal” no se atribuye a NINJAL como traducción oficial;
- no se fija una tipología exhaustiva ni reglas universales para todas las palabras.

## 4. Cambios

Solo metadata de dependencia y constancia del gate. No cambian JA006-C01…C04, SND-SRC-0014, localizadores, análisis ni terminología material.

## 5. Próximo gate

Composition readiness sobre esta versión reconciliada.
