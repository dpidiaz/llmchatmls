# Atlas del lector — plan de trabajo

Objetivo: mejorar la navegación de la enciclopedia para que el lector pueda moverse directamente entre idioma, parte, capítulo, nivel y tema sin convertir MLS en un curso.

## Alcance

1. Añadir un botón Atlas dentro del lector de cada entrada.
2. Mostrar todas las partes, capítulos y entradas del idioma activo.
3. Resaltar el capítulo y el tema actuales.
4. Permitir búsqueda textual inmediata por título y objetivo.
5. Permitir filtro opcional por nivel.
6. Mantener enlaces directos a capítulo y entrada mediante los hashes existentes.
7. Conservar la navegación anterior, siguiente, índice del capítulo, favoritos, Profesor IA y lector de voz.
8. Mantener la numeración visible de capítulos sin alterar `chapterNum` interno.
9. Optimizar el diálogo para escritorio y móvil.
10. No introducir progreso, exámenes, rutas forzadas, repasos ni requisitos de secuencia.

## Reglas

- El Atlas es navegación libre, no una ruta pedagógica obligatoria.
- No modifica artículos ni datos editoriales.
- No llama IA ni proveedores externos.
- No modifica FIFO, R32, AUTOOPT ni generación.
- No cambia identificadores, códigos, `partNum` o `chapterNum`.
- Debe sobrevivir al `predeploy` que reconstruye `public`.

## Prompt operativo

Trabaja exclusivamente en `dpidiaz/llmchatmls`. Mejora la navegación del lector como una enciclopedia, no como un curso. Implementa un Atlas accesible desde cada entrada que permita navegar libremente por parte, capítulo, nivel y tema, con búsqueda y resaltado del tema actual. Conserva los hashes, IDs y números internos existentes y usa `MLS.chapterDisplayNum` solo para presentación. No añadas exámenes, progreso obligatorio, rutas de aprendizaje, repasos ni automatización editorial. Mantén intactos R32, FIFO, AUTOOPT y la generación. Antes de merge o deploy ejecuta la suite editorial, la prueba específica del Atlas, predeploy, contrato de deploy y Wrangler dry run.
