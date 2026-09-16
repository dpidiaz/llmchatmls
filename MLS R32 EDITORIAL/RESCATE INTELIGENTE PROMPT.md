# Prompt de implementación · Rescate inteligente de deferred

Trabaja exclusivamente en `dpidiaz/llmchatmls`, rama `feat/autoopt-intelligent-deferred-rescue`.

## Contexto
MLS R32 ya tiene AUTOOPT, historial separado y un Panel de Salud privado. El siguiente objetivo es implementar un sistema de rescate inteligente para entradas `deferred` sin convertir AUTOOPT en un agente autónomo.

## Objetivo
Implementa un clasificador determinista y de cero coste que convierta cada `deferred` en un diagnóstico estructurado con causa, evidencia, confianza, retryability y recomendación editorial. Integra esos diagnósticos en el flujo manual de rescate y en el Panel AUTOOPT.

## Restricciones innegociables

- NO generar ni publicar artículos automáticamente.
- NO iniciar lotes ni rescates automáticamente.
- NO cambiar FIFO.
- NO rebajar R32 ni modificar `promptVersion` para mejorar métricas.
- NO modificar ni borrar artículos publicados, drafts, runs, cola, incidentes, historial o eventos existentes.
- NO mezclar idiomas ni familias en agregados.
- NO usar proveedores externos ni llamadas de IA para clasificar.
- Mantener `strictZeroCost` y arquitectura Cloudflare only.
- Mantener histórico y live separados.
- Si no hay evidencia suficiente, devolver `unknown`; nunca inventar causa.

## Categorías mínimas

`length`, `contract`, `structure`, `references`, `provider`, `format`, `semantic-risk`, `unknown`.

## Contrato del diagnóstico

Incluye al menos:

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

Conserva también el motivo original para auditoría cuando exista.

## Integración de rescate

`MLS rescate siguientes N` sigue siendo la autorización humana. El diagnóstico puede informar el siguiente intento, pero no ejecutarlo. Todas las entradas rescatadas deben atravesar las mismas validaciones R32 que cualquier publicación normal.

## Panel AUTOOPT

Extiende el panel privado existente para mostrar deferred live por categoría, idioma y familia, retryable vs no retryable y causas principales. Si el almacenamiento está vacío o alguna tabla no existe, la vista debe seguir siendo legible y parcial; no debe romper el panel.

## Persistencia

Prefiere reutilizar tablas/eventos existentes. No añadas migraciones salvo que sean estrictamente necesarias. Si puede derivarse el diagnóstico al leer los eventos actuales, hazlo de forma read-only para el panel. Si necesitas persistencia nueva, justifícala y hazla compatible con despliegues previos.

## Pruebas

Añade pruebas deterministas para cada categoría, `unknown`, separación de idioma/familia, ausencia de side effects, ausencia de auto-rescate, compatibilidad con el panel y almacenamiento vacío. Ejecuta la suite existente y amplíala sin borrar cobertura previa.

## Entrega

1. Inspecciona primero el código real actual.
2. Implementa el cambio mínimo robusto.
3. Ejecuta pruebas y dry run.
4. Documenta los cambios.
5. Abre PR contra `main`.
6. No hagas merge ni deploy hasta verificar resultados.
