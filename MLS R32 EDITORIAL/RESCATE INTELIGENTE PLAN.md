# Plan de trabajo · Rescate inteligente de deferred

## Objetivo
Convertir cada entrada `deferred` en un diagnóstico estructurado que explique por qué falló, qué evidencia lo sustenta y qué acción editorial conviene intentar, sin permitir que AUTOOPT publique, reintente ni cambie reglas por su cuenta.

## Principios

1. Mantener R32 como autoridad editorial.
2. Mantener la autorización humana para `MLS rescate siguientes N`.
3. No debilitar validaciones para aumentar la tasa de publicación.
4. No cambiar FIFO ni rescatar automáticamente.
5. No modificar entradas publicadas.
6. Mantener idiomas y familias separados en métricas y recomendaciones.
7. Cero coste externo: clasificación determinista basada en señales ya disponibles.
8. Fallar de forma segura: si la evidencia no alcanza, clasificar como `unknown`.

## Fase 1 · Inventario de señales

Revisar las causas de `deferred` ya emitidas por el flujo editorial y normalizarlas en un contrato estable.

Categorías iniciales:

- `length`
- `contract`
- `structure`
- `references`
- `provider`
- `format`
- `semantic-risk`
- `unknown`

Cada diagnóstico debe contener al menos:

- `entryId`
- `language`
- `family`
- `status`
- `category`
- `reasonCode`
- `evidence`
- `suggestedAction`
- `confidence`
- `retryable`
- `createdAt`

## Fase 2 · Clasificador determinista

Crear un clasificador que reciba errores, resultados de validación y metadatos existentes y produzca el diagnóstico.

Reglas:

- Nunca llamar a un proveedor de IA para clasificar.
- Priorizar señales explícitas sobre inferencias.
- No inventar una causa si faltan datos.
- Conservar el motivo original para auditoría.
- Permitir múltiples señales, pero elegir una causa primaria estable.

## Fase 3 · Recomendaciones de rescate

Asignar una recomendación concreta por categoría sin ejecutar acciones.

Ejemplos:

- `length`: regenerar conservando estructura y corrigiendo extensión.
- `contract`: regenerar respetando estrictamente el contrato R32 incumplido.
- `structure`: reconstruir secciones obligatorias y orden.
- `references`: eliminar o corregir referencias o marcadores prohibidos.
- `provider`: reintentar más tarde sin alterar el prompt editorial.
- `format`: normalizar formato y eliminar Markdown o HTML no permitido.
- `semantic-risk`: enviar a revisión semántica por muestra antes de publicar.
- `unknown`: mantener deferred y pedir revisión humana.

## Fase 4 · Integración con rescate manual

El comando existente `MLS rescate siguientes N` debe seguir siendo la autorización humana.

Antes del rescate, el sistema puede consultar el diagnóstico y usarlo para preparar el intento, pero:

- no inicia rescates solo;
- no cambia FIFO;
- no cambia promptVersion;
- no reduce estándares;
- no publica sin pasar las validaciones normales.

## Fase 5 · Panel AUTOOPT

Añadir una sección Deferred al panel de salud con:

- total deferred vivo;
- distribución por categoría;
- idiomas y familias afectadas;
- porcentaje retryable;
- tendencia reciente;
- principales causas;
- diagnósticos con evidencia insuficiente.

No mezclar datos históricos con observaciones live.

## Fase 6 · Pruebas

Cubrir como mínimo:

1. clasificación de longitud;
2. contrato R32;
3. estructura;
4. referencias;
5. proveedor;
6. formato;
7. semantic risk explícito;
8. unknown cuando no hay evidencia;
9. separación por idioma y familia;
10. no ejecución automática de rescate;
11. no publicación automática;
12. no modificación de FIFO;
13. respuesta legible con almacenamiento vacío;
14. compatibilidad con panel AUTOOPT existente.

## Criterio de aceptación

El sistema puede explicar de forma determinista por qué una entrada quedó deferred, sugerir la corrección adecuada y mostrar agregados en AUTOOPT, pero la entrada permanece deferred hasta que el usuario autorice un rescate y vuelva a superar R32.
