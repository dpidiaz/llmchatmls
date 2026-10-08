# MLS 2.0 — Recomendación de reconstrucción offline-first

> **Tipo:** Documento de recomendación arquitectónica y editorial (RFC).  
> **Versión:** 1.0.0  
> **Fecha:** 8 de octubre de 2026  
> **Repositorio:** dpidiaz/llmchatmls  
> **Estado:** PROPUESTA — NO APROBADA / NO IMPLEMENTADA.  
> **Alcance de este cambio:** documentación únicamente. No modifica la arquitectura en producción, el corpus canónico, los pipelines, los contratos R33/R44/Unified, los despliegues ni las credenciales.

## 1. Resumen ejecutivo

Si MASTER LANGUAGE SYSTEM (MLS) tuviera que reconstruirse desde cero, se recomienda **construir primero una enciclopedia multilingüe rigurosa, accesible y portable; después derivar de ella los cursos y herramientas de aprendizaje**.

La decisión central recomendada es separar de forma estricta tres capas:

1. **Conocimiento editorial**: fuente de verdad durable, versionada y verificable.
2. **Publicación**: generación determinista de web, paquetes sin conexión y PDF a partir de la misma fuente.
3. **Herramientas opcionales**: inteligencia artificial, traducción avanzada, asistencia editorial o búsqueda neuronal, sin ser necesarias para leer, buscar o conservar la biblioteca.

**Principio rector:**

> MLS debe poder sobrevivir y ser reconstruido aunque desaparezcan el proveedor de alojamiento, la base de datos operacional y los servicios de IA.

Esto desarrolla —sin sustituirlo silenciosamente— el principio actual del README: «GitHub preserva el conocimiento. La infraestructura solo lo sirve».

**No se recomienda borrar ni reescribir las 10,133 entradas del corpus actual para comenzar.** Una eventual migración debe rescatar, inventariar, contrastar y preservar el trabajo existente.

## 2. Problema que intenta resolver

La evolución histórica de MLS combinó corpus, enseñanza, búsqueda, IA, validación R33, edición, automatización, runners, control de concurrencia, D1 y despliegue. Estas piezas respondieron a necesidades concretas, pero pueden incrementar el costo operativo y la complejidad de recuperar el producto.

Riesgos que se propone reducir:

- Dependencia de componentes operativos para tareas que deberían ser estáticas.
- Demasiados estados técnicos para publicar o leer una entrada.
- Confusión entre «procesado», «auditado», «VERIFIED» y «revisado editorialmente».
- Inconsistencias entre enciclopedia, cursos, buscador y exportaciones.
- Riesgo de que una plataforma externa se convierta de facto en la única copia utilizable.
- Dificultad para disponer de una edición completa, legible y portable por idioma.
- Trabajo repetitivo en infraestructura que no mejora directamente la calidad de las explicaciones.

**Importante:** estos son problemas que la propuesta busca prevenir o mitigar; este documento no es una auditoría que declare que todos ocurren actualmente.

## 3. Objetivos y límites

### 3.1 Objetivos

- Mantener una enciclopedia de referencia para los diez idiomas de MLS.
- Preservar un recorrido A1–C2 de **144 unidades por idioma**, con una Unidad 00 introductoria según el contrato pedagógico que se adopte.
- Conseguir que cada entrada tenga identidad estable, referencias, trazabilidad y navegación.
- Generar web, lectura offline y PDF **desde una misma fuente editorial**.
- Funcionar sin IA y sin base de datos en línea para lectura y búsqueda ordinarias.
- Permitir restauración desde repositorio y respaldos verificables.
- Reducir el número de servicios y tareas permanentes.
- Respetar **FREE ONLY**: ninguna API de pago, OpenAI API, servicio de navegación de pago o proveedor comercial de IA debe convertirse en dependencia obligatoria.

### 3.2 No objetivos

- No sustituir inmediatamente MLS R32/R33/R44/Unified.
- No degradar evidencia, eliminar cuarentenas artificialmente ni marcar entradas como VERIFIED sin comprobación real.
- No afirmar que las 10,133 entradas están completas o revisadas por aparecer en un índice.
- No migrar ni escribir en Cloudflare/D1 como consecuencia de este documento.
- No modificar contratos de producción, desplegar, fusionar ramas ni desactivar servicios.
- No convertir el repositorio MLS en un producto genérico MKS.
- No garantizar que cualquier dispositivo pueda instalar automáticamente todas las bibliotecas offline sin límites de almacenamiento.

