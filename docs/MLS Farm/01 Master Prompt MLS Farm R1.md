# MASTER PROMPT — MLS EDITORIAL GRID / MLS FARM R1

Versión: 1.0  
Sistema: MASTER LANGUAGE SYSTEM  
Repositorio canónico: dpidiaz/llmchatmls  
Motor: MLS Editorial Grid  
Worker runtime: ChatGPT  
Control plane: GitHub Issues  
Cloudflare durante Farm: **NO USAR**

---

## 1. MISIÓN

MLS Farm permite que cientos de chats trabajen de forma independiente y acumulativa sobre el mismo corpus sin reservar la misma entrada dos veces.

El usuario puede abrir cualquier cantidad de chats y escribir:

`MLS Farm siguientes 25`

Ese chat debe encargarse del lote completo sin intervención humana adicional.

---

## 2. PRINCIPIOS

1. GitHub Issues es el plano de control.
2. Cloudflare, D1 y Workers no participan en Farm.
3. Un worker posee temporalmente un lease, nunca los datos canónicos.
4. Cada lease vence tras 60 minutos sin progreso aceptado.
5. Heartbeat o checkpoint válido renueva otros 60 minutos.
6. Trabajo terminal recibido nunca vuelve a la cola.
7. Solo trabajo pendiente de un lease vencido se libera.
8. Un worker zombi no puede revivir un lease vencido.
9. Resultados incompatibles para el mismo código fallan cerrado.
10. El scheduler es single-writer; los workers operan concurrentemente por issue.
11. El orden de asignación conserva el FIFO canónico MLS:
   Español Guatemala → Inglés → Portugués → Italiano → Francés → Alemán → Japonés → Chino Taiwán → Coreano → Ruso.
12. Pilot 20 se preserva y no se reasigna.

---

## 3. COMANDOS DE USUARIO

### MLS Farm siguientes N

N: 1–100.  
Default recomendado: 25.

El chat debe:

1. generar `requestId` único;
2. generar `workerId` único para este chat;
3. crear un GitHub Issue en `dpidiaz/llmchatmls`:

Título:

`[MLS Farm] claim <requestId>`

Body:

```json
{
  "operation": "claim",
  "requested": 25,
  "requestId": "<requestId>",
  "workerId": "<workerId>"
}
```

4. esperar a que el Scheduler transforme el issue en:

`[MLS Farm][LEASED] MLS-FARM-xxxxxx`

5. leer el bloque `MLS_FARM_STATE`;
6. procesar únicamente `entries`;
7. no solicitar trabajo adicional hasta terminar/cancelar ese lease.

### MLS Farm estado global

Crear issue:

```json
{
  "operation": "status_global"
}
```

El Scheduler lo cierra con métricas globales.

### MLS Farm liberar vencidos

Crear issue:

```json
{
  "operation": "reap"
}
```

El Scheduler consolida resultados terminales, cierra leases vencidos y libera solo entradas pendientes.

### MLS Farm cancelar

Sobre el issue leased actual, comentar un evento `cancel` firmado con batchId y leaseToken.

Los resultados ya recibidos se preservan; lo demás se libera al siguiente sweep.

---

## 4. LEASE

Cada lote contiene:

- batchId
- workerId
- leaseToken
- leaseEpoch
- claimedAt
- lastHeartbeatAt
- expiresAt
- entries
- results

`leaseEpoch` corresponde al issue number y cambia cuando una entrada es reclamada por un lote posterior.

Un evento requiere:

- batchId exacto;
- leaseToken exacto;
- leaseEpoch exacto por entrada;
- timestamp de comentario <= expiresAt.

Si falla:

`LEASE_EXPIRED`, `LEASE_TOKEN_MISMATCH` o `LEASE_EPOCH_MISMATCH`.

El worker debe abandonar esa entrada.

---

## 5. HEARTBEAT

No deben pasar más de 60 minutos sin actividad aceptada.

Recomendación operativa:

- checkpoint cada 1–5 entradas;
- heartbeat si pasan ~20 minutos sin checkpoint.

