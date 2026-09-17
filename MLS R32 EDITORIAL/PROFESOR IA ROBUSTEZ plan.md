# Profesor IA Robustez

Versión: `professorRobustnessVersion = 1.0`

## Objetivo

Hacer que el Profesor IA falle de forma controlada y recuperable ante problemas de red, proveedor, cuota, tiempo de espera, respuesta vacía, cancelación, doble envío o cambio de entrada.

## Contrato

- Solo puede existir una petición activa por modal del Profesor IA.
- Una petición se cancela explícitamente con `AbortController` al cerrar el modal, cambiar de entrada o pulsar «Cancelar».
- El timeout máximo por petición es de 45 segundos.
- Una respuesta cancelada o perteneciente a una entrada anterior nunca se inserta en la entrada nueva.
- Los errores se presentan con mensajes comprensibles y sin detalles internos innecesarios.
- El usuario puede reintentar la misma pregunta sin crear un segundo globo de usuario.
- Una pregunta fallida no permanece en el historial conversacional corto hasta que exista una respuesta válida.
- Errores de cuota, proveedor, red, timeout y respuesta vacía permanecen diferenciados.
- El doble clic o doble envío mientras hay una petición activa se ignora.

## Aislamiento

Esta capa solo interviene el flujo de `/api/chat` del Profesor IA. No modifica D1, publicación editorial, materialización, FIFO, AUTOOPT, Atlas, voz ni artículos publicados.

## Integración

Se instala después de contexto conversacional, preguntas sugeridas y enlaces internos, y antes de perfiles lingüísticos, preferencias, acciones rápidas y pronunciación. El Service Worker renueva su caché para entregar el JavaScript actualizado.