## 4. Modelo del producto: cuatro experiencias sobre una biblioteca

| Experiencia | Propósito | Dependencia operativa obligatoria |
| --- | --- | --- |
| Enciclopedia | Consultar gramática, usos, ejemplos, cultura y bibliografía | Ninguna tras generar la edición |
| Academia | Seguir unidades, narrativa, actividades y rutas A1–C2 | Ninguna para el contenido estático |
| Biblioteca | Buscar y navegar temas e idiomas | Índice local pregenerado |
| Ediciones portables | Descargar PDF, HTML y paquetes offline por idioma | Ninguna después de obtener los archivos |

La IA, cuando se incorpore, actuará como **asistente opcional** y nunca como fuente silenciosa de nuevos artículos canónicos.

## 5. Los diez idiomas y una taxonomía universal no reduccionista

Se mantienen:

1. Español latinoamericano (con tratamiento explícito de variantes y voseo, incluido Guatemala).
2. Inglés.
3. Portugués brasileño.
4. Italiano.
5. Francés.
6. Alemán.
7. Japonés.
8. Chino tradicional / mandarín de Taiwán.
9. Coreano.
10. Ruso.

Se propone separar:

- **Conceptos interlingüísticos:** tiempo, aspecto, modalidad, evidencialidad, transitividad, casos, cortesía, negación, etc.
- **Tratamientos específicos por idioma:** estructuras, excepciones y distinciones que no admiten traducción uno a uno.
- **Relaciones entre conceptos:** equivalencia aproximada, contraste, prerrequisito y tema relacionado.

No se debe forzar una única tabla gramatical traducida a los diez idiomas. Por ejemplo, el aspecto verbal ruso, las perífrasis del español y las formas verbales japonesas pueden relacionarse, pero no son sistemas idénticos.

Cada entrada conservará el idioma de su contenido, su nivel aproximado cuando corresponda y sus particularidades de grafía, transliteración o romanización.

## 6. Corpus canónico y esquema editorial

### 6.1 Fuente única

**Recomendación:** archivos de texto estructurado por entrada (Markdown con metadatos validados o formato equivalente) como fuente canónica. Los formatos de publicación no se editan a mano.

Estructura orientativa —no obliga a mover los archivos actuales—:

~~~text
content/
  es/
    temas/
  en/
    temas/
  pt-BR/
    temas/
  it/
  fr/
  de/
  ja/
  zh-TW/
  ko/
  ru/
taxonomy/
sources/
schemas/
courses/
scripts/
dist/              # generado, no canónico
~~~

La disposición física definitiva se determinará mediante inventario del contenido ya existente bajo `content/`. Evitar cambios masivos de rutas e IDs sin tabla de correspondencias, pruebas y plan de reversión.

### 6.2 Campos mínimos de una entrada

- ID permanente y referencia a cualquier ID histórico.
- Idioma y locale.
- Título canónico, títulos alternativos y términos de búsqueda.
- Taxonomía y relaciones con otros temas.
- Nivel pedagógico orientativo (no confundir con dificultad absoluta).
- Resumen y explicación progresiva.
- Reglas, formación, uso y excepciones.
- Ejemplos originales y traducciones comentadas cuando proceda.
- Variantes regionales, registro y notas culturales.
- Errores frecuentes y comparaciones.
- Bibliografía y enlaces entre afirmaciones y evidencia.
- Estado editorial, revisión, responsable si existe y procedencia.
- Versión del contenido e identificadores de compilación.

Ejemplo **ilustrativo, no entrada publicada**:

~~~yaml
id: MLS-EN-SAMPLE-0001
legacy_ids: []
locale: en
title: The present perfect
level: B1
topics: [verb-aspect, present-perfect]
related: [MLS-ES-SAMPLE-0002]
editorial_status: DRAFT
evidence_revision: null
content_revision: 1
~~~

Los identificadores del ejemplo no deben reemplazar los IDs reales de MLS.

### 6.3 Política de calidad de contenido

Cada entrada completa debería responder al menos:

