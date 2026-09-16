# Plan de trabajo · Auditoría semántica por muestra

## Objetivo
Añadir una segunda capa de control editorial que revise muestras de artículos ya publicados para detectar errores lingüísticos o conceptuales que R32 estructural no puede certificar.

## Principios

1. R32 sigue siendo la autoridad estructural/editorial.
2. La auditoría es diagnóstica, no correctiva.
3. Nunca modifica, republica, rescata ni elimina artículos automáticamente.
4. La selección de muestras es automática y balanceada; la evaluación la realiza ChatGPT o una persona.
5. Idiomas, niveles y familias permanecen separados.
6. Una muestra correcta no certifica el corpus completo.
7. Cero coste de proveedor: el backend no llama modelos para auditar.
8. Si un artículo cambia después de ser muestreado, el resultado no se registra sobre la versión nueva.

## Flujo

1. Seleccionar una muestra de 1 a 10 artículos publicados y todavía no auditados.
2. Balancear la selección para favorecer idiomas, niveles y familias con menor cobertura de auditoría.
3. Entregar el contenido completo de la muestra únicamente por endpoint privado autenticado.
4. Revisar exactitud, terminología, ejemplos, variedad lingüística, ambigüedad y contradicciones.
5. Registrar un resultado por artículo: `ok`, `watch` o `review_required`.
6. Mostrar agregados en AUTOOPT sin exponer contenido de artículos en el panel.

## Categorías de hallazgo

- `accuracy`
- `terminology`
- `examples`
- `ambiguity`
- `variety`
- `factual`
- `other`

## Estados

- `ok`: la muestra revisada no presenta un problema semántico relevante.
- `watch`: existe una observación que conviene vigilar, pero no implica corrección automática.
- `review_required`: existe un hallazgo que requiere revisión editorial humana antes de cualquier corrección futura.

## Endpoints privados

- `GET /api/wiki/editorial/chat/semantic/status`
- `POST /api/wiki/editorial/chat/semantic/sample`
- `POST /api/wiki/editorial/chat/semantic/record`

Todos requieren `MLS_EDITORIAL_CHAT_KEY`.

## Integración AUTOOPT

El Panel de Salud mostrará:

- artículos auditados;
- total publicado;
- cobertura de muestra;
- `ok`, `watch` y `review_required`;
- distribución por idioma, familia y categoría;
- estado diagnóstico global de la muestra.

La auditoría semántica no altera métricas R32 ni decisiones de publicación.

## Criterio de aceptación

El sistema puede seleccionar una muestra representativa, recibir una evaluación semántica versionada y mostrar sus hallazgos de forma separada, sin modificar el corpus ni automatizar correcciones.