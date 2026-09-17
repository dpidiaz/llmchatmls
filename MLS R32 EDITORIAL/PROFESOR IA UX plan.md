# Profesor IA UX integral

Versión: `professorUXVersion = 1.0`

## Objetivo

Mejorar la interfaz del Profesor IA sin alterar su lógica, contenido, proveedor, persistencia ni arquitectura editorial.

## Contrato visual

El diálogo del Profesor IA usa una superficie clara con texto oscuro y contraste legible. El contenido principal, controles, estados, textarea, enlaces y botones mantienen un cuerpo mínimo equivalente a 11 pt. Los controles táctiles tienen una altura mínima de 44 px.

En pantallas pequeñas el diálogo ocupa el ancho disponible, se presenta como panel inferior y reorganiza el área de composición para que el campo de pregunta conserve espacio suficiente y los botones de enviar y cancelar sean fáciles de tocar.

## Accesibilidad

La capa añade etiquetas accesibles a entrada, enviar, cancelar, cerrar y limpiar conversación cuando no existen. El estado del Profesor IA usa `role=status` y `aria-live=polite`; el historial usa `role=log` y anuncia contenido nuevo. Los controles interactivos conservan foco visible mediante `:focus-visible`.

Cuando el sistema operativo solicita movimiento reducido, animaciones, transiciones y desplazamiento suave quedan desactivados dentro del modal.

## Arquitectura

La mejora se instala como una capa no destructiva sobre `MLS.aiTutor.open`. El diálogo existente se mejora después de abrirse mediante microtarea o fallback asíncrono. No reescribe el núcleo conversacional ni modifica el artículo.

## Invariantes

No modifica R32, FIFO, AUTOOPT, D1, materialización, Atlas, TTS, voz, proveedor, modelo, perfiles lingüísticos, preferencias, contexto conversacional, comparación conceptual, pronunciación ni artículos publicados.

El diseño mantiene la naturaleza enciclopédica del MLS: no añade progreso, ejercicios, exámenes, gamificación ni rutas obligatorias.
