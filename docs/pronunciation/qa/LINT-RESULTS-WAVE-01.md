# MLS-SND — Resultados de lint wave 01

Fecha: 2026-10-11.

## Escaneo global de IDs

Ámbito integrado en `feat/mls-snd-foundation`:

- fundamentals: 18 entradas;
- representation: 10 entradas;
- languages: 43 entradas;
- comparative: 1 entrada.

**Total:** 72 archivos de entrada.

Resultado:

- IDs únicos: 72;
- IDs duplicados: 0.

## Muestra transversal de contenido

Se comprobaron 9 entradas distribuidas entre:

- fundamentos;
- representación;
- inglés estadounidense;
- mandarín de Taiwán;
- coreano;
- japonés;
- ruso;
- comparativa.

Reglas comprobadas:

- ID filename ↔ H1;
- U+FFFD;
- NFC;
- sección Evidencia R33 para EVIDENCE_CHECKED;
- presencia de claims VERIFIED;
- SND-SRC referenciado existente en Source Registry.

Resultado:

**0 incidencias en la muestra.**

## Limitación del test

El escaneo completo de contenido no se ejecutó en una sola operación porque el conector GitHub impone un límite de llamadas por ejecución.

El script v0.1 se diseñó para ejecutar localmente/CI sobre todo el árbol sin esa limitación.

## Gate

El linter está listo para integración técnica, pero debe ejecutarse sobre un checkout completo antes de considerarlo CI obligatorio.
