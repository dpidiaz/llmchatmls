## 15. Metodo de desarrollo UX/UI

En septiembre se organizo una auditoria integral de experiencia y se dividio el trabajo en workstreams paralelos para que varios chats o agentes pudieran avanzar sin destruir el trabajo de otros. La separacion por ramas y responsabilidades transformo la colaboracion en un proceso parecido a un pequeño equipo de producto.

| Workstream | Responsabilidad principal |
| --- | --- |
| A | Navegacion y shell de experiencia. |
| B | Continuidad de lectura, resume y comportamiento de entrada. |
| C | Descubrimiento y “Tambien mira”. |
| D | Foundation y design system compartido. |
| E | Offline y resiliencia de experiencia. |
| F | Experiencia alrededor de Virtuoso y Profesor IA. |
| G | Accesibilidad y baseline responsive. |

El principio de integracion es preservar el trabajo ajeno: cada rama debe sincronizarse con la integracion actual, resolver conflictos sin eliminar scripts o tests de otros workstreams y volver a ejecutar su certificacion. Esta disciplina es especialmente importante porque varios cambios convergen sobre archivos comunes como package.json.

## 16. QA, pruebas y certificacion

La calidad del proyecto se ha desplazado de la revision visual informal hacia contratos reproducibles. Los workstreams recientes utilizan combinaciones de tests editoriales, baseline, predeploy, recovery y verificacion de despliegue.

La certificacion final del frente UX/UI incluye, entre otros elementos:

- QA Chromium en 320, 375, 390, 430, 768, 1024, 1280, 1440 y 1920 px.

- Verificacion de reflow a 200 % y 400 %.

- Foco visible y contraste suficiente en superficies claras.

- Skip link y navegacion por teclado.

- Pruebas conjuntas para navegacion, continuidad, offline, IA, baseline y discovery.

- Predeploy y recovery verify antes de considerar cerrado un workstream.

La presencia de estas pruebas es importante para el caso de estudio porque evidencia que las decisiones UX no se documentan solamente como intenciones; se traducen a contratos verificables.

## 17. Evolucion en un mes

La siguiente comparacion resume el cambio de madurez observado entre finales de agosto y el 20 de septiembre de 2026.

| Dimension | Finales de agosto | 20 de septiembre |
| --- | --- | --- |
| Modelo | Curriculo/editorial A1-C2 | Plataforma de conocimiento y herramientas |
| Contenido | 10 universos y arquitectura pedagogica | 10 133 entradas canonicas R32 |
| IA | En exploracion | Profesor IA, Virtuoso, generacion y traductor |
| Infraestructura | Experiencia editorial | Worker, D1, jobs, staging y circuit breaker |
| Offline | Principio pedagogico | Resiliencia de producto y pronunciacion local |
| UX/UI | Sistema editorial | Workstreams especializados con integracion |
| QA | Revision de contenido | Tests de navegacion, accesibilidad, recovery y predeploy |
| Operacion | Produccion manual/serial | Runs, lotes, reservas, estados y recuperacion |
| Costo | Consideracion secundaria | Politica FREE ONLY como contrato de arquitectura |

| INTERPRETACION El avance no se mide solo en features. El indicador mas fuerte es que el proyecto adquirio capas que normalmente aparecen cuando un producto entra en operacion: observabilidad, limites, fallback, recuperacion, QA, versionado e integracion. |
| --- |

## 18. Resultados y evidencia

Resultados documentables al cierre de este snapshot:

- Diez idiomas integrados bajo una arquitectura editorial comun.

- 10 133 entradas o semillas canonicas catalogadas en R32. [D1]

- Mapa de prefijos e identificadores por idioma para automatizacion y trazabilidad. [D1]

- Profesor IA multilingue con contexto, modulos por idioma y una politica pedagogica explicita. [D4]

- Infraestructura con Worker, D1, jobs, estado publico y recuperacion. [D1]

- Pronunciacion visual formalizada para sistemas de escritura no latinos. [D3]

- Desarrollo activo de pronunciacion local/offline y velocidad lenta.

- Virtuoso como capa de orientacion y busqueda del corpus.

- Staging en GitHub para separar produccion editorial de consumo de D1.

- Circuit breaker y politica FREE ONLY para controlar cuota de IA.

- Proceso UX/UI paralelo con ramas, PR, sincronizacion e integracion controlada.

- QA responsive y de accesibilidad como parte del cierre, no como revision posterior.

Estos resultados no deben interpretarse como “producto terminado”. El valor de la evidencia es mostrar que existe una base operacional y que el trabajo restante esta mejor definido que al inicio.

## 19. Problemas encontrados y decisiones

| Problema observado | Decision / correccion | Aprendizaje |
| --- | --- | --- |
| Paralelismo rompio FIFO | Reducir concurrencia y reconstruir desde D1. | Optimizar para el contrato del producto, no solo para throughput. |
| Queue y D1 divergieron | Tratar D1 como fuente recuperable y separar backlog fisico de logico. | Un estado visible no siempre representa la realidad completa. |
| Cuota gratuita inestable | Circuit breaker, presupuesto y degradacion. | La disponibilidad de IA es un estado operativo. |
| Contenido legacy podia contaminar busqueda | Esperar corpus R32 y eliminar legacy antes de indexacion definitiva. | La calidad de retrieval depende de la calidad de la fuente. |
| Varias features compiten por neurons | Presupuesto compartido de IA. | La gobernanza debe ser de plataforma. |
| Botones y rutas inconsistentes | Auditoria UX y workstreams separados. | Pequeños fallos de navegacion erosionan confianza. |
| Cambios paralelos chocan en archivos comunes | Ramas, integracion, preservacion de tests y certificacion. | La coordinacion es parte del desarrollo, no una tarea administrativa. |

