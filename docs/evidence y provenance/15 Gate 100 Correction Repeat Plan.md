# MLS R33 Evidence & Provenance — Gate 100 Correction Repeat Plan

**Fecha:** 2026-09-23 UTC  
**Repeat ID:** `MLS-R33-EVIDENCE-GATE100-CORRECTION-REPEAT-20260923-A`  
**Estado:** PREPARED — NO EJECUTAR HASTA QUE PR #668 ESTÉ MERGED Y LIVE  
**Gate 500:** BLOQUEADO

## 1. Motivo

Gate 100 cerró 100/100 VERIFIED y 0 excepciones, pero la escalabilidad quedó en **CORRECT AND REPEAT** por dos señales:

- D1 reads: 1,342.14 por entrada vs 461.6 en Pilot 20;
- 52/99 entradas nuevas requirieron external discovery al inicio.

El triage inicial consumió 55,427 reads (~41% de los reads operativos del Gate).

## 2. Corrección bajo prueba

PR #668 cambia únicamente la estrategia de lectura de candidatos:

- `triageEntry()` conserva su contrato individual;
- `batchTriage()` comparte un Source Registry pool por idioma;
- el `JOIN + GROUP BY` del pool se ejecuta una vez por idioma dentro del batch, no una vez por entrada;
- ranking por topics continúa siendo específico por entrada y se calcula en memoria;
- VERIFIED/REVIEWED guards, Source policy, APA y Evidence state machine no cambian.

CI del PR #668: SUCCESS en run `35852952843`; producción SKIPPED.

## 3. Muestra

Manifest: `16 Gate 100 Correction Repeat Manifest.json`.

- 100 entradas;
- 10 idiomas;
- 10 entradas por idioma;
- 0 overlap con Pilot 20;
- 0 overlap con Gate 100;
- blob-locked;
- selección determinista;
- no cherry-picking.

### Regla explícita

Para reproducir correctamente el Gate 100 histórico se confirmó un detalle que el manifiesto anterior no explicitaba: la ventana elegible usa códigos con sufijo numérico `<=1000`.

En el repeat:

1. tomar archivos canónicos con sufijo <=1000;
2. excluir Pilot 20 y Gate 100;
3. ordenar filenames;
4. para slots 1..10 elegir índice cero-based `floor((slot - 0.5) * N / 10)`.

Esta reconstrucción reproduce el manifiesto histórico Gate 100 100/100 cuando se aplica a su snapshot base.

## 4. Fase A — benchmark read-only

Antes de crear una sola Source/Claim/Link nueva:

1. confirmar PR #668 merged y runtime live;
2. ejecutar triage de la muestra en dos bloques de 50;
3. registrar D1 rows read/write;
4. comprobar que las 100 entradas/modes corresponden al contrato esperado;
5. STOP si hay regresión semántica o la reducción de reads no es material.

No usar proposal/verify para “probar” la optimización.

## 5. Fase B — Evidence

Solo si Fase A pasa:

```
REGISTRY FIRST
→ EXTERNAL DISCOVERY ONLY WHEN NEEDED
→ PROPOSAL
→ APA VALIDATION
→ VERIFY
→ EXCEPTIONS SEPARATE
```

No crear REVIEWED humano sintético.

## 6. Criterios

### Calidad

- 100% complete al final;
- falseVerified = 0;
- excepciones explícitas y controladas;
- R32 intacto;
- FREE ONLY.

### Escala

- promedio D1 reads/entrada: preferido <=461.6;
- requisito mínimo: materialmente menor que 1,342.14;
- external discovery: <50%;
- control-plane commits/entrada: <=0.64;
- bytes lógicos: sin regresión material;
- writes/entrada: sin regresión material.

## 7. Decisión posterior

Al cerrar el repeat emitir exactamente una:

- `GO` → Gate 500 puede prepararse;
- `CORRECT AND REPEAT` → Gate 500 sigue bloqueado;
- `STOP` → detener escalamiento y revisar arquitectura.

## 8. Estado persistente

```yaml
gate100:
  quality: PASS
  scale: CORRECT_AND_REPEAT
optimization:
  pr: 668
  ci: PASS
  live: false
correctionRepeat:
  manifestPrepared: true
  started: false
gate500Authorized: false
```
