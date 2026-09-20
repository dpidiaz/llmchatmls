# MLS EXPERIENCE REFINEMENT R1 — RELEASE NOTES

Fecha de cierre y producción: **20 de septiembre de 2026**

## Qué cambia para el usuario

### Orientación

La navegación usa etiquetas más claras y una jerarquía más comprensible. El Home explica mejor que el usuario puede buscar directamente o explorar por idioma.

### Continuar leyendo

`Seguir leyendo` ahora puede devolver al usuario a su contexto real de lectura. Las aperturas normales continúan empezando al inicio del artículo.

### También mira

Cuando una entrada tiene pocos enlaces editoriales directos, MLS puede completar la sección con temas semánticamente relacionados del mismo idioma. Los enlaces editoriales siempre conservan prioridad.

### Offline

La biblioteca offline se administra separadamente del App Shell. MLS verifica que los archivos realmente existan antes de declarar una biblioteca lista y permite preparar idiomas seleccionados.

La interfaz distingue claramente entre:

- contenido de biblioteca disponible sin Internet;
- funciones de IA que requieren conexión.

### Virtuoso y Profesor IA

Virtuoso conserva su personalidad de bibliotecario dentro de su página, mientras que la navegación general usa la etiqueta pública **Buscar**.

Los mensajes de Virtuoso y Profesor IA fueron normalizados para ser más claros sin exponer detalles técnicos innecesarios.

### Accesibilidad y responsive

R1 incorpora:

- skip link;
- foco visible;
- targets táctiles mínimos;
- reduced motion;
- mejor ancho de lectura en tablet/desktop intermedio;
- restauración de foco de Profesor IA;
- semántica accesible para estados offline y progreso.

## QA final

Baseline automático:

**23 PASS / 0 FAIL**

QA renderizado:

`320 / 375 / 390 / 430 / 768 / 1024 / 1280 / 1440 / 1920`

Reflow:

- 200% — PASS
- 400% — PASS

## Lo que no cambió

- `content/` no fue modificado.
- El Reader no requiere D1.
- El Reader no requiere IA.
- Full-text conserva fallback.
- Virtuoso conserva fallback canónico.
- Profesor IA sigue siendo distinto de Virtuoso.
- No se añadió gamificación.
- No se añadió proveedor IA de pago.

## Producción

PR final: **#110**

Producto fusionado:

`50e0ba4e57472ae3ef36ddb476c623e85ede554a`

Cloudflare Worker Version ID:

`dffa9299-7e60-4fdb-886b-05de128bdf1c`

Estado: **DESPLEGADO Y VERIFICADO**
