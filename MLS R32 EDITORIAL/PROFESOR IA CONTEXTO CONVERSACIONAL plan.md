# Profesor IA Contexto Conversacional

Versión: `professorConversationVersion = 1.0`

## Objetivo

Mantener un contexto corto de conversación dentro de una misma entrada para permitir seguimientos como «¿Y en pasado?» sin convertir MLS en un LMS, curso o historial permanente.

## Contrato

- La unidad de aislamiento es `languageSlug + entryCode`.
- El historial usa `sessionStorage` cuando está disponible y memoria local como fallback.
- No se usa D1, backend, cuenta de usuario ni persistencia entre sesiones del navegador.
- Máximo de 10 mensajes y 8000 caracteres de contexto conservado.
- El contexto más reciente tiene prioridad.
- Cambiar de entrada o enciclopedia no mezcla conversaciones.
- El artículo publicado nunca se modifica.
- Perfil lingüístico, preferencias, acciones rápidas y pronunciación siguen siendo capas independientes.
- Se añade «Limpiar conversación» para borrar solo el contexto de la entrada actual.

## Persistencia de predeploy

El parche se aplica al `public/js/ai.js` que R32 reconstruye desde el bundle durante `predeploy`, antes de instalar perfiles, preferencias, acciones rápidas y pronunciación.

## Fuera de alcance

- historial voluntario permanente
- sincronización entre dispositivos
- almacenamiento de conversaciones en D1
- analítica de preguntas completas
- modificación de artículos
- ejercicios, progreso o rutas obligatorias