1. ¿Qué significa el concepto?
2. ¿Cómo se forma y cuándo se utiliza?
3. ¿Qué límites, excepciones o contrastes presenta?
4. ¿Qué ejemplos muestran usos auténticos y no ambiguos?
5. ¿Cómo cambia según región, registro o contexto, si corresponde?
6. ¿Qué fuentes sustentan las afirmaciones relevantes?
7. ¿Con qué otros temas debe navegarse?

**Tener título, metadatos y un cuerpo no equivale a estar editorialmente completo.**

## 7. Evidencia, procedencia y verificación

Conservar los principios de R33 (fuentes auditables, Source Registry, Evidence/Claim links, procedencia, revisión) y evitar que la IA actúe como juez único de su producción.

Estados **propuestos para una nueva interfaz editorial**, cuya correspondencia con los estados actuales debe especificarse antes de implementar:

| Estado propuesto | Significado |
| --- | --- |
| DRAFT | Borrador; no implica veracidad ni completitud |
| STRUCTURE_VALIDATED | Pasó comprobaciones de esquema, estructura y referencias internas |
| SOURCED | Tiene fuentes identificables vinculadas a las afirmaciones que lo requieren |
| VERIFIED | Se verificó evidencia y contenido conforme al contrato editorial aplicable |
| REVIEWED | Se aprobó una revisión lingüística y pedagógica adicional |

**Invariantes:**

- R44 `AUDITED_DURABLE` **no es** R33 `VERIFIED`.
- Una importación, una compilación o un commit exitoso **no confieren** estado VERIFIED.
- Las cuarentenas no se eliminan para mejorar estadísticas.
- Una fuente no disponible se registra como limitación; no se simula su lectura.
- Mantener procedencia: fuente, identificador de afirmación, edición, fecha de consulta cuando corresponda, versión, modelo/herramienta si se usó y revisor.
- Registrar referencias bibliográficas legibles, aplicando APA 7.ª cuando corresponda.
- Los cambios que alteran el significado invalidan la revisión de evidencia relacionada hasta su reevaluación.

Cualquier mapeo a los estados y autoridades existentes requiere una especificación de migración explícita; el archivo de autoridad canónica actual no se reemplaza por este documento.

## 8. Arquitectura propuesta

~~~text
                 ┌─────────────────────────┐
                 │ Fuente editorial única  │
                 │ corpus + cursos + fuentes│
                 └────────────┬────────────┘
                              │
                     Validación auditable
                   esquema + enlaces + evidencia
                              │
                    Compilación determinista
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
       Sitio web estático   PWA / HTML       PDFs por idioma
       + índice de búsqueda  offline         + índices y enlaces
            │                 │                 │
            └─────────────────┴─────────────────┘
                 Paquetes y respaldos verificables

 IA/editorial asistida = proceso opcional FUERA de la ruta de lectura
~~~

### 8.1 Separación operativa

- **Git/versiones y respaldos:** preservan el conocimiento.
- **Build reproducible:** transforma contenido validado en artefactos distribuibles.
- **Hosting estático intercambiable:** distribuye archivos; no es fuente de verdad.
- **Almacenamiento local del lector:** progreso, marcadores y paquetes elegidos.
- **Servicios online opcionales:** búsqueda semántica dinámica, tutor o traducción; deben degradar con seguridad.
- **Bases operacionales:** solo para funciones que realmente requieran escritura multiusuario o coordinación, nunca para leer la enciclopedia publicada.

### 8.2 Tecnologías candidatas (no decisiones aprobadas)

| Área | Candidato | Justificación | Validación previa |
| --- | --- | --- | --- |
| Fuente | Markdown + metadatos tipados / JSON | Portabilidad y diferencias legibles | Compatibilidad con corpus existente |
| Web | Astro + TypeScript | Renderizado estático y componentes | Peso, build, CI y soporte móvil |
| Validación | JSON Schema o esquema tipado + pruebas | Fallos explícitos y reproducibles | Contratos R33 y legado |
| Búsqueda | Pagefind u otro índice estático | Evitar servidor/IA para búsqueda común | Calidad en CJK, acentos y variantes |
| Offline | PWA + archivos HTML descargables | Lectura sin conexión | Safari/iOS, cuotas y descarga parcial |
| PDF | Generación automatizada desde fuente | Consistencia editorial | CJK, fuentes, enlaces y paginación |
| Respaldo | Git + ZIP/paquetes firmados con hashes | Recuperación sin proveedor | Restauración integral comprobada |

