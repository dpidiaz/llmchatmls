## 7. Componentes de experiencia de aprendizaje

| Componente | Funcion pedagogica | Funcion de producto |
| --- | --- | --- |
| Biblioteca por idioma | Organiza conocimiento y hace visible la progresion. | Navegacion, consulta y continuidad. |
| Entradas enciclopedicas | Explican un concepto con precision y ejemplos. | Unidad canonica de contenido. |
| Profesor IA | Aclara una entrada cuando la explicacion estatica no basta. | Chat contextual con limites y modulo por idioma. |
| Virtuoso | Orienta al usuario dentro del corpus. | Busqueda semantica, recuperacion y reranking. |
| Traductor | Resuelve necesidades inmediatas de significado. | Traduccion online controlada por presupuesto. |
| Pronunciacion | Permite escuchar, comprender y repetir. | TTS local/offline y control de velocidad. |
| Seguir leyendo | Conecta sesiones y reduce friccion al volver. | Persistencia de posicion y continuidad. |
| Modo offline | Mantiene acceso basico cuando falla la red. | Caches, contenido descargado y estados de resiliencia. |

### Principio visual: image-free by design

MLS no depende de fotografias, ilustraciones ni imagenes decorativas para sostener su identidad visual. Esta ausencia se asume como una decision de diseño consciente: la interfaz prioriza tipografia, jerarquia, ritmo, espacio, navegacion, microinteracciones, legibilidad y claridad del contenido. La imagen solo deberia incorporarse cuando aporte valor pedagogico verificable —por ejemplo, para explicar una forma, un objeto cultural o una relacion espacial— y no como requisito estetico.

Este principio es coherente con el perfil de diseño grafico del proyecto: el diseño no se entiende como acumulacion de recursos visuales, sino como organizacion intencional de informacion y experiencia. Tambien reduce peso, dependencia de conectividad y distracciones en una plataforma centrada en lectura, consulta y estudio.

## 8. Profesor IA

El Profesor IA fue diseñado como una capa de explicacion contextual sobre una fuente estable: la enciclopedia. El backend documentado usa Cloudflare Workers AI y un modelo Gemma, con un modulo linguistico seleccionado segun el idioma de la entrada. La conversacion conserva continuidad dentro del chat y limita historial y longitud para controlar consumo. [D4]

| REGLA PEDAGOGICA CENTRAL DEL PROFESOR IA EXPLICAR -> ACLARAR -> AMPLIAR -> RESPONDER. No debe convertir espontaneamente una pregunta en examen, tarea, flashcards o gamificacion. [D4] |
| --- |

La instruccion “la explicacion mas sencilla que siga siendo verdadera” resume una tension central del proyecto: reducir la carga cognitiva sin sacrificar precision. El sistema tambien evita asumir que el usuario domina terminologia gramatical; cuando necesita un termino tecnico, debe explicarlo.

Desde el punto de vista tecnico, el Profesor IA introduce tres necesidades que posteriormente se volvieron transversales: presupuesto de IA, circuit breaker y observabilidad. Estas mismas necesidades afectan a Virtuoso, generacion editorial y traductor.

## 9. Virtuoso, el bibliotecario

Virtuoso es la figura de orientacion de MLS. Su funcion conceptual es conocer la biblioteca, ayudar a encontrar una entrada pertinente y representar el nivel de dominio al que puede aspirar el estudiante. En su pagina propia conserva nombre y personalidad; en otros puntos de la interfaz la accion se presenta simplemente como “Buscar” para que la funcion sea inmediatamente comprensible.

La arquitectura desarrollada para Virtuoso combina recuperacion canonica del corpus con una capa de ranking y fallback. En el diseño reciente se han trabajado retrieval mediante embeddings, reranking con Gemma y una respuesta degradada cuando la IA temporalmente no esta disponible.

La decision mas importante es que Virtuoso no debe inventar una biblioteca paralela. La fuente valida debe ser el corpus canonico. Por ello se decidio terminar primero la generacion/migracion R32 y eliminar contenido legacy antes de una indexacion definitiva que pueda perpetuar material incorrecto.

| VALOR PEDAGOGICO Virtuoso convierte la taxonomia en orientacion. El problema ya no es solo “tener 10 133 temas”, sino ayudar a una persona a encontrar el concepto correcto aunque no conozca el nombre tecnico que debe buscar. |
| --- |

## 10. Traductor y pronunciacion

El modulo de traduccion se incorporo como una herramienta de apoyo, no como sustituto de la enciclopedia. La estrategia mas reciente separa deliberadamente dos funciones: traduccion online de mayor calidad y pronunciacion local/offline.

La pronunciacion se diseño como funcion pedagogica independiente. Ademas de una velocidad normal, el sistema incorpora reproduccion lenta para escuchar, comprender y repetir. El selector definido incluye 0.10, 0.25, 0.5, 0.75 y 1.0, con 0.5 como valor predeterminado.

Para lenguas con escrituras que un hispanohablante guatemalteco no puede leer de forma inmediata, la documentacion establece un orden canonico: escritura nativa, romanizacion estandar, ayuda de pronunciacion amigable para español cuando sea necesaria y significado. [D3]

