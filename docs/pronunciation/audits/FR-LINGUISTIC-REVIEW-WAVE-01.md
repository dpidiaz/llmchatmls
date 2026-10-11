# French linguistic review — wave 01

**Fecha:** 2026-10-11  
**Alcance:** SND-FR-001, SND-FR-002, SND-FR-009 ya integradas en `feat/mls-snd-foundation`.  
**Tipo:** LINGUISTIC_REVIEW / claim-source-scope audit.  
**No cubre:** FR-003…008, actualmente trabajadas por otra wave.

## Resultado global

**PASS_WITH_SCOPE_WARNINGS**

No se detectaron claims materiales claramente falsos ni citas que contradigan las fuentes comprobadas.

El riesgo principal no está en los datos, sino en la futura **conflación de etiquetas de variedad**: `parisino`, `norte de Francia`, `metropolitano` y `supralocal` deben conservarse como alcances relacionados pero no equivalentes por defecto.

---

## SND-FR-001 — Selección de variedad de referencia

**Dictamen:** PASS_WITH_SCOPE_WARNING.

### Claims verificados

- **FR001-C01:** PFC declara explícitamente el objetivo de ofrecer una mejor imagen del francés hablado en su “unidad y diversidad”. PASS.
- **FR001-C02:** PFC enumera coordinaciones regionales para África, Canadá, France-Nord, France-Sud, Maghreb/Proche Orient, Suiza, Bélgica, Océano Índico y Estados Unidos. PASS.
- **FR001-C03:** Fougeron & Smith (1993) dicen explícitamente que su descripción se basa en una joven hablante parisina. PASS.
- **FR001-C04:** Chalier (2021) reporta una tendencia bicéntrica con norma dominante europea asociada a París y norteamericana asociada a Québec. PASS.
- **FR001-C05:** la base pública PFC exige que el uso de uno o dos puntos concretos cite la encuesta y su publicación principal. PASS.

### Advertencia de alcance

La propuesta:

> francés metropolitano supralocal / norte de Francia

es una **decisión MLS**, como la propia entrada declara. Antes de congelar la referencia debe evitarse que la barra “/” sugiera identidad entre:
- supralocal French como categoría usada en literatura;
- norte de Francia como alcance geográfico;
- París como punto/área concreta;
- francés metropolitano como marco editorial más amplio.

### Recomendación

Mantener `REFERENCE_PROVISIONAL`. Al seleccionar subcorpus PFC, reemplazar la fórmula abreviada por una definición operacional explícita.

---

## SND-FR-002 — Vocales y contrastes

**Dictamen:** PASS_WITH_SCOPE_WARNING.

### Claims verificados

- **FR002-C01:** Fougeron & Smith: joven hablante parisina; diferencias entre variedades asociadas en parte al mantenimiento/pérdida de contrastes. PASS.
- **FR002-C02:** Griffiths & Renwick (2025) describen /e~ɛ/, /o~ɔ/, /ø~œ/ como contrastes marginales, ni completamente contrastivos ni puramente alofónicos, con realizaciones solapadas/variables. PASS.
- **FR002-C03:** Mooney (2023), en su marco de antecedentes, distingue norma prescriptiva con cuatro vocales nasales y norma hablada supralocal con tres. PASS.
- **FR002-C04:** Mooney atribuye la reducción a tres a la fusión /œ̃/–/ɛ̃/, mayoritaria entre hablantes del norte de Francia en la literatura citada. PASS.
- **FR002-C05:** el artículo documenta un cambio en curso en las vocales nasales del francés parisino. PASS.

### Advertencia de alcance

El sistema de tres vocales nasales procede de la caracterización supralocal utilizada en la literatura citada por Mooney; no debe convertirse automáticamente en “el inventario moderno del francés”.

Del mismo modo, los contrastes medios estudiados por Griffiths & Renwick son **parisinos** y no justifican extrapolación panfrancófona.

### Recomendación

Mantener el estado EVIDENCE_CHECKED del mapa descriptivo, pero conservar el inventario final bloqueado hasta que el perfil defina su subcorpus/variedad primaria.

---

## SND-FR-009 — Variación documentada en PFC

**Dictamen:** PASS.

### Claims verificados

- **FR009-C01:** objetivo de unidad y diversidad. PASS.
- **FR009-C02:** protocolo común con lista de palabras, lectura de texto, conversación guiada y conversación espontánea/libre. PASS.
- **FR009-C03:** PFC documenta lugar, sexo, edad y parámetros adicionales como profesión y nivel educativo. PASS.
- **FR009-C04:** la página institucional actual indica más de 50 encuestas y más de 400 hablantes. PASS.
- **FR009-C05:** PFC exige encuesta + publicación principal al usar datos de uno o dos puntos concretos. PASS.

### Nota

PFC ofrece infraestructura de comparación y metadatos, pero la entrada ya evita correctamente tratar una observación de corpus como análisis lingüístico autosuficiente.

---

## Fuentes comprobadas durante review

1. Programme PFC, página de investigación/protocolo.
2. Base pública FLORAL-PFC y condiciones de uso.
3. Fougeron, C., & Smith, C. L. (1993). *French*. JIPA 23(2), 73–76.
4. Chalier, M. (2021). *Les normes de prononciation du français*.
5. Griffiths, J. M., & Renwick, M. E. L. (2025). *Reconsidering the mid-vowel system of Parisian French*. Isogloss 11(5).
6. Mooney, D. (2023). *The role of speaker sex and sexuality in an ongoing sound change: Nasal vowels in Parisian French*. JFLS 33(3), 357–384.

## Gate de salida

- FR-001: **LINGUISTIC_REVIEW = PASS_WITH_SCOPE_WARNING**.
- FR-002: **LINGUISTIC_REVIEW = PASS_WITH_SCOPE_WARNING**.
- FR-009: **LINGUISTIC_REVIEW = PASS**.

No se promueve aquí a EDITORIAL_REVIEW ni READY_FOR_COMPOSITION.

## Acción requerida antes de freeze

Definir operacionalmente la referencia francesa sin convertir “parisino”, “norte de Francia”, “metropolitano” y “supralocal” en etiquetas intercambiables.
