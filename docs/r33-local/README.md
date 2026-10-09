# MLS R33 — Continuidad en una computadora

Rama: `feat/r33-local-recovery`. Base: `5bee9a8530d07cea2bf2c82ed409278a70da2c10` de `main`.

Objetivo: respaldar las 10.133 entradas mediante fuentes trazables que sostengan sus afirmaciones y presentar referencias APA 7 en los diez PDF completos.

## Estado del checkpoint — 9 de octubre de 2026

El validador R33 canónico registra 7.085 de 10.133 entradas como `VERIFIED` (69,92 %); quedan 3.048 fuera del índice. El tramo local 0449–0700 conserva registros por entrada. Los lotes recientes 0676–0691 y 0693–0700 añadieron dieciséis Evidence con 80 afirmaciones cubiertas, preflight R4 y validación canónica aprobados.

Los diez PDF completos se regeneraron: 10,133 páginas nuevas, una por entrada, 7.097 referencias APA 7 y 30,381 enlaces relacionados; hay cero enlaces rotos y cero desajustes de título. Se conservan los volúmenes originales, capítulos y banderas. Las 140 versiones antiguas de PDF siguen señaladas; la comparación registra 9.991 versiones exactas y 142 distintas. El validador canónico de Evidence terminó con cero errores y advertencias; los checks Gate 500 y Gate 1000 aún señalan `CONTENT_BLOB_DRIFT`, por lo que no se consideran validados. Cloudflare y D1 registran cero interacciones/escrituras. El checkpoint detalla hashes y conteos.

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
- Revisiones locales en `reviews/`: abecedario español contrastado y propuestas parciales para `celui-ci / celui-là` y la clasificación acentual de `contándoselo`. El lote de `MLS-V10-0051` contrastó también enclisis/proclisis, imperativos negativos y voseo guatemalteco con el DPD y la NGLE; esos hallazgos locales no amplían la Evidence canónica.
- **Veintitrés entradas nuevas validadas canónicamente en este checkpoint:** `MLS-V10-0416`, `MLS-V10-0417`, `MLS-V10-0420`–`MLS-V10-0424`, `MLS-V10-0426`–`MLS-V10-0429`, `MLS-V10-0431`, `MLS-V10-0432`, `MLS-V10-0434`–`MLS-V10-0437` y `MLS-V10-0441`, `MLS-V10-0444`–`MLS-V10-0448`. 0432 quedó en 8/8 afirmaciones con localizadores NGLE §§23.1g/h, 23.16ñ/q/r/s/w/y; 0435 en 10/10 con NGLE §§24.3 y 24.5; 0436 en 11/11 con §24.4; 0437 en 12/12 con §24.5 y el DPD; 0441 en 16/16 con §24.8 y el DPD voseo. Las entradas 0425, 0430, 0438–0440 y 0442–0443 ya eran VERIFIED y se revalidaron con cobertura ampliada; 0439 quedó en 15/15, 0440 en 15/15, 0442 en 16/16 y 0443 en 20/20, con preflight aprobado y localizadores RAE/ASALE. El validador canónico informa 6.923 entradas VERIFIED, 0 errores y 0 advertencias. 0438 pasó de 1 a 13 afirmaciones y 0425 quedó en 9/9.
- `MLS-V10-0433` ya estaba VERIFIED; se revalidaron once afirmaciones, se ajustaron ejemplos voseantes a las formas documentadas para Guatemala y se enlazaron la NGLE, el DPD y las tablas académicas de conjugación. El estado global era 6.917 tras validar 0434–0437 y subió a 6.918 al validar 0441; luego aumentó a 6.923 al validar 0444–0448. Las revalidaciones de 0439, 0440, 0442 y 0443 no aumentaron el total.
- La base local se recuperó desde el SQL con el SHA esperado y pasó la comprobación de integridad de SQLite. La comparación actualizada con los artículos y Evidence canónicos encontró 9.991 versiones del backup iguales a la versión canónica y 142 distintas. Hay 6.923 entradas VERIFIED en el índice canónico y 6.783 versiones del backup cuya Evidence VERIFIED corresponde a la versión actual; no se reutilizaron estados del backup como certificaciones nuevas.
- Se compilaron los diez PDF completos en `output/pdf/`: un apéndice final de 10.133 páginas (una por entrada), 6.916 referencias APA 7 y 30.381 enlaces internos. El cuerpo, los capítulos y la paginación del índice original quedan intactos; cada apéndice identifica su entrada por código y enlaza las entradas relacionadas. El manifiesto registra cero enlaces rotos y cero títulos discrepantes. Las 140 entradas VERIFIED cuyo PDF corresponde a una versión anterior se marcan sin atribuirles fuentes de la versión nueva. Las páginas 0432, 0435, 0436 y 0438–0443 muestran evidencia y referencias APA 7; las páginas 0433, 0434 y 0437 quedan marcadas porque sus artículos canónicos difieren del backup.
- La revisión sustantiva sigue parcial: quedan 3.210 entradas sin `VERIFIED`, además de conflictos, discrepancias y fuentes por validar. Los PDF son salidas editoriales, no una validación R33. Las entradas verificadas cuya versión del PDF de backup difiere de la canónica permanecen señaladas y sin reutilizar fuentes de la versión nueva.
- El conflicto del backup para `MLS-V10-0051` se contrastó con la RAE: `contándoselo` se analiza como sobresdrújula. Se guardó una propuesta por entrada; el artículo canónico y su Evidence permanecen sin cambios hasta la validación canónica.

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