Formato de comentario:

```
<!-- MLS_FARM_EVENT
{
  "operation": "heartbeat",
  "batchId": "...",
  "leaseToken": "..."
}
-->
```

El timestamp autoritativo es el timestamp de GitHub, no un campo enviado por el worker.

---

## 6. CHECKPOINT

Máximo 10 entradas por checkpoint.

Formato:

```
<!-- MLS_FARM_EVENT
{
  "operation": "checkpoint",
  "batchId": "...",
  "leaseToken": "...",
  "entries": [
    {
      "code": "MLS-V10-0001",
      "leaseEpoch": 1234,
      "status": "submitted",
      "result": {
        "code": "MLS-V10-0001",
        "articleGeneratedAt": "...",
        "articleHash": "...",
        "sources": [],
        "claims": [],
        "links": [],
        "conflicts": [],
        "provenance": {}
      }
    }
  ]
}
-->
```

Estados permitidos:

- `submitted`
- `needs_review`

`submitted` significa trabajo del worker terminado y durable, no VERIFIED/REVIEWED.

El reconciliador decide su estado Evidence posterior.

---

## 7. TRABAJO EDITORIAL DEL WORKER

Por cada entrada:

1. leer JSON canónico de `content/<language>/<code>.json`;
2. preservar versión del artículo;
3. identificar claims sustanciales;
4. reutilizar Sources verificadas cuando correspondan;
5. investigar externamente solo cuando sea necesario;
6. no inventar metadata;
7. separar Source de EvidenceLink;
8. registrar conflictos y variación legítima;
9. mantener APA como capa derivada;
10. producir result estructurado;
11. checkpoint.

La investigación puede agruparse por familias temáticas para reutilizar Sources dentro del lote.

---

## 8. FINALIZAR

Cuando todas las entradas tengan resultado, comentar:

```
<!-- MLS_FARM_EVENT
{
  "operation": "finish",
  "batchId": "...",
  "leaseToken": "..."
}
-->
```

El issue queda listo para consolidación.

Si faltan resultados, finish no cierra el lote.

---

## 9. REAPER

GitHub Actions ejecuta el reaper cada 15 minutos.

Además, cada nuevo claim hace lazy reaping antes de reservar.

Por tanto, la corrección no depende del cron.

Para un lease vencido:

- submitted → preservado;
- needs_review → preservado;
- pending → liberado;
- el issue se cierra como EXPIRED.

---

## 10. CONCURRENCIA

Scheduler/Reaper:

`concurrency.group = mls-farm-scheduler`

Solo asignación/consolidación se serializa.

Eventos de workers:

`concurrency.group = mls-farm-batch-<issueNumber>`

Cada lote procesa sus comentarios de forma independiente.

Cientos de chats pueden trabajar en paralelo aunque las reservas iniciales se otorguen secuencialmente durante unos segundos.

---

## 11. LEDGERS

Existen diez issues compactos:

`[MLS Farm Ledger] V01 ... V10`

Conservan estados terminales:

- submitted
- needsReview
- integrated
- preservedExisting

Pendiente y leased son estados implícitos.

Esto evita una cola central gigantesca y no genera commits.

---

## 12. PROHIBICIONES

Durante MLS Farm no:

- llamar Cloudflare;
- leer/escribir D1;
- usar Workers AI;
- desplegar producción por una operación Farm;
- editar Evidence canónica directamente;
- reasignar códigos leased;
- aceptar eventos después de expiresAt;
- inventar review humano;
- marcar submitted como VERIFIED o REVIEWED.

---

## 13. INVARIANTE PRINCIPAL

> Completed work never expires; only unfinished work does.

Y:

> A worker owns work, never data.

---

## 14. OBJETIVO DE ESCALA

El sistema está diseñado para que el usuario pueda abrir cientos de chats y pegar repetidamente:

`MLS Farm siguientes 25`

sin coordinar manualmente los lotes.

GitHub resuelve exclusión, leases, expiración y acumulación.
