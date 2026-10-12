# MLS-SND — Gate editorial de autonomía escrita

**Versión propuesta:** 0.2 · **Tipo:** checklist interno de edición/composición, **no** ejercicio, prueba ni evaluación del lector.

## 1. Propósito

Evitar que la edición escrita dependa implícitamente de audio, una demostración oral, la intuición del autor o la grafía de una sola lengua.

Se aplica **después** de la revisión de contenido lingüístico y evidencia R33. Un PASS aquí **no sustituye** la revisión lingüística.

## 2. Resultado por entrada

Estados internos del gate:

- `NOT_REVIEWED`: aún no se revisó esta versión.
- `PASS`: todos los controles aplicables cumplen.
- `PASS_WITH_EDITORIAL_NOTES`: cumple sin bloquear, con mejoras no esenciales registradas.
- `HOLD`: existe dependencia de audio, ambigüedad de notación o ausencia de contexto necesario.
- `NOT_APPLICABLE`: solo para un control individual con motivo documentado; no para toda una entrada de contenido.

No inventar un estado R33 nuevo a partir de estos resultados.

## 3. Controles

| Control | Pregunta interna de edición | Bloquea si… |
|---|---|---|
| WRT-01 | ¿Se comprende el objetivo sin escuchar material externo? | Una afirmación clave depende de «escuchar aquí» |
| WRT-02 | ¿Se identifica idioma, variedad y contexto? | Una realización sensible a variedad se presenta como universal |
| WRT-03 | ¿Se distingue grafía, romanización, transcripción fonológica y fonética? | Se usan indistintamente |
| WRT-04 | ¿Cada símbolo o convención nueva tiene definición o enlace? | Un lector necesita adivinar la notación |
| WRT-05 | ¿Producción/percepción se explican con evidencia, sin prácticas? | Hay instrucciones, pruebas o equivalencias no respaldadas |
| WRT-06 | ¿Se separa esquema ilustrativo de dato empírico? | Un gráfico inventado se presenta como medición |
| WRT-07 | ¿La variación y los límites analíticos quedan visibles? | Se oculta una discrepancia material |
| WRT-08 | ¿Se puede consultar la entrada sin leer el tomo linealmente? | Falta un concepto indispensable sin remisión |
| WRT-09 | ¿Tablas, símbolos y diagramas son legibles sin depender solo de color? | Se pierde una distinción por el soporte |
| WRT-10 | ¿Claims materiales y fuentes están trazados? | No existe gate R33 para la versión vigente |
| WRT-11 | ¿La entrada carece de prácticas, ejercicios, pruebas y evaluación? | Se pide al lector ejecutar una tarea |
| WRT-12 | ¿La exportación conserva el IPA y las escrituras originales? | Se corrompen caracteres, diacríticos o separación de capas |
| WRT-13 | Si existe pronunciación fácil, ¿está etiquetada como aproximada y localizada para un reader locale? | Se presenta como transcripción universal o exacta |
| WRT-14 | ¿La pronunciación fácil acompaña, pero no sustituye, la representación formal o explicación escrita necesaria? | La comprensión depende solo de la respelling o esta introduce una decisión fonética nueva |

## 4. Evidencia del gate

Registro mínimo por entrada:

```yaml
entry_id: SND-<AREA>-<NNN>
revision: <commit-or-content-hash>
written_only_gate: NOT_REVIEWED
reviewer: <id>
review_date: <YYYY-MM-DD>
controls:
  WRT-01: NOT_REVIEWED
  WRT-02: NOT_REVIEWED
  WRT-03: NOT_REVIEWED
  WRT-04: NOT_REVIEWED
  WRT-05: NOT_REVIEWED
  WRT-06: NOT_REVIEWED
  WRT-07: NOT_REVIEWED
  WRT-08: NOT_REVIEWED
  WRT-09: NOT_REVIEWED
  WRT-10: NOT_REVIEWED
  WRT-11: NOT_REVIEWED
  WRT-12: NOT_REVIEWED
  WRT-13: NOT_REVIEWED
  WRT-14: NOT_REVIEWED
notes: []
```

Los campos entre ángulos son marcadores de posición, no datos de una revisión real.

## 5. Ejemplo puramente estructural

**Ejemplo ficticio, no descripción de una lengua:**

> «En la variedad [VARIEDAD], la fuente [FUENTE] documenta el contraste [CONTRASTE] en [CONTEXTO]. La grafía [GRAFÍA] se presenta separada de la representación fonológica [NOTACIÓN] y de la realización fonética [NOTACIÓN]. La comparación con [OTRA VARIEDAD] es [ALCANCE DOCUMENTADO].»

La entrada real deberá reemplazar todos los marcadores por datos respaldados y registrar localizadores exactos. No utilizar el ejemplo como claim ni como plantilla para producir equivalencias inventadas.

## 6. Integración con el flujo existente

1. El autor trabaja con la plantilla canónica de entrada.
2. R33 verifica claims y localizadores.
3. La revisión lingüística valida análisis, IPA y variedad.
4. Este gate verifica autonomía de la obra escrita y claridad de consulta.
5. La revisión editorial final decide si pasa a composición.
6. La composición ejecuta un control técnico adicional de Unicode y legibilidad.

No marcar `READY_FOR_COMPOSITION` solo porque este checklist tenga PASS.

## 7. Prueba de regresión editorial

Si una entrada cambia después del PASS, su resultado queda **obsoleto para la nueva revisión**. Debe volver a comprobarse WRT-01/03/04/05/10/11/13/14 y cualquier control afectado por el cambio.

El gate se almacena por **ID + revisión**, nunca como aprobación permanente de un título.

## 8. Límites

Este checklist no comprueba acústicamente sonidos, no resuelve debates fonológicos, no certifica la pronunciación de una persona y no obliga a producir audio. Su utilidad es exclusivamente editorial y de accesibilidad.