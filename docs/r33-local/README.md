# MLS R33 — Continuidad en una computadora

Rama: `feat/r33-local-recovery`. Base: `5bee9a8530d07cea2bf2c82ed409278a70da2c10` de `main`.

Objetivo: respaldar las 10.133 entradas mediante fuentes trazables que sostengan sus afirmaciones y presentar referencias APA 7 en los diez PDF completos.

## Empezar

Se necesita Git, Python 3.11 o posterior, espacio suficiente para el backup y SQLite local, y conexión gratuita a las fuentes que se investiguen. Importar el SQL requiere RAM suficiente para leer el export de unos 342 MB. La auditoría utiliza solo la biblioteca estándar de Python; no necesita claves ni cuenta de Cloudflare.

```bash
git clone --branch feat/r33-local-recovery --single-branch https://github.com/dpidiaz/llmchatmls.git
cd llmchatmls
python tools/r33-local/import_backup.py --sql /ruta/al/backup.sql
python tools/r33-local/auditar_r33.py
python tools/r33-local/preparar_reparaciones.py
```

Si la computadora ya tiene el repositorio, usar `git fetch origin feat/r33-local-recovery` y cambiar a esa rama cuando no haya cambios locales pendientes. No sobrescribir otro trabajo.

El SQL está en `MLS-backup.zip`, entregado en la conversación de recuperación. Conservarlo intacto; `checkpoint.json` contiene su SHA-256 esperado. El importador crea una base nueva y rechaza sobrescrituras. No añadir el SQL o la base SQLite al repositorio.

Para una base SQLite ya importada, omitir el importador:

```bash
python tools/r33-local/auditar_r33.py --database /ruta/al/mls.sqlite
python tools/r33-local/preparar_reparaciones.py --database /ruta/al/mls.sqlite
```

Todos los resultados se generan en `tools/r33-local/workspace/output/r33/`, excluido de Git. Se puede cambiar con `--output`; usar el mismo destino en los dos scripts. Las bases se abren en modo lectura para la auditoría y la preparación.

## Estado entregado

- Diagnóstico completo: 229 entradas con fuentes vinculadas a su versión actual; 15 con evidencia antigua; 4.338 con referencias candidatas; 5.551 sin referencias identificadas en los campos inspeccionados.
- 225 diferencias entre estados resumidos y registros de afirmaciones.
- 8.406 recibos R44 recuperables y 1.476 propuestas preview.
- Dos primeras revisiones en `reviews/`: abecedario español contrastado y corrección propuesta de `celui-ci / celui-là`.
- **Ninguna nueva entrada certificada canónicamente en este checkpoint.**

La auditoría reconstruye el CSV individual y los datos recuperados desde el SQL, sin publicarlos. La preparación reconstruye 10.133 apartados de fuentes como datos separados y 102 lotes con código, fecha y hash. Los paquetes ya entregados `MLS-R33-diagnostico-y-recuperacion.zip` y `MLS-coleccion-completa.pdfs.zip` sirven para recuperar los resultados y el generador editorial; sus hashes constan en `checkpoint.json`.

## Contratos de esta rama

Este trabajo local de recuperación fue autorizado expresamente. No es una invocación de MLS Unified, MLS R44 ni del Dispatcher. No ejecutar sus comandos para obtener tareas locales, ni reactivar runners, procesos de fondo, Cloudflare o escrituras D1.

- FREE ONLY: sin OpenAI API, otras APIs de IA de pago, TinyFish ni servicios de pago.
- Comparar el backup con el contenido y Evidence canónicos de esta rama antes de integrar. El backup no sustituye una versión GitHub más reciente.
- Leer el contrato R33 existente y su validador antes de declarar `VERIFIED`. El índice canónico `MLS R32 EDITORIAL/evidence git/indexes/verified.json` debe reconciliarse por versión; este diagnóstico no reemplaza esa autoridad.
- `AUDITED_DURABLE`, una bibliografía y una compilación correcta no equivalen a validación R33.
- Toda revisión debe guardar código, fecha, hash original, hash final si cambia el texto, afirmaciones, fuentes, localizadores, método, resultados y contradicciones.
- Conservar los textos originales y separar propuestas. No aplicar automáticamente correcciones preview ni rehabilitar cuarentenas por su cuenta.
- Un PDF completo por idioma, sin volúmenes; cada entrada comienza en página nueva; capítulos numerados, banderas, resúmenes legibles y navegación.
- Las entradas relacionadas deben enlazar a su destino y validarse por cobertura, además de ausencia de enlaces rotos.
- Guardar avances locales por entrada y hacer commits revisables por lote. No hacer push continuo por cada consulta, ni merge o despliegue automático.

## Orden de trabajo

1. Inventariar contenido y Evidence de GitHub, comparar hashes con el backup y evitar regresiones.
2. Resolver los dos conflictos documentados y las 225 discrepancias de estado.
3. Validar todas las afirmaciones sustanciales de las 229 entradas con fuentes actuales.
4. Contrastar referencias recuperadas: leer fuentes y comprobar cada afirmación y localizador.
5. Investigar las entradas restantes. Registrar bloqueos reales sin inventar citas ni páginas.
6. Revisar APA 7; presentar el estado de evidencia y las referencias en cada entrada.
7. Regenerar los diez PDF desde las versiones aceptadas, verificar contenido y navegación, y revisar muestras visuales.

Priorizar resultados verificables; no declarar el lote completo porque solo parte de sus entradas pasó. Las revisiones de `reviews/` son un punto de partida y permanecen pendientes de validación canónica.

## Instrucción para continuar con Codex local

> Trabaja en `feat/r33-local-recovery`. Lee `AGENTS.md`, este README y `checkpoint.json`. Usa el backup local para reconstruir la auditoría y la cola sin conectar a Cloudflare. Compara primero los hashes y la Evidence canónica de GitHub. Continúa por lotes con revisiones de afirmaciones y fuentes, preservando los checkpoints por entrada. No declares VERIFIED sin ejecutar el contrato R33 aplicable y conservar su evidencia. Mantén FREE ONLY. Integra los apartados APA 7 y los enlaces relacionados en el generador PDF local. Conserva diez PDF completos, una entrada por página nueva, capítulos numerados y banderas. No despliegues ni fusiones a main.
