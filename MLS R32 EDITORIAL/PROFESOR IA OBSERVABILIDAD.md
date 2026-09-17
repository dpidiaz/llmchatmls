# Profesor IA — observabilidad

## Estado

Fase 14 del roadmap del Profesor IA.

Versión: `professorObservabilityVersion = 1.0`.

## Métricas

Se registran únicamente agregados locales de aperturas, solicitudes, éxitos, fallos, reintentos, cancelaciones y milisegundos acumulados. Las métricas se separan por idioma, acción rápida, profundidad y longitud.

## Privacidad

No se guardan preguntas, respuestas, títulos, códigos de entrada ni conversaciones. No se usa D1, `fetch`, `sendBeacon`, `XMLHttpRequest` ni WebSocket para telemetría. Los agregados permanecen en `localStorage` del dispositivo y pueden restablecerse localmente.

## Integración

La capa observa los estados visuales ya existentes (`thinking`, `responding`, `ready`, `offline`, `quota`, `retry`, `temporary-error`) y no crea una segunda implementación de red. Cada modal se observa una sola vez.

## Límites

Las métricas son diagnósticas y locales; no representan analítica global de todos los usuarios. AUTOOPT no consume estas métricas ni cambia perfiles automáticamente a partir de ellas.
