# Profesor IA estados visuales

Versión: `professorVisualStatesVersion = 1.0`

## Objetivo

Formalizar estados visuales claros y coherentes para el Profesor IA reutilizando la información que ya producen las capas de conversación y robustez. Esta fase no crea peticiones, no reintenta automáticamente y no altera el historial.

## Estados

`ready`: el Profesor está disponible y no hay una operación activa.

`thinking`: existe una consulta activa pero todavía no ha comenzado a mostrarse contenido de respuesta.

`responding`: la respuesta está llegando y ya existe contenido visible en el mensaje en streaming.

`offline`: la interfaz detecta el mensaje de falta de conexión y lo presenta como estado de conectividad, no como fallo interno del contenido.

`quota`: el mensaje corresponde a un límite temporal de disponibilidad o cuota. No se presenta como error permanente.

`retry`: ocurrió un error recuperable y existe la acción Reintentar.

`temporary-error`: existe un error visible pero no se ofrece una acción de reintento inmediata.

## Prioridad

Cuota y falta de conexión tienen prioridad semántica sobre el estado genérico de reintento. Durante una operación activa, la existencia de texto de streaming distingue `responding` de `thinking`.

## Presentación

Los estados usan superficies claras y texto oscuro, coherentes con la Fase 11. El botón Reintentar conserva una altura táctil mínima de 44 px. La capa también actualiza `aria-busy` en el modal.

## Arquitectura

La capa observa cambios del modal mediante `MutationObserver` cuando está disponible y aplica `data-ai-state` sin modificar el contenido de la conversación. Si `MutationObserver` no está disponible, se aplica al menos el estado inicial.

No introduce `fetch`, almacenamiento, D1, publicación, FIFO, AUTOOPT, materialización ni lógica editorial.

## Invariantes

No modifica R32, artículos, perfiles, preferencias, acciones rápidas, comparación conceptual, pronunciación, proveedor, modelo, TTS, voz, Atlas ni el historial conversacional.
