# SND-REF-008 — Grafo de referencias cruzadas

**Estado:** BOOTSTRAP_V0_1.

## Propósito

El grafo conecta entradas por **IDs canónicos** para permitir navegación, validación de dependencias y futuras vistas digitales.

Archivo machine-readable asociado:

`reference/cross-reference-edges.tsv`

## Qué significa una arista

Una arista expresa una relación editorial explícita. **No implica equivalencia fonética, identidad tipológica ni evidencia compartida.**

### Tipos usados en el bootstrap

- `PREREQUISITE` — conviene comprender la entrada destino antes de la entrada origen.
- `RELATED` — relación temática sin dependencia fuerte.
- `REPRESENTATION` — relación entre fenómeno/perfil y una capa de escritura, romanización o transcripción.
- `EVIDENCE_CONTEXT` — entrada de alcance/variedad que delimita cómo interpretar otras entradas del mismo perfil.

El bootstrap no usa todavía `COMPARE` ni `SEE_ALSO_LANGUAGE`; esas relaciones deben añadirse cuando los capítulos comparativos y perfiles estén suficientemente maduros.

## Alcance del bootstrap

Se incluyen únicamente:

1. dependencias explícitas del Master Inventory;
2. enlaces de cada entrada de idioma hacia su `*-001` de alcance;
3. relaciones de representación que ya están declaradas en títulos/políticas del proyecto.

## Lo que no contiene

- claims R33;
- fuentes bibliográficas;
- estados de workflow;
- números de capítulo o página;
- enlaces comparativos inferidos por traducción del título.

## Regla anti-equivalencia

Dos entradas pueden apuntar al mismo fundamento sin que sus realizaciones sean equivalentes.

Ejemplo conceptual:

`JA-003 → FND-010` y `DE-003 → FND-010` significaría que ambas tratan duración/cantidad; **no** que japonés y alemán tengan el mismo sistema de longitud.

## Reglas de mantenimiento

1. Los nodos son IDs canónicos `SND-*`.
2. Una arista nueva debe poder justificarse por inventario, metadata o decisión editorial explícita.
3. No usar aristas para sustituir tablas claim ↔ source ↔ locator.
4. No copiar estados R33/R44 al TSV.
5. Si una entrada se retira o fusiona, actualizar aristas según la política de IDs.
6. Las relaciones comparativas interlingüísticas requieren revisión humana.

## Validaciones futuras

Cuando exista tooling de build, validar automáticamente:

- que todo `source_id` y `target_id` exista;
- que no haya IDs retirados sin redirect;
- que las relaciones pertenezcan al vocabulario controlado;
- que no haya aristas duplicadas;
- que los `EVIDENCE_CONTEXT` de perfiles apunten a la entrada de alcance correcta;
- que los índices por idioma/fenómeno puedan derivar navegación coherente del mismo conjunto de IDs.

## Métricas del bootstrap

- Aristas iniciales: 117.
- Perfiles cubiertos por `EVIDENCE_CONTEXT`: 10.
- Relaciones comparativas interlingüísticas: 0 (deliberadamente diferidas).