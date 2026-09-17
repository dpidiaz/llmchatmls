# Profesor IA — auditoría de rendimiento

## Estado

Fase 17 del roadmap del Profesor IA.

## Resultado

El Profesor IA conserva una arquitectura de capas pequeñas e idempotentes y evita mecanismos de polling permanente.

## Guardrails verificados

- El conjunto de módulos `profesor ia *.js` tiene un presupuesto máximo de 256 KiB en CI.
- Ninguna capa del Profesor IA puede introducir `setInterval`.
- Los observadores visuales y de observabilidad se marcan como instalados por modal para evitar duplicación.
- La observabilidad usa `MutationObserver` sobre cambios reales de interfaz y no temporizadores periódicos.
- El Service Worker mantiene `network first` para documentos, scripts y estilos y elimina cachés antiguas al activar una versión nueva.
- Las capas se instalan de manera idempotente para evitar listeners y wrappers duplicados.

## Alcance

La auditoría cubre guardrails deterministas del cliente y del proceso de build. No sustituye una medición de laboratorio de red, CPU o memoria sobre cada dispositivo físico, por lo que no se presentan tiempos sintéticos como si fueran rendimiento real de producción.

## Validación automática

`test/profesor ia auditoria rendimiento.test.cjs` ejecuta estas comprobaciones en CI para detectar regresiones futuras.
