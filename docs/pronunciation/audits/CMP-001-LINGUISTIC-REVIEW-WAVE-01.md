# CMP-001 linguistic review — wave 01

**Fecha:** 2026-10-11
**Entrada:** SND-CMP-001
**Tipo:** LINGUISTIC_REVIEW / revisión metodológica transversal.

## Dictamen

**PASS_WITH_SCOPE_CORRECTION → LINGUISTIC_REVIEW**

La arquitectura comparativa es lingüísticamente sólida y preserva la prioridad descriptiva de la lengua objetivo. Se aplicaron dos correcciones de alcance antes de aprobar el gate.

## Claims revisados

### CMP001-C01 — IPA como infraestructura descriptiva

**PASS.**

El IPA ofrece dimensiones comunes para describir consonantes, vocales, suprasegmentales y otros fenómenos, pero la entrada no lo convierte en inventario de ninguna lengua.

### CMP001-C02 / C03 — fonética, fonología y fonotáctica

**PASS.**

La entrada separa correctamente realización física, organización fonológica y restricciones de distribución. SND-SRC-0024 es suficiente como apoyo introductorio para estos principios, sin usarse como única fuente de fenómenos específicos por idioma.

### CMP001-C04 — /p/ y VOT

**PASS.**

Lee & Iverson (2017) dicen explícitamente que español e inglés pueden compartir el fonema /p/ mientras presentan valores diferentes de VOT.

La entrada usa ese ejemplo únicamente como control metodológico, no como descripción general de todas las variedades de español o inglés.

### CMP001-C05 — vocales altas centrales

**PASS_WITH_CORRECTION.**

La formulación anterior sugería demasiado directamente un /ɨ/ compartido de manera uniforme entre polaco, ucraniano y ruso.

Cavar et al. (2025) comparan vocales altas centrales/centralizadas funcionalmente correspondientes y documentan diferencias articulatorias. Polaco y ruso suelen aparecer con [ɨ]; la vocal ucraniana comparada también se representa como [ɪ] en la literatura discutida.

La entrada fue corregida para que la inferencia metodológica sea: comparabilidad funcional, etiqueta cercana o notación amplia parecida no implican identidad física.

## Taxonomía MLS

Las cuatro relaciones — IDENTIDAD DOCUMENTADA, SEMEJANZA PARCIAL, APROXIMACIÓN ARTICULATORIA y SIN EQUIVALENTE DIRECTO ÚTIL — son convenciones editoriales de MLS-SND y siguen identificadas como tales.

### Corrección de granularidad

IDENTIDAD DOCUMENTADA ahora exige declarar dimensión comparada, granularidad y contexto/variedad cuando sea material. No significa “mismo sonido en todos los sentidos”.

### Corrección de aproximación articulatoria

Una semejanza de postura no funciona como regla de producción suficiente cuando el contraste depende materialmente de duración, VOT, fonación, coordinación gestual, F0 u otras pistas acústicas/prosódicas.

## Gate de salida

**SND-CMP-001 → LINGUISTIC_REVIEW.**

No autoriza:
- abrir automáticamente CMP-002…011;
- usar comparaciones sin fuentes de ambos lados;
- inferir equivalencia desde grafía o IPA amplio;
- pasar a READY_FOR_COMPOSITION sin revisión editorial.