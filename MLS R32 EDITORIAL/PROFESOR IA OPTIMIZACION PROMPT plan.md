# Profesor IA Optimización de Prompt

Versión: `professorPromptOptimizationVersion = 1.0`

## Objetivo

Reducir contexto redundante enviado a Workers AI sin perder instrucciones lingüísticas, preferencias, acciones, pronunciación ni información esencial de la entrada.

## Problema observado

Las capas del Profesor IA enriquecen de forma segura tanto el cuerpo como el lead de una entrada. Al convertir esa entrada en contexto para `/api/chat`, una misma directiva podía aparecer varias veces y competir con contenido lingüístico útil dentro del límite del backend.

## Contrato

- Las directivas `PROFILE`, `PREFERENCES`, `QUICK_ACTION` y `PRONUNCIATION` se recogen y deduplican por contenido exacto.
- Las directivas activas se colocan una sola vez y antes del texto largo de referencia, para que no queden truncadas al final del contexto.
- El lead y el cuerpo recuperan su texto enciclopédico limpio antes de enviarse.
- Tema objetivo, nota visible, definición y ejemplo se conservan.
- El contenido enviado por el cliente queda acotado a 11500 caracteres, por debajo del límite de 12000 caracteres del backend R32.
- El espacio restante se asigna dinámicamente al texto de referencia; no se aplica un corte fijo pequeño a todas las entradas.
- El historial conversacional sigue siendo una capa separada y ya acotada por la Fase 2.

## Seguridad

No cambia el proveedor, el modelo, R32, FIFO, AUTOOPT, D1, publicación, materialización, Atlas, voz ni los artículos. No añade almacenamiento ni llamadas de red.
