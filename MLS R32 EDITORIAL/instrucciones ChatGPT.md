# Flujo editorial ChatGPT para MASTER LANGUAGE SYSTEM Revision 32

## Objetivo

ChatGPT actúa como un motor editorial adicional. No crea un estilo propio. Toda entrada debe parecer parte de la misma colección que las entradas ya publicadas.

La autoridad editorial se reparte así:

1. `SYSTEM_PROMPT` y `LANGUAGE_MODULES` del runtime R32 gobiernan precisión lingüística y pedagogía.
2. Las entradas ya publicadas gobiernan voz, densidad, estructura, proporción de ejemplos y cierre.
3. El contrato `MLS R32 EDITORIAL/contrato editorial.js` gobierna formato, límites y validación de importación.

## Comando operativo

Cuando el usuario escriba, por ejemplo:

`MLS: adelanta 50`

el flujo debe ser:

1. Consultar `/api/wiki/editorial/pending?limit=50`.
2. Respetar exactamente el orden FIFO devuelto.
3. Para cada código consultar `/api/wiki/editorial/context?code=CODIGO&limit=6`.
4. Usar `target`, `profile` y `references` como calibración obligatoria.
5. Redactar bajo el mismo criterio lingüístico de R32.
6. No imitar frases literalmente ni copiar párrafos de las referencias. Imitar únicamente la firma editorial: extensión relativa, estructura, densidad, tecnicismo, ejemplos y cierre.
7. Validar título, idioma, nivel, parte, capítulo, ejemplos y Markdown.
8. Crear un lote JSON dentro de `MLS R32 EDITORIAL/lotes/`.
9. Incluir en `calibration.referenceCodes` los códigos realmente consultados y en `calibration.profile` el perfil devuelto por el endpoint de contexto.
10. El despliegue ejecutará `scripts/importar lotes editoriales.js`, que validará e importará el lote a D1 de forma idempotente.

## Principio de coherencia

Una entrada nueva se rechaza aunque sea lingüísticamente correcta si parece pertenecer a otra colección.

Debe mantener coherencia con las entradas publicadas en:

- extensión relativa;
- cantidad y orden de secciones;
- densidad de ejemplos;
- longitud de párrafos;
- nivel de tecnicismo;
- progresión de la explicación;
- forma de cerrar.

## Seguridad editorial

- No publicar ejercicios, exámenes, quizzes, tareas, flashcards ni gamificación.
- No convertir MLS en curso.
- No revelar al lector el motor generador.
- La procedencia se conserva solo internamente.
- No sobrescribir una entrada ya publicada: la importación usa `ON CONFLICT(code) DO NOTHING`.
- No generar fuera del orden FIFO salvo instrucción explícita del usuario.

## Formato mínimo de lote

```json
{
  "id": "MLS lote editorial 001",
  "standard": "MLS R32",
  "promptVersion": "32.0",
  "generator": "chatgpt",
  "generatorModel": "GPT 5.6 Sol",
  "generatedAt": "2026-09-12T00:00:00.000Z",
  "calibration": {
    "mode": "published-corpus",
    "referenceCodes": ["MLS-V10-0001"],
    "profile": {
      "available": true,
      "sampleSize": 1,
      "words": {"min": 300, "max": 300, "average": 300},
      "headings": {"min": 4, "max": 4, "average": 4}
    }
  },
  "articles": []
}
```

El perfil real debe proceder del endpoint editorial; el ejemplo anterior es únicamente estructural.
