# MLS-SND — Puente entre la entrada canónica y la edición de lectura

**Versión propuesta:** 0.1  
**Estado:** EDITORIAL_PROPOSAL / NO VALIDATED LINGUISTIC CLAIMS  
**Rama de trabajo:** `snd/written-only-editorial-wave-01`  
**Alcance:** interoperabilidad editorial; no cambia la estructura R33 ni los estados del corpus.

## 1. Propósito

Este documento integra las dos propuestas de autonomía escrita con los archivos ya canónicos:

- `MLS-SND-ENTRY-TEMPLATE.md`;
- `editorial/entry-metadata-schema.md`;
- `editorial/page-composition.md`;
- `editorial/reader-facing-evidence.md`;
- `editorial/evidence-editorial-checklist.md`;
- `qa/LINT-RULES.md`.

**Principio:** la edición de lectura es una *vista derivada* de la entrada canónica. No es un segundo registro de hechos, ni reemplaza el texto fuente, los claims R33 o los localizadores.

## 2. Correspondencia entre campos y bloques de lectura

| Origen canónico | Vista para el lector | Regla de transformación |
|---|---|---|
| ID y título | Encabezado de entrada | Conservar ID; número de capítulo/página puede variar por edición |
| Idioma, variedad y tipo de alcance | Subtítulo de alcance | Mantener la distinción entre referencia, muestra, norma y análisis |
| Dominio y nivel de representación | Etiquetas discretas de navegación | No confundir notación fonológica, fonética, ortográfica o romanizada |
| «Qué es» y «Por qué importa» | Apertura en lenguaje claro | No añadir afirmaciones para simplificar |
| «Representación» | Bloque con leyendas por capa | Especificar la convención usada; no inferir IPA desde grafía |
| «Producción» | Descripción articulatoria cuando procede | Sin instrucciones al lector ni claims sin fuente |
| «Percepción y contraste» | Explicación de contraste y límites | No simular experiencia auditiva con onomatopeyas |
| «Distribución y contexto» | Contexto de uso | Preservar entorno, población y condición de observación |
| «Relación con la escritura» | Correspondencia escritura–sonido | No promover ortografía a prueba fonética |
| «Variación» | Nota visible de variación | No esconder excepciones que cambian el análisis |
| «Comparación» y advertencia | Comparación delimitada | Usar las etiquetas de equivalencia existentes |
| «Ejemplos» | Ejemplos tipados | Conservar SOURCE/CORPUS/EDITORIAL_EXAMPLE |
| «Entradas relacionadas» | Navegación por ID | Resolver enlaces sin depender de paginación |
| Tabla R33 + APA 7 | «Fuentes y fundamento» | Derivar de evidencia validada, no reconstruir desde memoria |
| Nota editorial | Nota de alcance o decisión, si material | No publicar datos operativos internos por defecto |

Los campos `workflow_state`, `evidence_state`, `last_substantive_change`, IDs de claims, hashes, workers y leases **permanecen internos** salvo una edición técnica expresamente diseñada para auditoría.

## 3. Paginación y navegación

- **PDF:** cada entrada empieza en una página nueva y puede ocupar varias páginas; nunca truncar el contenido para imponer una página por entrada.
- **Web:** cada entrada tiene ruta o ancla por ID canónico; los capítulos pueden reorganizarse sin romper la identidad.
- **Índices:** las remisiones usan IDs, no únicamente números de página.
- **Tabla y símbolos:** conservar Unicode, IPA y escrituras originales; no separar diacríticos de sus bases ni reemplazar caracteres por parecidos.
- **Color:** una diferencia importante debe expresarse también por leyenda o texto.
- **Audio:** cualquier recurso futuro es accesorio; la comprensión de la entrada no debe requerirlo.

## 4. Contrato editorial de exportación

La exportación no debe:

1. inventar un ejemplo, transcripción, fuente, localizador o variante;
2. convertir `SOURCE_MAPPED`, `DRAFTED` o `EVIDENCE_CHECKED` en aprobación de publicación;
3. inferir `READY_FOR_COMPOSITION` por la mera presencia de bibliografía o un checklist completo;
4. esconder avisos de alcance material para acortar el texto;
5. hacer pasar una representación ilustrativa por dato acústico medido;
6. alterar ortografía, AFI, Zhuyin, Hangul, Kana, cirílico o diacríticos en una conversión de formato;
7. mostrar como norma de toda una lengua resultados de una muestra regional, histórica o socialmente delimitada.

Cuando la vista no pueda conservar una distinción, debe **bloquearse la exportación de esa entrada** y registrarse la incidencia. No se permite sustituir la distinción silenciosamente.

## 5. Ejemplo de estructura visual (sin contenido lingüístico)

El siguiente fragmento es **maqueta de jerarquía**, no entrada publicable ni afirmación sobre una lengua.