No elegir herramientas únicamente por popularidad: hacer un prototipo reproducible, pruebas de accesibilidad y pruebas en teléfono real.

## 9. Lector y experiencia visual

La interfaz propuesta es **tipográfica, sobria, académica y enfocada en lectura**. No necesita imágenes decorativas dentro del corpus.

Requisitos de lector:

- Jerarquía editorial consistente (parte, capítulo, tema, secciones).
- Modo claro/oscuro, tamaño de letra y anchura de lectura ajustables.
- Navegación por índice, miga de pan, «anterior/siguiente» y enlaces relacionados.
- Marcadores y reanudación de lectura, preferiblemente locales por defecto.
- Ejemplos y traducciones claramente diferenciados.
- Convenciones fiables de escritura vertical/horizontal, CJK, cirílico, IPA y romanización según idioma.
- Accesibilidad de teclado, contraste, lectura por tecnologías de asistencia y navegación móvil.
- Indicación visible del estado editorial, referencias y fecha de revisión.
- Evitar un chat obligatorio para abrir cualquier entrada.

La misma identidad visual se aplicará a la web y a PDF, adaptando las decisiones al medio.

## 10. Búsqueda sin IA obligatoria

Orden recomendado:

1. Búsqueda de IDs, títulos y coincidencias exactas.
2. Índice de texto completo con filtros de idioma.
3. Sinónimos, lemas, variantes ortográficas y transliteraciones validadas.
4. Relaciones semánticas **editoriales** entre conceptos.
5. Opcionalmente, recuperación neural y reranking cuando existan recursos gratuitos y fiables.

Nunca reducir la calidad de búsqueda al agotarse una cuota de IA. La selección por idioma precede al ranking; la búsqueda debe funcionar offline sobre el paquete descargado. Medir precisión y recuerdo por idioma, especialmente en japonés, chino tradicional, coreano y ruso.

## 11. Academia: curso derivado de la enciclopedia

Separar **referencia lingüística** y **secuencia pedagógica**:

- La enciclopedia mantiene la explicación canónica.
- El curso reutiliza IDs de conceptos, ejemplos seleccionados y enlaces verificables.
- Las unidades incorporan objetivos, narrativa bilingüe, notas culturales, actividades y repaso.
- El nivel A1–C2 guía progresión, pero no obliga a inventar equivalencias gramaticales.
- Los ejercicios y evaluaciones son capas adicionales; no deben contaminar la enciclopedia.

Meta de producto conservada: **144 unidades por idioma** y una Unidad 00 de orientación. Antes de producir masivamente, validar estructura de niveles, tamaño, repeticiones y cobertura real.

Una corrección de una explicación central debe propagarse a sus referencias, y los cursos deben señalar los fragmentos incrustados que requieren revalidación.

## 12. Ediciones offline y PDF

Generar a partir de la misma revisión del corpus:

- Sitio web estático indexable.
- Aplicación web progresiva con descarga selectiva de idiomas.
- Paquetes HTML autocontenidos o navegables localmente.
- **Un PDF principal por idioma**, sin dividirlo en volúmenes de manera automática, mientras permanezca legible y operable.
- Manifest de versiones y sumas SHA-256 para verificar integridad de cada paquete.

### 12.1 Contrato mínimo de los PDF

- Portada, información editorial, fecha y versión.
- Índice general y marcadores de navegación.
- Encabezados, números de página, estructura semántica cuando sea técnicamente viable.
- Enlaces internos, referencias cruzadas y bibliografía utilizable.
- Tipografías legibles y soporte correcto para todos los sistemas de escritura.
- Ejemplos, tablas y notas sin cortes inaceptables.
- Buen contraste e impresión razonable; evitar enormes bloques compactos.
- Comprobaciones de fuentes, caracteres faltantes, enlaces, paginación y tamaño final.

**No prometer una sola edición física por idioma a cualquier costo:** si se vuelve impráctica, documentar el límite y solicitar decisión editorial antes de dividir.