Priorizar resultados verificables; no declarar el lote completo porque solo parte de sus entradas pasó. Los artefactos de `reviews/` guardan la validación canónica por entrada y la propuesta no aceptada para 0455.

## Instrucción para continuar con Codex local

> Trabaja en `feat/r33-local-recovery`. Lee `AGENTS.md`, este README y `checkpoint.json`. Usa el backup local para reconstruir la auditoría y la cola sin conectar a Cloudflare. Compara primero los hashes y la Evidence canónica de GitHub. Continúa por lotes con revisiones de afirmaciones y fuentes, preservando los checkpoints por entrada. No declares VERIFIED sin ejecutar el contrato R33 aplicable y conservar su evidencia. Mantén FREE ONLY. Integra los apartados APA 7 y los enlaces relacionados en el generador PDF local. Conserva diez PDF completos, una entrada por página nueva, capítulos numerados y banderas. No despliegues ni fusiones a main.

- Lote siguiente: MLS-V10-0552 y MLS-V10-0554–MLS-V10-0557 quedaron VERIFIED tras revisión acotada de una afirmación por entrada contra la NGLE §§32.2–32.6. MLS-V10-0553 y MLS-V10-0558–MLS-V10-0559 ya tenían estado VERIFIED. El validador global informa 6.983 VERIFIED de 6.985 registros Evidence, cero errores/advertencias y cero interacciones Cloudflare/D1. Gate 500/1000 informan CONTENT_BLOB_DRIFT; se conserva esa alerta. Los diez PDF se regeneraron con 6.982 referencias APA 7, 30.381 enlaces y cero destinos rotos.\n

- Lote 0566–0571: 0566, 0568, 0569 y 0571 quedaron `VERIFIED` con claims y localizadores RAE/ASALE. La revisión de 0570 detectó que el artículo atribuye más plural a la posición posverbal, mientras la NGLE §33.8a especifica que la alternancia se da con independencia de la posición; se guardó una propuesta de corrección local y no se creó Evidence. El estado global es 6.992 VERIFIED de 6.994 entradas Evidence. Los diez PDF contienen 6.996 referencias APA 7 y 30.381 enlaces relacionados sin destinos rotos.

- Lote 0566–0571: 0566, 0568, 0569 y 0571 quedaron `VERIFIED` con claims y localizadores de la *Nueva gramática de la lengua española. Manual* (2010); el DPD respalda los ejemplos voseantes. La revisión de 0570 detectó que el artículo atribuye mayor frecuencia de plural a la posición posverbal, mientras la NGLE §33.8a establece que la alternancia se da con independencia de la posición. Se guardó una propuesta local y no se creó Evidence canónica. Se recalcularon los hashes del backup; 6.852 entradas PDF pueden reutilizar Evidence de versión exacta y 140 versiones antiguas siguen marcadas.