```text
[Número editorial de la edición]  [Título de la entrada]
SND-AREA-NNN · [Idioma] · [Variedad / alcance]

Qué es
[Definición en lenguaje corriente respaldada por la entrada]

Por qué importa
[Función del fenómeno, con alcance delimitado]

Cómo se representa
[Forma escrita] — escritura original
[Convención X] — romanización/transliteración, si aplica
/…/ — análisis fonológico identificado, si aplica
[…] — realización fonética documentada, si aplica

Producción, percepción y contexto
[Explicación textual con fuentes; no ejercicios]

Variación y límites
[Distinciones que alteran la interpretación]

Comparación
[Etiqueta MLS-SND y advertencia cuando corresponde]

Entradas relacionadas
[IDs canónicos]

Fuentes y fundamento
[Referencias APA 7 y localizadores derivados de R33]
```

Los símbolos `/…/` y `[…]` son **marcadores de posición**. No constituyen transcripciones.

## 6. Matriz de aceptación del gate de autonomía escrita

| Caso de revisión | Resultado esperado | Motivo |
|---|---|---|
| Entrada con todas las capas identificadas, evidencia aprobada y sin dependencia de audio | `PASS` posible | Sujeto a los 12 controles aplicables y a revisión editorial |
| Entrada cuyo texto dice «escucha el audio para distinguir A de B» y no explica el contraste | `HOLD` | WRT-01 y WRT-05 |
| Entrada que muestra una romanización como si fuera transcripción IPA | `HOLD` | WRT-03 y WRT-04 |
| Entrada que presenta un contorno inventado como medición real | `HOLD` | WRT-06 y WRT-10 |
| Entrada con transcripción respaldada, pero caracteres corrompidos en PDF | `HOLD` para esa exportación | WRT-09 y WRT-12 |
| Entrada que contiene todos los bloques pero sigue `SOURCE_MAPPED` | `HOLD` para publicación | Falta el gate R33; maquetación no certifica claims |
| Entrada que declara explícitamente «la evidencia no permite concluir X» | `PASS` posible | No es un defecto si el límite está explicado y el resto cumple |
| Entrada con bibliografía completa pero sin localizadores para claims materiales | `HOLD` | WRT-10 y checklist de evidencia |

Los casos son **pruebas editoriales hipotéticas**, no diagnósticos de ninguna entrada existente.

## 7. Convivencia con el linter estructural

El linter documentado en `qa/LINT-RULES.md` detecta problemas de ID, Unicode, fuentes y ciertas estructuras. **No debe afirmar que ejecuta WRT-01…12** sin un validador y pruebas propios.

Automatizable con bajo riesgo:

- presencia de encabezados o etiquetas explícitas;
- caracteres de sustitución U+FFFD y normalización Unicode;
- referencias internas y duplicados;
- existencia del bloque de fuentes cuando corresponde;
- detección orientativa de frases que sugieren ejercicios o audio obligatorio.

**Requiere revisión humana:** pertinencia del alcance, equivalencia entre sonidos, fidelidad de la transcripción, suficiencia de la explicación, adecuación de la fuente, validez de localizadores y decisión de `READY_FOR_COMPOSITION`.

Una búsqueda textual de la palabra «escuchar» **no** constituye prueba de incumplimiento: puede aparecer legítimamente en una explicación de percepción del habla.

## 8. Revisión, versionado y trazabilidad

El resultado WRT se asocia a `entry_id + revision`, según `written-only-composition-gate.md`. El archivo `entry-metadata-schema.md` no obliga actualmente a YAML/JSON: la muestra YAML del gate es **formato ilustrativo de registro**, no un nuevo frontmatter obligatorio.

Un cambio sustantivo de contenido o de transcripción activa revalidación R33 según la política vigente. Un cambio de diseño puede exigir revalidar WRT-09/12 y exportación sin invalidar automáticamente los claims lingüísticos.

## 9. Compatibilidad y no objetivos

- **R32:** mantiene entradas modulares, navegación y separación de capítulos.
- **R33:** sigue siendo autoridad para evidencia y localizadores; no se inventa un estado nuevo.
- **R44:** coordina revisiones; no convierte PASS de formato en PASS lingüístico.
- **Sin audio obligatorio, ejercicios ni evaluaciones del lector.**
- **Sin modificar tomos lingüísticos existentes.**
- **Sin fusionar este PR directamente a `main`.**

## 10. Criterio para integrar esta propuesta

Antes de incorporar estos tres documentos a la rama matriz:

1. confirmar que no duplican ni contradicen una política de composición más reciente;
2. validar que la tabla de correspondencias respeta la plantilla y el esquema de metadatos;
3. aprobar el gate como control **editorial**, no lingüístico;
4. decidir si se aplica en el primer prototipo de composición o en toda la primera edición.

**Estado actual de esta propuesta:** lista para revisión editorial; no certifica ninguna entrada individual.