## 20. Innovacion y valor diferencial

El caracter innovador del caso no depende de una tecnologia aislada. Surge de la combinacion de decisiones que normalmente pertenecen a disciplinas diferentes:

- Arquitectura del conocimiento linguistico en diez idiomas.

- Diseño pedagogico que evita tanto la infantilizacion como la sobrecarga terminologica.

- IA como apoyo contextual y no como fuente unica de verdad.

- Pronunciacion adaptada a la percepcion de un hispanohablante guatemalteco.

- Offline-first y resiliencia como parte de la experiencia de aprendizaje.

- Operacion deliberadamente gratuita, con gobernanza de recursos escasos.

- Versionado, recuperacion y observabilidad aplicados a produccion editorial.

- UX/UI tratado como sistema con pruebas y responsabilidades separadas.

- Identidad visual *image-free by design*: el sistema demuestra que una interfaz educativa puede construir caracter mediante tipografia, jerarquia, ritmo, espacio, componentes y microinteracciones sin depender de imagenes decorativas.

Esta interseccion permite presentar MLS como un caso de tecnologia educativa independiente, especialmente interesante en contextos donde la conectividad, el presupuesto y el acceso a servicios pagados no pueden darse por sentados.

## 21. Competencias demostradas

El proyecto evidencia un perfil de desarrollo interdisciplinario. No significa que una sola persona deba dominar cada especialidad al nivel de un equipo completo, pero si muestra capacidad para formular, integrar y dirigir problemas de distintas capas.

| Area | Evidencia en MLS |
| --- | --- |
| Diseño pedagogico | Progresion A1-C2, andamiaje, autonomia, pronunciacion y claridad explicativa. |
| Diseño de informacion | Taxonomia, arquitectura de entradas, relaciones y navegacion. |
| Diseño editorial | Sistema visual, componentes, lectura mobile y jerarquia. |
| UX/UI | Auditoria, continuidad, estados, microcopy, accesibilidad y responsive. |
| Arquitectura de software | Worker, API, persistencia, estados, idempotencia y circuit breaker. |
| IA aplicada | Prompting, contexto, routing, retrieval, reranking y consumo medible. |
| Data / operaciones | D1, metricas, cursores, runs, reservas, jobs y recuperacion. |
| Dev workflow | Git, ramas, PR, integracion, pruebas y despliegue. |
| Gestion de producto | Priorizacion, pivotes, restricciones, roadmap y decisiones basadas en fallos reales. |

## 22. Riesgos y limites

Un caso serio tambien debe registrar limites. Los principales riesgos actuales son:

- La escala del corpus no garantiza por si sola calidad pedagogica de cada articulo.

- La generacion gratuita sigue condicionada por cuota y disponibilidad de proveedores.

- El producto contiene componentes en distintos niveles de madurez: algunos desplegados, otros en integracion o certificacion.

- El corpus legacy debe eliminarse de forma definitiva para evitar inconsistencias futuras.

- La busqueda semantica solo sera tan fiable como la indexacion y la fuente canonica.

- La experiencia offline completa tiene limites, especialmente para funciones de IA online.

- La traduccion debe medir su consumo real antes de fijar una politica definitiva de reparto de neurons.

Estos limites no invalidan el proyecto. Funcionan como criterios de cierre y como evidencia de que el sistema ya puede ser evaluado con preguntas operativas concretas.

## 23. Hoja de ruta

La prioridad recomendada para convertir el estado actual en una version presentable como MLS 1.0 es consolidar, no expandir indiscriminadamente.

1. Completar y certificar el corpus R32 prioritario y cerrar lotes editoriales pendientes.

1. Eliminar definitivamente contenido legacy una vez asegurado el corpus canonico.

1. Cerrar integracion UX/UI A-G y ejecutar certificacion conjunta.

1. Estabilizar Virtuoso sobre la fuente canonica y validar fallbacks.

1. Integrar traduccion al presupuesto comun de IA y medir neurons reales de uso cotidiano.

1. Mantener pronunciacion local/offline y completar la experiencia de velocidad lenta.

1. Consolidar observabilidad, circuit breaker y estados de recuperacion como infraestructura compartida.

1. Preparar una version publica del caso con capturas, metricas finales y demostracion reproducible.

## 24. Conclusiones

> MASTER LANGUAGE SYSTEM puede presentarse como un caso de desarrollo tecnologico y pedagogico porque su valor no reside solo en el contenido de idiomas ni solo en el codigo. El proyecto articula un problema de aprendizaje, una arquitectura del conocimiento, una experiencia de usuario y un sistema operativo capaz de producir, servir y recuperar ese conocimiento.

La evolucion de agosto a septiembre de 2026 muestra una transicion clara: de diseñar una experiencia editorial a gobernar una plataforma. Los problemas encontrados - orden editorial roto, cuotas agotadas, divergencia de estados, contenido legacy, fallos de navegacion y conflictos de integracion - no son notas marginales; son la evidencia que llevo a decisiones mas maduras.

La principal leccion del caso es que una plataforma educativa no se vuelve solida por añadir IA. Se vuelve solida cuando el conocimiento tiene estructura, la IA tiene limites, el usuario entiende los estados del sistema, los fallos son recuperables y las decisiones pedagogicas siguen siendo visibles dentro de la tecnologia.

| CIERRE MLS ya puede documentarse como un prototipo avanzado de tecnologia educativa y arquitectura del conocimiento. Su siguiente etapa consiste en convertir esa amplitud en una version consolidada, verificable y reproducible. |
| --- |
