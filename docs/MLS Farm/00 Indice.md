# MLS Farm R1 — Índice

1. [Master Prompt MLS Farm R1](./01%20Master%20Prompt%20MLS%20Farm%20R1.md)  
   Contrato completo del worker distribuido, leases, checkpoints y reaper.

2. [Protocolo operativo MLS Farm R1](./02%20Protocolo%20operativo%20MLS%20Farm%20R1.md)  
   Flujo resumido, estados, recuperación y garantías de concurrencia.

## Estado

- Arquitectura: GitHub Issues.
- Cloudflare durante Farm: 0 interacciones.
- Batch default: 25.
- Batch permitido: 1–100.
- Lease: 60 minutos desde último progreso válido.
- Reaper: cada 15 minutos + lazy reap en cada claim.
- Checkpoint: 1–10 entradas.
- Scheduler: single-writer.
- Worker events: concurrentes por issue.
- Pilot 20: preservado automáticamente.
