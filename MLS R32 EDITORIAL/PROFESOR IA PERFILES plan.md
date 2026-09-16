# Profesor IA especializado por idioma — plan

Objetivo: especializar Profesor IA para las diez enciclopedias sin duplicar diez tutores independientes ni convertir MLS en un curso.

## Arquitectura

1. Mantener un núcleo común de comportamiento del Profesor IA.
2. Resolver un perfil por `entry.language` o `meta.slug`.
3. Añadir el perfil solo al contexto enviado al Profesor IA; no modificar el artículo publicado.
4. Mantener los perfiles aislados entre idiomas.
5. Exponer `professorProfileVersion` para diagnóstico y futuras migraciones.
6. Usar perfil neutral cuando el idioma no se reconozca, sin inventar variante.

## Reglas comunes

- La entrada actual es el contexto principal, no una cárcel temática: se pueden explicar conceptos vecinos cuando la pregunta lo requiera.
- Explicación por defecto en español, salvo petición explícita del usuario.
- No imponer ejercicios, exámenes, repasos, progreso ni tareas.
- No corregir silenciosamente un artículo publicado; una discrepancia debe señalarse como posible discrepancia.
- No forzar categorías españolas sobre estructuras que no sean equivalentes.
- No almacenar respuestas conversacionales como artículos de la enciclopedia.

## Perfiles canónicos

- Español de Guatemala: variante guatemalteca, voseo legítimo sin imposición artificial.
- Inglés: inglés contemporáneo ampliamente inteligible; variantes explícitas cuando sean relevantes.
- Portugués brasileño: Brasil como norma principal, sin sustitución por portugués europeo.
- Italiano: italiano estándar contemporáneo.
- Francés: francés estándar con distinción escrita/hablada cuando corresponda.
- Alemán: Standarddeutsch, género/caso/orden verbal precisos.
- Japonés: kanji/kana principales; rōmaji solo auxiliar.
- Chino mandarín de Taiwán: tradicionales y norma de Taiwán; zhuyin/pinyin auxiliares.
- Coreano: Hangul principal; romanización auxiliar.
- Ruso: cirílico principal; transliteración auxiliar.

## Límites

Esta capa no cambia R32, AUTOOPT, FIFO, materialización, artículos, navegación, Atlas, voz ni publicación. No usa proveedores nuevos ni requiere Work. Antes de merge/deploy deben pasar la suite editorial, predeploy, contrato de deploy y Wrangler dry run.
