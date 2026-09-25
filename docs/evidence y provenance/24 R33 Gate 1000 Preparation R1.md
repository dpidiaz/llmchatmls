# MLS R33 — Gate 1000 Preparation R1

**Estado:** PREPARED / NOT AUTHORIZED  
**Arquitectura:** GitHub-native  
**Cloudflare editorial:** 0  
**D1 editorial:** 0  
**Ejecución futura:** Global Dispatcher only  
**Active pool durante preparación:** Gate 500

## 1. Objetivo

Preparar Fase 6 / Gate 1000 sin iniciar producción editorial. Gate 1000 mide sostenibilidad operativa a escala de 1,000 entradas antes de autorizar Fase 7 / resto del corpus.

## 2. Pool candidato

Manifest:

`docs/evidence y provenance/23 R33 Gate 1000 Pool.json`

Contrato:

- poolId: `MLS-R33-GITHUB-NATIVE-GATE-1000`;
- 1,000 entradas;
- 10 idiomas;
- 100 entradas por idioma;
- selección determinista por cuantiles discretos;
- exclusión de Pilot 20 + Gate 100 + Correction Repeat 100 + Benchmark 100 + Gate 500;
- 820 códigos previos excluidos;
- `contentBlobSha` fijado por entrada;
- `status: prepared`;
- `active: false`;
- `gate1000Authorized: false`;
- `dispatcherOnly: true`.

## 3. Selección determinista

Por cada idioma:

1. ordenar por código todas las entradas canónicas;
2. excluir los códigos de los cinco pools previos;
3. dividir la lista elegible en 100 intervalos discretos:
   - `inicio = floor((slot-1) * N / 100)`;
   - `fin = floor(slot * N / 100) - 1`;
4. elegir `floor((inicio + fin) / 2)`.

Este algoritmo fue validado retrospectivamente contra Gate 500 y reproduce **500/500** de sus selecciones.

No existe cherry-picking manual.

## 4. Freshness y capacidad

Códigos previos únicos excluidos: **820**.

Entradas elegibles antes de seleccionar Gate 1000:

- Inglés: 684
- Portugués: 1117
- Italiano: 728
- Francés: 1077
- Alemán: 1019
- Japonés: 945
- Chino de Taiwán: 934
- Coreano: 1012
- Ruso: 949
- Español de Guatemala: 848

El pool seleccionado tiene 100 por idioma, 0 duplicados y 0 overlap con los 820 códigos previos.

## 5. Active Pool Control

Durante G1/G2 no se modifica:

`docs/evidence y provenance/21 R33 Active Pool Control.json`

Gate 500 continúa como:

- activePoolId = `MLS-R33-GITHUB-NATIVE-GATE-500`;
- authorized;
- active.

Gate 1000 no será activado hasta una autorización explícita posterior.

## 6. Preflight fail-closed

Herramienta:

`scripts/R33 gate1000 control.cjs`

Comando:

```bash
npm run r33:gate1000:check
```

Valida:

- 1,000 códigos únicos;
- 100 por idioma;
- 820 códigos previos;
- 0 overlap;
- 0 content blob drift;
- GitHub-only;
- dispatcherOnly;
- Cloudflare/D1 editorial deshabilitados;
- Gate 500 todavía activo y autorizado.

La herramienta de preparación no implementa ni ejecuta activación.

## 7. CI

`test:r33-github-native` incluye:

- `test/r33 gate1000 preparation.test.cjs`;
- preflight Gate 1000;
- checks R33 existentes;
- GitHub-only guard.

## 8. Operación prevista después de autorización

Se conservan los parámetros probados por Gate 500:

- claim default: 25;
- claim máximo: 50;
- checkpoint máximo: 10;
- integración serializada: waves de 50.

Para 1,000 entradas, la escala prevista es 20 waves de 50. Esta cifra describe la topología operativa; no autoriza ejecución.

## 9. Exit gate de preparación

Gate 1000 queda listo **para solicitar autorización** solamente cuando:

- pool = 1,000;
- 100×10 idiomas;
- 0 overlap;
- 0 blob drift;
- R33 Gate 1000 Preparation Tests PASS;
- R33 GitHub Native Tests PASS;
- Gate 500 sigue como activePool;
- Gate 1000 sigue inactive/unauthorized;
- Cloudflare/D1 editorial = 0.

Hasta entonces, y después hasta autorización explícita, no producir Evidence Gate 1000.