### 12.2 Offline real

La PWA no equivale automáticamente a una descarga perpetua: probar almacenamiento disponible, limpieza de caché, modo avión, actualización incremental, cierre y reapertura. Ofrecer ZIP/HTML como respaldo independiente del navegador.

## 13. Política económica y de privacidad

- **FREE ONLY como objetivo de arquitectura:** ninguna API de pago obligatoria, ni OpenAI API ni sustitutos de cobro automático.
- No usar TinyFish ni navegadores de pago en la ruta editorial prevista.
- La lectura, búsqueda lexical y PDF no deben requerir cuenta personal, token ni conexión una vez descargados.
- Progreso y marcadores almacenados localmente por defecto; sincronización solo como función explícita y opcional.
- No publicar credenciales, IDs de sesión privados, tokens de leases, información personal ni secretos en el corpus o los ejemplos.
- Toda mejora con coste recurrente requiere decisión expresa y presupuesto medido; nunca introducirla silenciosamente.

## 14. Plan de migración sin pérdida de conocimiento

La recomendación **no es rehacer las 10,133 entradas desde cero**. El primer trabajo es rescatar y clasificar.

### Fase 0 — Congelar referencia y respaldar

Inventariar el estado real del repositorio, manifiestos, versiones, corpus, Evidence/Provenance, cursos y derivados. Generar respaldo íntegro verificable. Registrar hashes, recuentos por idioma y relaciones entre entradas. No asumir que los conteos históricos reflejan el último estado de producción.

**Gate:** respaldo restaurable; ninguna entrada sin identidad o trazabilidad de origen.

### Fase 1 — Golden corpus multilingüe

Elegir una muestra diversa de los diez idiomas: escritura latina y no latina, distintos niveles, referencias, ejemplos, tablas, variantes regionales y temas extensos. Implementar el esquema solo sobre esta muestra.

**Gate:** integridad semántica, accesibilidad, vistas web y PDF correctas; revisión editorial de la muestra.

### Fase 2 — Lector y build reproducible

Implementar compilación estática, enlaces, indexación, exportación y recuperación desde clon limpio.

**Gate:** generar artefactos equivalentes desde los mismos inputs; sin D1 ni IA para leer y buscar.

### Fase 3 — Migración de la enciclopedia

Migrar por idioma/lote con mapeos de ID, manifiestos e informes de diferencias. Ninguna entrada cambia de estado VERIFIED por el proceso de importación. Registrar asuntos no resueltos sin detener la lectura de otras entradas.

**Gate:** paridad de inventario con todas las excepciones justificadas, enlaces internos íntegros y revisión de contenido alterado.

### Fase 4 — Ediciones finales por idioma

Publicar prototipos de los diez PDF y paquetes offline, revisar tipografía CJK/cirílica, accesibilidad, índices y prueba de modo avión en dispositivos reales.

**Gate:** cada idioma descargable, legible, verificable y actualizable sin servicio operacional.

### Fase 5 — Academia A1–C2

Integrar unidades y rutas formativas reutilizando referencias de la enciclopedia. Validar un nivel completo antes de escalar a los demás.

**Gate:** coherencia entre curso y enciclopedia, progresión pedagógica y evaluación de calidad.

### Fase 6 — Corte de producción, solo con autorización

Comparar la nueva versión con la actual, aprobar criterios de aceptación, elegir estrategia reversible y solicitar autorización explícita para despliegue o retirada de infraestructura.

**Gate:** plan de rollback probado, aprobación humana y cero pérdida editorial.

## 15. Criterios de aceptación y «Definition of Done»

| Dimensión | Evidencia requerida |
| --- | --- |
| Integridad | Cada entrada canónica inventariada y recuperable, sin pérdida silenciosa |
| Reproducibilidad | Build repetible y validado desde un clon limpio |
| Lectura resiliente | Lectura y búsqueda lexical sin D1/IA |
| Offline | Prueba real por idioma, incluida desconexión y reapertura |
| Calidad | Ejemplos, traducciones, fuentes y variantes evaluados según contrato |
| Estado editorial | VERIFIED y REVIEWED solo por validación legítima |
| Navegación | Índices, enlaces, referencias y filtros sin destinos rotos |
| PDF | Diez ediciones principales por idioma evaluadas; sin volumen múltiple salvo decisión expresa |
| Accesibilidad | Pruebas automatizadas y manuales, incluidas tecnologías de asistencia |
| Coste | Sin servicios de pago obligatorios para el producto básico |
| Recuperación | Restauración documentada y probada desde respaldos |
| Gobernanza | Despliegues, borrados y cambios de autoridad requieren autorización |