- Lote 0573–0577: las cinco entradas quedaron `VERIFIED` tras cobertura completa, preflight R4 y validación del índice Git. Se usaron localizadores de la NGLE Manual §§34.1.2, 34.2.1–34.2.2, 34.3.1–34.3.2, 34.4.2, 16.4–16.6, y NGLE §43.2.3; no se modificó contenido canónico. Global: 6.997 `VERIFIED`, cero errores/advertencias, cero interacciones Cloudflare/D1. Los diez PDF completos se regeneraron con 7,008 referencias APA 7, 30,381 enlaces internos, cero enlaces rotos y cero títulos discrepantes.

- Lote 0578–0586: nueve Evidence contrastadas con la *Nueva gramática de la lengua española* (RAE/ASALE, 2009), capítulos 34.1, 34.3–34.7, 34.8–34.11; se ampliaron los claims de seis artefactos existentes y se crearon tres Evidence que faltaban. Todas pasaron preflight R4, cobertura completa y validación canónica. El índice global quedó en 7.003 `VERIFIED`, cero errores/advertencias e interacciones Cloudflare/D1. Los diez PDF completos se regeneraron con 7.008 referencias APA 7 y 30.381 enlaces internos, sin enlaces rotos ni títulos discrepantes; se conserva una página nueva por entrada.

- Lote 0587–0589: las tres entradas quedaron `VERIFIED` tras contrastar 0587 con *Nueva gramática de la lengua española. Manual* (2010), §34.7.2, y 0588–0589 con la entrada oficial «Complemento indirecto» del *Glosario de términos gramaticales* de RAE/ASALE. Las diez afirmaciones pasaron cobertura completa, preflight R4 y validación canónica. El índice global quedó en 7.006 `VERIFIED`, con cero errores/advertencias e interacciones Cloudflare/D1. Los diez PDF se regeneraron con 7.011 referencias APA 7, 30.381 enlaces internos, cero enlaces rotos y cero títulos discrepantes. Continúa desde MLS-V10-0590; las verificaciones Gate 500/1000 con `CONTENT_BLOB_DRIFT` siguen fuera de estado validado.

- Lote 0591–0593: las quince afirmaciones quedaron cubiertas con la NGLE Manual, el GTG de RAE/ASALE y el DPD, segunda edición de 2025. Se documentaron grupos con *a*, diferencias frente a la *a* personal y grupos con *para*, duplicación de clíticos y variación del voseo en Guatemala. Las tres Evidence pasaron preflight R4 y validación canónica; el índice global quedó en 7.009 `VERIFIED`, con cero errores/advertencias e interacciones Cloudflare/D1. Los diez PDF se regeneraron con 7.019 referencias APA 7, 30.381 enlaces relacionados y cero enlaces rotos o títulos discrepantes.

- Lote 0596–0598: se añadieron 13 afirmaciones sobre dativo ético/concordado y complemento de régimen preposicional, contrastadas con la *Nueva gramática de la lengua española. Manual* (RAE/ASALE, 2010), §§35.4 y 36.1–36.4, y el DPD, segunda edición, para los ejemplos voseantes. Las tres Evidence pasaron preflight R4 y validación canónica; el índice global quedó en 7.012 `VERIFIED`, cero errores/advertencias e interacciones Cloudflare/D1. Los diez PDF se regeneraron con 7.097 referencias APA 7, 30.381 enlaces relacionados y cero enlaces rotos o títulos discrepantes.


- Lote 0600–0606 (entradas nuevas 0600–0602 y 0606; 0603–0605 ya estaban VERIFIED): las cuatro Evidence nuevas pasaron cobertura completa, preflight R4 y validador canónico con la NGLE Manual §§36.1–36.4 y 37.1. El índice quedó en 7.016 VERIFIED de 7.018 registros Evidence, con cero errores/advertencias e interacciones Cloudflare/D1. Los diez PDF se regeneraron con 7.097 referencias APA 7, 30.381 enlaces relacionados, cero enlaces rotos y cero títulos discrepantes. Continúa la revisión de las entradas restantes; no se declara cobertura total todavía.


