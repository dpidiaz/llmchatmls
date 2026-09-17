# Profesor IA — estado final

## Alcance

Este documento consolida la arquitectura final del Profesor IA dentro de MASTER LANGUAGE SYSTEM R32. Profesor IA sigue siendo una ayuda contextual de una enciclopedia: no convierte MLS en curso, LMS, examen o tutor con progresión obligatoria.

## Arquitectura

El núcleo se reconstruye desde el bundle R32 durante `predeploy` y las mejoras persistentes se aplican mediante scripts idempotentes. Las capas se mantienen separadas para conversación, sugerencias, enlaces, robustez, optimización, cancelación, perfiles, preferencias, acciones rápidas, comparación, pronunciación, UX, estados visuales y observabilidad.

## Versiones funcionales

- Contexto conversacional: `professorConversationVersion = 1.0`.
- Preguntas sugeridas: versión 1.0.
- Enlaces internos: versión 1.0.
- Robustez: `professorRobustnessVersion = 1.0`.
- Optimización de prompt: `professorPromptOptimizationVersion = 1.0`.
- Cancelación segura: `professorCancellationVersion = 1.0`.
- Perfiles lingüísticos: versión 1.0.
- Preferencias: `professorPreferencesVersion = 1.0`.
- Profundidad: `professorDepthContractVersion = 1.0`.
- Longitud: `professorLengthVersion = 1.0`.
- Acciones rápidas: versión 1.0.
- Comparación conceptual: versión 1.0.
- Pronunciación: versión 1.0.
- UX: versión 1.0.
- Estados visuales: `professorVisualStatesVersion = 1.0`.
- Observabilidad: `professorObservabilityVersion = 1.0`.

## Perfiles y variantes

Existen perfiles separados para español de Guatemala, inglés, portugués de Brasil, italiano, francés, alemán, japonés, mandarín de Taiwán, coreano y ruso. Las capas no deben sustituir la variante canónica ni la escritura principal de cada enciclopedia.

## Preferencias

El usuario puede combinar idioma de explicación, profundidad `simple | normal | technical` y longitud `brief | normal | extended`. Profundidad y longitud son independientes.

## Acciones y comparación

Las acciones rápidas incluyen simplificación, profundización, ejemplos, uso, comparación, diferencias, errores comunes, resumen, alternativas y pronunciación, además de acciones específicas por idioma. La comparación conceptual resuelve conceptos existentes del mismo MLS mediante coincidencias controladas y no inventa códigos ni usa fuzzy matching abierto.

## Conversación

La conversación inmediata se aísla por idioma y entrada. Se limita a 10 mensajes y 8000 caracteres y usa `sessionStorage`. Cambiar de entrada o cerrar el modal aborta solicitudes activas y bloquea respuestas tardías.

## Pronunciación

La pronunciación conserva la escritura canónica como principal y aplica contratos propios de cada idioma: IPA y variación regional cuando corresponde, fenómenos del portugués brasileño, liaison y enchaînement en francés, mora y longitud en japonés, tonos en mandarín de Taiwán, batchim en coreano y acento léxico en ruso, entre otros fenómenos pertinentes.

## Enlaces internos

Los enlaces solo apuntan a conceptos existentes en la misma enciclopedia. Se admiten títulos y alias controlados; no se crean entradas ni relaciones por similitud difusa.

## UX y estados

La interfaz prioriza legibilidad mínima de 11 pt, fondos claros con texto oscuro, objetivos táctiles de al menos 44 px, diseño móvil, foco visible, ARIA y `prefers-reduced-motion`. Los estados explícitos son `ready`, `thinking`, `responding`, `offline`, `quota`, `retry` y `temporary-error`.

## Almacenamiento y privacidad

- Preferencias: `localStorage`.
- Conversación corta: `sessionStorage` por idioma y entrada.
- Observabilidad: agregados locales en `localStorage`.
- No se guardan preguntas ni respuestas en observabilidad.
- No se añade almacenamiento D1 para conversaciones del Profesor IA.
- No se envía telemetría del Profesor IA a un servidor.

## Costo

El contexto del cliente se limita a 11500 caracteres. La conversación se limita a 10 mensajes y 8000 caracteres. Las capas del Profesor no crean solicitudes de red propias. La materialización conserva política Cloudflare only con proveedores externos configurados vacíos. La auditoría evita presentar una cifra monetaria por respuesta que el código no puede demostrar de forma estable.

## Rendimiento

CI impone un presupuesto estático de 256 KiB para el conjunto de módulos `profesor ia *.js`, prohíbe polling con `setInterval`, exige observadores idempotentes y conserva `network first` para código en el Service Worker.

## Observabilidad

Se registran localmente aperturas, solicitudes, éxitos, fallos, reintentos, cancelaciones y tiempo acumulado. Los agregados se separan por idioma, acción, profundidad y longitud. No incluyen texto libre, títulos ni códigos de entrada. AUTOOPT no consume estas métricas ni se autoconfigura a partir de ellas.

## Matriz de regresión

La suite transversal protege las diez enciclopedias, sus perfiles y escrituras canónicas, el aislamiento entre idiomas, la independencia profundidad/longitud, la no mutación del artículo, pronunciación, conversación, enlaces, robustez, cancelación, UX, estados, costo y rendimiento.

## Límites conocidos

- La observabilidad es local al dispositivo y no equivale a analítica global.
- Los enlaces internos requieren una coincidencia existente y controlada; si no existe, no se inventa.
- La disponibilidad de inferencia depende de la capacidad y cuota de Cloudflare Workers AI.
- La conversación corta no se sincroniza entre dispositivos.
- Profesor IA no publica artículos ni inicia lotes editoriales.
- AUTOOPT no puede cambiar perfiles, variantes o comportamiento del Profesor de forma autónoma.

## Riesgos técnicos

El principal riesgo estructural es que el bundle R32 cambie anclas internas utilizadas por los instaladores. Por eso `predeploy` y la suite fallan cerrado cuando una capa crítica ya no puede aplicarse de forma segura. Otros riesgos son cuota del proveedor, caché antigua del cliente y crecimiento futuro del JavaScript, todos cubiertos por estados, renovación de Service Worker y guardrails de CI.

## Trabajo futuro opcional

Cualquier evolución posterior debe preservar R32, costo cero obligatorio, variantes canónicas, aislamiento por idioma, privacidad local y naturaleza enciclopédica. Las mejoras futuras deben entrar mediante nuevas versiones explícitas y regresiones antes de producción.
