# MLS Global Dispatcher R1 — Work Registry y tipos de trabajo

## 1. Propósito

El Work Registry define **qué puede asignar** el Global Dispatcher.

El chat no crea trabajo arbitrario al ejecutar \`MLS siguiente\`; solicita uno de los work items ya declarados o generados por un provider autorizado.

Ruta propuesta de implementación:

\`MLS R32 EDITORIAL/global dispatcher/work registry.json\`

Los estados operativos volátiles pueden vivir en GitHub Issues; la definición durable del trabajo vive en Git.

## 2. Esquema mínimo

\`\`\`json
{
  "workId": "public-evidence-generator",
  "version": 1,
  "title": "Generar Evidence público desde GitHub",
  "workType": "code_task",
  "status": "ready",
  "priority": 20,
  "createdAt": "2026-09-23T00:00:00.000Z",
  "dependsOn": [],
  "resourceLocks": [
    "system:public-evidence-generator",
    "path:data/evidence/by-code"
  ],
  "allowedPaths": [
    "scripts/",
    "data/evidence/",
    "test/",
    ".github/workflows/"
  ],
  "branchPolicy": {
    "mode": "assignment",
    "prefix": "worker/public-evidence-generator"
  },
  "provider": "global",
  "instructions": "Implementar el generador estático GitHub Evidence → data/evidence/by-code.",
  "validation": [
    "unit-tests",
    "github-native-guard"
  ],
  "completion": {
    "requiresCommit": true,
    "requiresValidation": true
  }
}
\`\`\`

## 3. Campos

### workId
Identidad estable y única.

### version
Incrementa cuando cambia materialmente el contrato del work item.

### title
Descripción humana breve.

### workType
Uno de los tipos autorizados.

### status
Definición durable de elegibilidad:

- \`draft\`
- \`blocked\`
- \`ready\`
- \`active\`
- \`recovery_required\`
- \`done\`
- \`cancelled\`

El assignment state es separado del work state.

### priority
Menor entero = mayor prioridad.

### dependsOn
Work IDs que deben alcanzar estado requerido antes de ejecutar.

### resourceLocks
Recursos exclusivos que deben adquirirse atómicamente.

### allowedPaths
Perímetro de escritura.

### branchPolicy
Cómo crear/reusar rama.

### provider
Origen del trabajo:

- \`global\`
- \`mls-farm\`
- \`r33-farm\`
- \`qa\`
- \`integration\`
- \`deployment\`

### instructions
Contrato específico del assignment.

### validation
Checks obligatorios antes de finish.

### completion
Criterios de terminalidad.

## 4. Tipos R1

### editorial_batch

Para unidades independientes de contenido/Evidence.

Campos adicionales sugeridos:

\`\`\`json
{
  "provider": "r33-farm",
  "units": ["MLS-V06-0101", "MLS-V06-0102"],
  "checkpointSizeMax": 10
}
\`\`\`

Locks por entrada o batch.

### code_task

Desarrollo técnico.

Debe declarar:

- branch;
- allowedPaths;
- tests;
- locks de subsistema.

### validation

No debe mutar producto salvo archivos de reporte explícitamente permitidos.

Puede certificar:

- commit;
- PR;
- artifacts;
- corpus subset.

### integration

Consume outputs de otros work items.

Debe declarar refs exactos y criterios de merge.

### deployment

Único tipo donde Cloudflare/runtime puede estar autorizado.

Debe declarar:

\`\`\`json
{
  "runtimeAccess": {
    "cloudflare": true,
    "editorialReadsFromCloudflare": false,
    "editorialWritesToCloudflare": false
  }
}
\`\`\`

### recovery

Normalmente generado por el reaper, no escrito manualmente.

Referencia assignment anterior y commits huérfanos.

## 5. Ejemplo de cola paralela

\`\`\`json
[
  {
    "workId": "r33-batch-ja-001",
    "workType": "editorial_batch",
    "priority": 30,
    "resourceLocks": ["entry:MLS-V06-0101", "entry:MLS-V06-0102"]
  },
  {
    "workId": "r33-batch-ko-001",
    "workType": "editorial_batch",
    "priority": 30,
    "resourceLocks": ["entry:MLS-V08-0101", "entry:MLS-V08-0102"]
  },
  {
    "workId": "public-evidence-generator",
    "workType": "code_task",
    "priority": 20,
    "resourceLocks": ["system:public-evidence-generator", "path:data/evidence/by-code"]
  }
]
\`\`\`

Los tres pueden ejecutarse simultáneamente porque no comparten locks.

## 6. Ejemplo de conflicto

\`\`\`text
Work A:
  path:data/evidence/by-code

Work B:
  path:data/evidence/by-code/MLS-V06-0101.json
\`\`\`

R1 considera conflicto jerárquico.

Work B permanece ready y el Dispatcher selecciona otro trabajo para ese chat.

## 7. Dependency example

\`\`\`text
public-evidence-generator
        ↓
reader-static-evidence
        ↓
e2e-evidence-certification
        ↓
deployment-evidence
\`\`\`

Los batches R33 independientes pueden seguir ejecutándose en paralelo si no dependen de esa cadena.

## 8. Scope extension

Un worker descubre que necesita editar un path no autorizado.

No lo edita.

Registra:

\`scope_extension_required\`

El Scheduler/maintainer puede:

- ampliar work item con nueva versión;
- crear dependency nuevo;
- crear work item separado.

Esto evita que un worker expanda silenciosamente su lock footprint.

## 9. Providers y trabajo dinámico

Un provider puede materializar work items dinámicos.

Ejemplo R33 Farm:

1. Dispatcher pide unidad a provider.
2. Provider reserva códigos según su ledger.
3. Dispatcher registra esos códigos como locks.
4. Assignment incluye batch especializado.
5. Checkpoints se reflejan en ambos planos de forma idempotente.

La implementación debe evitar doble lease. Preferencia R1: **un solo ownership efectivo**, reutilizando el lease del provider cuando sea posible.

## 10. Terminalidad

Un work item no queda \`done\` solo porque un chat diga “terminé”.

Debe cumplirse \`completion\`.

Ejemplo:

\`\`\`json
{
  "completion": {
    "requiresCommit": true,
    "requiresValidation": true,
    "requiredChecks": [
      "MLS Farm Tests",
      "R33 GitHub Native Tests"
    ]
  }
}
\`\`\`

## 11. Historial

Nunca reescribir silenciosamente un work item terminal para reutilizar su ID.

Si se requiere una nueva iteración:

- incrementar versión cuando sea misma unidad lógica compatible; o
- crear nuevo \`workId\` si cambia el objetivo.

Assignments conservan referencia a la versión exacta.

## 12. Gate 500

El Work Registry puede representar un futuro trabajo Gate 500, pero debe permanecer \`blocked\` hasta autorización explícita y criterios previos satisfechos.

El simple hecho de ejecutar \`MLS siguiente\` no constituye autorización de Gate 500.