- Lote 0607–0609: las tres Evidence nuevas pasaron cobertura completa, preflight R4 y validación del índice canónico con la NGLE Manual §§37.1–37.6 y 38.1–38.4. Las afirmaciones cubren función y formas del atributo, concordancia y sustitución por lo, construcciones copulativas y semicopulativas, y la distinción frente a complementos predicativos. El índice global quedó en 7.019 VERIFIED de 7.021 registros, cero errores/advertencias e interacciones Cloudflare/D1. Los diez PDF completos contienen 7.097 referencias APA 7, 30.381 enlaces relacionados, cero enlaces rotos y cero títulos discrepantes.


- Lote 0611–0618: ocho Evidence nuevas, 40 afirmaciones cubiertas con la NGLE Manual §§37.2.3–37.5.3; todas pasaron preflight R4 y validación canónica.
- Lote 0620–0627 (nuevas: 0620–0622 y 0624–0627; 0623 ya estaba VERIFIED): siete Evidence nuevas, 35 afirmaciones cubiertas con NGLE Manual §§37.6.2 y 38.1.1–38.2.7; todas pasaron preflight R4 y validación canónica. El índice global queda en 7.034 VERIFIED de 7.036 registros, sin errores ni advertencias. Los diez PDF completos tienen 7.097 referencias APA 7, 30.381 enlaces relacionados, cero enlaces rotos y cero títulos discrepantes.


- Lote 0629–0633: cinco Evidence, 25 afirmaciones cubiertas con la NGLE Manual §§38.1.1, 38.2.1–38.2.7, 38.3.1–38.3.2 y 38.4.1–38.4.2; todas pasaron preflight R4 y validación canónica.
- Lote 0638–0640: tres Evidence, 15 afirmaciones cubiertas con NGLE Manual §§38.6.1–38.6.3; todas pasaron preflight R4 y validación canónica.
- Lote 0642–0650 (nuevas: 0642–0645 y 0647–0650; 0646 ya estaba VERIFIED): ocho Evidence, 40 afirmaciones cubiertas con NGLE Manual §§39.1.1–39.3.3 y 39.4.1; todas pasaron preflight R4 y validación canónica. Global: 7.050 VERIFIED de 7.052 registros, cero errores/advertencias e interacciones Cloudflare/D1. PDF: 7.097 referencias APA 7, 30.381 enlaces relacionados, cero enlaces rotos y títulos discrepantes.


- Lote 0652–0655: cuatro Evidence y 20 afirmaciones cubiertas con NGLE Manual §§39.5.1–39.5.2 y 40.1.1–40.1.2; preflight R4 y validador canónico aprobados.
- Lote 0657–0659: tres Evidence y 15 afirmaciones cubiertas con NGLE Manual §§40.2.2–40.2.3 y 40.3.1; preflight R4 y validador canónico aprobados.
- Lote 0661–0673 (nuevas: 0661–0664 y 0666–0673; 0665 ya estaba VERIFIED): doce Evidence y 60 afirmaciones cubiertas con NGLE Manual §§40.3.3, 40.4.1–40.4.6 y 40.5.1–40.5.6. Todas pasaron preflight R4 y validación canónica. Global: 7.069 VERIFIED de 7.071 registros, cero errores y advertencias, cero interacciones Cloudflare/D1. Los diez PDF incluyen 7.097 referencias APA 7, 30.381 enlaces relacionados y cero enlaces rotos o títulos discrepantes.


- Lote 0676–0691 (nuevas: 0676, 0680–0682, 0685–0686, 0688–0691; las demás ya estaban VERIFIED): diez Evidence y 50 afirmaciones cubiertas con NGLE Manual §§41.2.1, 41.3.2, 41.4.1–41.4.5, 41.5.1–41.5.3 y 41.6.1–41.6.3; todas pasaron preflight R4 y validación canónica.
- Lote 0693–0700 (nuevas: 0693–0695 y 0698–0700; 0696–0697 ya estaban VERIFIED): seis Evidence y 30 afirmaciones cubiertas con NGLE Manual §§41.7.1–41.7.3, 42.1.1–42.1.2 y 42.2.1–42.2.4; todas pasaron preflight R4 y validación canónica. El índice registra 7.085 VERIFIED de 7.087 entradas, con cero errores y advertencias. Los PDF completos suman 7.097 referencias APA 7 y 30.381 enlaces relacionados, sin enlaces rotos ni títulos discrepantes.