| Idioma | Apoyo inicial prioritario |
| --- | --- |
| Japones | Kana/kanji + Hepburn + aproximacion util para español. |
| Chino de Taiwan | Caracteres tradicionales + Pinyin con tonos + apoyo de pronunciacion. |
| Coreano | Hangul + romanizacion + forma oral esperada con cambios fonologicos. |
| Ruso | Cirilico + transliteracion + pronunciacion con acento marcado durante la adquisicion. |

La hipotesis de producto es que la pronunciacion local tiene una relacion costo/beneficio mejor que descargar traductores completos al dispositivo. La traduccion puede mantenerse online y consumir el presupuesto de IA de manera medible, mientras el audio basico sigue disponible sin conexion.

## 11. Offline-first, accesibilidad y resiliencia

Offline-first fue un principio temprano del sistema: el aprendizaje esencial no debia depender de audio, internet, QR o servicios externos. [D2] En la etapa web, ese principio se transformo en una estrategia de resiliencia: caches, contenido descargable, mensajes de estado y degradacion comprensible cuando la IA o la red no estan disponibles.

El trabajo UX/UI reciente separo explicitamente los estados que el usuario debe poder comprender: conexion perdida, contenido no descargado, estado parcial, conexion restaurada, IA no disponible offline y reintentos. Esta separacion evita que todos los fallos se presenten como un unico mensaje generico.

En accesibilidad se incorporaron contratos de foco visible, contraste, navegacion por teclado, skip link y pruebas de reflow a 200 % y 400 %, ademas de una matriz responsive desde 320 hasta 1920 px. La meta no es un “modo accesible” separado, sino que el comportamiento base sea robusto.

## 12. Arquitectura tecnologica

*Figura 3. Arquitectura simplificada de referencia; algunos modulos continúan en integracion.*

| Capa | Responsabilidad |
| --- | --- |
| Cliente web | Navegacion, lectura, busqueda, continuidad, caches, estados offline y pronunciacion local. |
| Cloudflare Worker | API, orquestacion, politicas, rutas de IA, control de estados y observabilidad. |
| D1 | Fuente recuperable para articulos, trabajos, metricas y cursores. [D1] |
| Workers AI | Inferencia para Profesor IA, generacion editorial, reranking y traduccion segun presupuesto. |
| Queue / jobs | Transporte y procesamiento de lotes; no debe ser la unica evidencia de trabajo pendiente. [D1] |
| GitHub Staging | Area paralela para producir y validar contenido sin consumir D1 cuando conviene proteger cuota. |
| Repositorio GitHub | Versionado, branches de workstreams, PR, integracion y documentacion tecnica. |

## 13. Operacion editorial y automatizacion

La automatizacion editorial fue uno de los experimentos mas exigentes del proyecto. La primera arquitectura favorecio rendimiento y concurrencia, pero la evidencia mostro que podia romper el orden editorial FIFO y crear divergencia entre el estado logico de D1 y el backlog fisico de Queue. [D1]

La correccion R32 redujo deliberadamente la concurrencia para recuperar trazabilidad: un mensaje logico activo, lotes consecutivos, primer fallo detiene el lote, publicacion idempotente y reconstruccion desde D1. La regla Publish First consulta primero si el contenido ya existe antes de gastar IA. [D1]

| LECCION DE INGENIERIA Mas paralelismo no equivale automaticamente a mas progreso. Cuando el orden editorial es parte del contrato del producto, la concurrencia debe subordinarse a ese contrato. |
| --- |

Posteriormente se agregaron comandos de operacion por chat y lotes concurrentes con runId independiente, ademas de mecanismos de rescate. El objetivo actual no es volver al paralelismo ciego, sino poder reservar y trabajar lotes sin perder idempotencia, trazabilidad ni capacidad de recuperacion.

## 14. Restriccion FREE ONLY y gobierno de IA

MLS se desarrolla bajo una restriccion economica explicita: FREE ONLY, costo $0.00. No se deben incorporar proveedores pagados, billing automatico ni fallbacks que puedan generar consumo monetario. Esta restriccion no es un detalle administrativo; condiciona la arquitectura.

Cloudflare Workers AI impone una cuota diaria de neurons. Cuando se agota, el sistema puede responder con error 3036. Por ello el proyecto incorporo un circuit breaker persistente que marca el estado de cuota agotada y evita seguir compitiendo a ciegas por un recurso que ya no esta disponible.

La evolucion mas reciente propone que Virtuoso, Profesor IA, generacion editorial y /api/translate compartan el mismo presupuesto FREE ONLY. Esta decision convierte el consumo de IA en un recurso gobernado a nivel de plataforma en lugar de una suma de features independientes.

| Principio | Aplicacion |
| --- | --- |
| Presupuesto unico | Todos los consumidores de Workers AI deben contabilizarse bajo una misma politica. |
| Circuit breaker | Cuando la cuota gratuita se agota, las rutas deben degradarse de forma coherente. |
| Medicion real | El traductor debe exponer consumo real de neurons antes de eliminar alternativas locales. |
| Prioridad humana | Reservar capacidad para funciones interactivas puede tener mas valor que consumir todo en generacion masiva. |
| Sin costos ocultos | No habilitar billing ni proveedores de pago como fallback silencioso. |
