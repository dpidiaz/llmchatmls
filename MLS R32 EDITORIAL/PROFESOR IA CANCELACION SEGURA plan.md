# Profesor IA — cancelación segura

## Estado

Fase 13 del roadmap del Profesor IA.

Versión: `professorCancellationVersion = 1.0`.

## Objetivo

Convertir en contrato verificable las garantías de cancelación ya implementadas por la capa de robustez, evitando que una regresión futura permita que una respuesta tardía termine en la entrada equivocada o que queden solicitudes activas sin limpiar.

## Garantías certificadas

1. Existe un controlador activo por modal mediante `WeakMap`.
2. Cada petición usa su propio `AbortController`.
3. Abrir otra entrada aborta primero la petición de la entrada anterior.
4. Cambiar el hash de navegación aborta la petición activa.
5. El streaming deja de escribir si el controlador fue abortado o el modal ya no existe.
6. El render final y el guardado en historial se bloquean si la petición fue abortada o el modal ya no existe.
7. Los errores tardíos de cierre o cambio de entrada no vuelven a pintar el modal ni contaminan otra entrada.
8. Mientras una petición está activa no se permite un segundo envío concurrente desde el mismo modal.
9. El controlador activo se elimina al finalizar la petición.

## Fallo cerrado

El script `scripts/habilitar cancelacion segura profesor ia.js` inspecciona el `public/js/ai.js` ya reconstruido y parcheado por robustez. Si falta cualquiera de las nueve garantías, `predeploy` falla en lugar de publicar una versión con cancelación incompleta.

## Límites

Esta fase no crea una segunda implementación de red, no añade almacenamiento, no modifica artículos, historial, prompts, respuestas ni proveedor, y no toca R32, FIFO, AUTOOPT, D1, materialización, Atlas, voz o TTS.

## Validación

La suite dedicada exige la presencia de todas las defensas, elimina cada una de manera simulada para comprobar que el contrato falle, verifica el orden aborto antes de retirar el modal, protege DOM e historial frente a respuestas tardías y comprueba idempotencia.
