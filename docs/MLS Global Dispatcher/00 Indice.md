# MLS Global Dispatcher R1 — Índice

Versión: 1.0  
Estado: **ACTIVE / CERTIFIED R1**  
Repositorio canónico: `dpidiaz/llmchatmls`

El Global Dispatcher define un único comando de entrada:

`MLS siguiente`

Todos los chats pueden usar exactamente el mismo comando. GitHub decide automáticamente qué trabajo elegible y no bloqueado asignar a cada worker.

## Documentos

1. [Master Prompt MLS Global Dispatcher R1](./01%20Master%20Prompt%20MLS%20Global%20Dispatcher%20R1.md)  
   Contrato completo que debe seguir cualquier chat worker.

2. [Protocolo operativo MLS Global Dispatcher R1](./02%20Protocolo%20operativo%20MLS%20Global%20Dispatcher%20R1.md)  
   Dispatcher, selección, prioridades, dependencias, concurrencia y estados.

3. [Leases, Locks y Recovery R1](./03%20Leases%20Locks%20y%20Recovery%20R1.md)  
   Blindaje frente a chats detenidos, workers zombis, commits huérfanos y colisiones.

4. [Work Registry y tipos de trabajo R1](./04%20Work%20Registry%20y%20tipos%20de%20trabajo%20R1.md)  
   Esquema durable de workstreams, locks, ramas, dependencias y tipos de assignment.

5. [Implementación y certificación R1](./05%20Implementacion%20y%20certificacion%20R1.md)  
   Evidencia de CI, smoke tests reales, recovery y concurrencia de 4 workers.

## Invariantes

- GitHub es el plano de control y la memoria durable.
- Un chat es un worker temporal y reemplazable.
- El chat no elige manualmente el workstream cuando usa `MLS siguiente`.
- El Dispatcher es single-writer para adjudicación.
- Ningún assignment activo puede colisionar en resource locks con otro assignment activo.
- ACK inicial: 5 minutos.
- Lease móvil tras ACK: 10 minutos.
- Reaper: cada 5 minutos y lazy reap al adjudicar.
- Commit durable antes de checkpoint.
- Un worker no debe acumular más de 2–3 operaciones significativas sin persistir.
- Un worker nunca escribe directamente a `main`.
- Un lease vencido no revive.
- Trabajo confirmado no expira; solo trabajo pendiente.
- Commits huérfanos se preservan y se recuperan antes de reasignar desde cero.
- Cloudflare/D1 no participan en trabajo editorial. Cloudflare solo puede aparecer en un assignment explícito de deployment/runtime.
- `MLS siguiente` es **CHAT ONLY — NO ChatGPT Work**.
- Esta especificación no autoriza Gate 500.

## Relación con Farms existentes

El Dispatcher no reemplaza internamente MLS Farm ni R33 Evidence Farm. Los trata como proveedores de trabajo especializados.

```text
Chats
  │
  └── MLS siguiente
        │
        ▼
Global Dispatcher
  ├── MLS Farm
  ├── R33 Evidence Farm
  ├── Code Tasks
  ├── Validation / QA
  ├── Integration
  └── Deployment
```

Hasta que el workflow del Global Dispatcher sea implementado y certificado, los comandos directos de Farm continúan siendo operativos de forma independiente.
\n- `06 Integration to main R1.md` — contrato fail-closed para integrar PRs certificados a `main`.\n