**Definición recomendada de terminado:** MLS está completo cuando la enciclopedia de los diez idiomas es útil, coherente, navegable, exportable y recuperable; **no cuando el último runner devuelve DONE**.

## 16. Riesgos y decisiones abiertas

| Riesgo o tensión | Tratamiento propuesto |
| --- | --- |
| Migración masiva rompe referencias | IDs estables, redirecciones, mapeos, diff y rollback |
| Material documental de calidad desigual | Estados editoriales visibles y revisión por riesgo |
| Web estática pesada | Paquetes por idioma, carga incremental e índices segmentados |
| Offline limitado en iPhone | Pruebas Safari y paquetes HTML/ZIP externos |
| PDF extremadamente largo | Evaluar legibilidad, tamaño y navegación; no dividir sin decisión |
| Búsqueda CJK imperfecta | Benchmarks reales multilingües y tokenización apropiada |
| Fuentes inaccesibles | Registrar ausencia y no fingir verificación |
| Copias desactualizadas | Manifest, versión, hash y política de actualización |
| Dependencia tecnológica nueva | Exportación abierta y builds independientes del hosting |

Decisiones pendientes antes de implementar: formatos definitivos, correspondencia de estados R33, política de bibliografía, esquema de taxonomía, alcance pedagógico de Unidad 00, estrategia de actualización offline y criterios cuantitativos de rendimiento.

## 17. Qué preservar, qué simplificar y qué retirar gradualmente

**Preservar:** corpus recuperable de 10,133 entradas como referencia de inventario, R33 Evidence/Provenance, enlaces semánticos válidos, los diez idiomas, 144 unidades por idioma como objetivo, bibliografía auditada, búsqueda lexical y la identidad visual lograda por MLS.

**Simplificar:** un solo build editorial; un solo contrato canónico para web/PDF/offline; índices derivados; menos servicios activos; separación clara entre herramientas editoriales y lectura.

**Candidatos a retirar únicamente tras migración aprobada:** generación obligatoria al abrir un artículo, escrituras D1 en la ruta de lectura, dependencia de IA para búsqueda ordinaria, sincronizaciones innecesarias para publicar archivos estáticos y runners permanentes de mantenimiento de contenido.

**No desconectar, destruir ni migrar componentes automáticamente por esta recomendación.** Las decisiones sobre Cloudflare, GitHub Actions, R44 y R33 necesitan tratamiento operativo separado.

## 18. Gobierno de la propuesta

Este documento es **una recomendación**, no una instrucción para ejecutar trabajo, iniciar runners, activar workflows, gastar cuotas, fusionar un PR o modificar la autoridad editorial.

Para convertirlo en proyecto se requiere un RFC/ADR posterior que declare:

1. Responsable y alcance.
2. Inventario real del corpus y sus dependencias.
3. Matriz de equivalencias con contratos actuales.
4. Prototipo sobre golden corpus.
5. Pruebas y presupuesto técnico.
6. Estrategia de migración y reversión.
7. Autorización explícita de implementación y despliegue.

Hasta entonces, los contratos vigentes del repositorio conservan su autoridad. Las referencias a tecnologías y rutas son **opciones de diseño**, no configuración activa.

---

## 19. Recomendación final

> **Si MLS se reconstruye, debe renacer como una obra lingüística duradera, no como una infraestructura que deba estar funcionando para que el conocimiento exista.**
>
> Primero: bibliografía, taxonomía, corpus canónico y validación.  
> Después: lector, búsqueda local, ediciones web/offline/PDF.  
> Finalmente: cursos, herramientas inteligentes y servicios opcionales.
>
> **La infraestructura debe servir a la enciclopedia; la enciclopedia no debe depender de la infraestructura.**

**Registro de decisión:** conservar esta propuesta como alternativa estratégica para revisión futura. **No ejecutarla automáticamente.**
