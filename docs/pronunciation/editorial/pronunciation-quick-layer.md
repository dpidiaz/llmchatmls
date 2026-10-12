# MLS-SND — Pronunciation Quick Layer

**Estado:** norma R32/composición v0.1.  
**Función:** reducir fricción de lectura sin degradar precisión ni modificar R33.

## 1. Principio

Cuando una entrada o ejemplo contenga una forma pronunciable concreta, la edición de lectura puede ofrecer una capa breve antes del análisis profundo:

`forma original → significado/glosa → pronunciación fácil → IPA → alcance/variedad → detalle opcional`

Esta secuencia es una **proyección de composición**. No reemplaza el archivo canónico, la transcripción aprobada ni la evidencia.

## 2. Qué es la pronunciación fácil

La **pronunciación fácil** es una ayuda pedagógica localizada para un lector concreto.

Debe ser:

- derivada de contenido lingüístico ya aprobado;
- dependiente del idioma de interfaz/lector;
- explícitamente aproximada;
- breve y legible;
- reversible hacia la explicación profunda mediante enlace o bloque expandido.

No es:

- IPA;
- una nueva transcripción fonológica;
- una fuente;
- un claim R33;
- una representación universal;
- evidencia suficiente para promover una entrada.

Una ayuda pensada para un lector hispanohablante no se reutiliza automáticamente para un lector anglófono, lusófono, japonófono, etc.

## 3. Canonicalidad

Se conserva esta jerarquía:

1. **canónico lingüístico:** análisis, IPA/transcripción, alcance y contenido aprobado;
2. **canónico evidencial:** R33, fuentes, localizadores y provenance;
3. **derivado de composición:** pronunciación fácil, orden visual y microcopy para el lector.

La capa derivada nunca puede corregir ni sobreescribir las dos capas canónicas.

## 4. Aplicabilidad

La capa rápida no es obligatoria en toda entrada.

### PRESENT

Usar cuando existe una forma, ejemplo o contraste concreto con suficiente contenido aprobado para derivarla.

### NOT_APPLICABLE

Usar en entradas puramente conceptuales, de alcance, política, tipología o aparato editorial sin una forma pronunciable concreta que deba ejemplificarse.

### OMITTED_WITH_REASON

Usar cuando sería potencialmente útil, pero la versión aprobada todavía no contiene la representación necesaria. COMPOSITION no debe rellenar el hueco por inferencia.

Si producir la ayuda requiere una decisión fonética nueva, la entrada vuelve al gate lingüístico/editorial pertinente.

## 5. Orden visual recomendado

Cuando sea aplicable:

**Forma original**  
Significado o glosa breve  
**Pronunciación fácil (aprox.)**  
IPA fonológico y/o fonético aprobado, si corresponde  
Variedad, región, registro o warning breve, si es material  
Enlace o bloque: **Ver explicación de pronunciación**

El orden puede adaptarse a la entrada, pero la forma original y el alcance nunca deben quedar subordinados a la respelling.

## 6. Reglas de respelling

- Debe declarar el **reader locale** para el que fue diseñada.
- No usar barras `/ /` ni corchetes `[ ]`; están reservados a representaciones lingüísticas.
- No imitar IPA con signos parciales que puedan confundirse con una transcripción formal.
- Puede usar separación silábica o marca visual de prominencia solo si la convención está definida en la interfaz.
- No introducir sonidos, contrastes, acentos o alófonos ausentes del contenido aprobado.
- No derivar pronunciación desde la ortografía por intuición cuando no exista respaldo suficiente.
- Si una aproximación oculta una diferencia material, mostrar una advertencia o no usarla.
- La etiqueta visible debe incluir **aprox.**, **aproximada** o equivalente localizado.

## 7. IPA y sistemas locales

La pronunciación fácil **acompaña**, no reemplaza:

- /representación fonológica/;
- [representación fonética];
- Zhuyin;
- kana;
- hangul;
- cirílico;
- romanización/transliteración identificada.

En una vista básica puede ocultarse detalle avanzado detrás de expansión, pero debe seguir siendo accesible en la misma entrada.

## 8. Significado y glosa

La glosa sirve para identificar la forma, no para convertir MLS-SND en un diccionario general.

Debe:

- ser breve;
- corresponder al ejemplo realmente mostrado;
- evitar traducciones forzadas cuando no exista equivalencia directa;
- distinguir significado de explicación fonética.

## 9. Variación

Si la pronunciación depende materialmente de variedad, región, edad, registro o contexto, la capa rápida debe conservar una etiqueta mínima de alcance.

Nunca:

> forma → “pronunciación”

cuando la evidencia realmente sea:

> forma → realización documentada en variedad/contexto X.

## 10. Almacenamiento / handoff

La capa rápida vive en la **reader-facing projection / Composition Handoff Manifest**, no en la tabla R33.

Campos recomendados:

```yaml
quick_layer:
  status: PRESENT | NOT_APPLICABLE | OMITTED_WITH_REASON
  reader_locale: es | en | pt-BR | ...
  source_form: <forma ya aprobada>
  meaning_or_gloss: <si aplica>
  easy_pronunciation: <ayuda derivada; no IPA>
  ipa_source: <sección/campo canónico del que procede, si aplica>
  scope_note: <variedad/contexto material>
  deep_link: <ID/sección>
  derivation_note: <cómo se obtuvo sin introducir claims>
```

Los campos vacíos no deben rellenarse con inferencias.

## 11. Gate

Antes de publicar una Pronunciation Quick Layer:

- la forma fuente debe estar aprobada;
- cualquier IPA mostrado debe ser el aprobado;
- la respelling debe revisarse para el locale del lector;
- el alcance material debe conservarse;
- debe quedar claro que la ayuda es aproximada;
- no puede ser el único soporte escrito de la pronunciación cuando existe una representación formal necesaria.

Un error en la respelling que pueda cambiar la lectura lingüística es **BLOCKING** para esa proyección.

## 12. Relación con R33

R33 permanece intacto.

La capa rápida puede registrar internamente de qué bloque aprobado se deriva, pero:

- no crea claim IDs;
- no convierte una ayuda pedagógica en evidencia;
- no cambia `source_id`;
- no cambia localizadores;
- no promueve estados.

## 13. Audio

La capa rápida funciona sin audio.

Si existe audio futuro, será complementario:

`forma → pronunciación fácil → IPA → audio opcional → explicación`

La comprensión básica nunca dependerá de reproducir sonido.

## 14. Piloto inicial

El piloto de arquitectura usa entradas ya `READY_FOR_COMPOSITION`:

- **SND-FND-002:** `NOT_APPLICABLE` — entrada conceptual sin forma léxica concreta.
- **SND-ENUS-001:** `NOT_APPLICABLE` — entrada de alcance/variedad, no ejemplo fonético.
- **SND-ZHTW-007:** `OMITTED_WITH_REASON` — la versión aprobada no contiene ejemplos reader-facing de Zhuyin; composición no debe inventarlos.

El piloto demuestra que esta capa es **condicional**, no una plantilla que obliga a fabricar pronunciaciones.

## 15. Regla de diseño

La meta de R32 aquí es:

> **hacer la pronunciación fácil de encontrar sin hacerla menos rigurosa.**

La capa rápida reduce fricción; las capas profundas preservan precisión, variación y auditabilidad.
