# MLS-SND — Unicode QA results

## Wave 01

- Fecha: 2026-10-11
- Fixture: `qa/UNICODE-SMOKE-TEST.md`
- Resultado NFC inicial: FAIL
- Acción: fixture normalizado a NFC
- Resultado NFC final: PASS
- U+FFFD replacement character: 0
- Code points tras normalización: 1994
- Estado: PASS para almacenamiento textual

## Qué no prueba este test

Este resultado no valida todavía:

- cobertura de una familia tipográfica concreta;
- render de PDF;
- render de navegador;
- embedding de fuentes;
- comportamiento de impresión;
- separación visual de diacríticos en cada motor.

Esos controles pertenecen al gate de composición.
