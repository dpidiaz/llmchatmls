# Profesor IA Comparación Conceptual

Versión: `professorComparisonVersion = 1.0`

## Objetivo

Convertir las acciones de comparación del Profesor IA en una operación enciclopédica controlada, no en una instrucción genérica al modelo.

## Contrato

La comparación parte siempre del tema actual como concepto X. Para `Compáralo con…`, el concepto Y es el texto explícito introducido por el usuario. El sistema intenta resolver Y únicamente mediante coincidencia exacta de título u objetivo dentro de la misma enciclopedia y excluye la entrada actual.

No existe fuzzy matching. No se cruzan idiomas. No se inventan códigos, enlaces ni entradas MLS. Si Y no corresponde exactamente a una entrada existente, el Profesor puede compararlo como concepto aportado por el usuario, pero debe mantenerlo como concepto externo no resuelto.

Cuando Y sí se resuelve, la directiva aporta su código, título canónico y objetivo disponible. El Profesor debe usar el título canónico cuando resulte natural para que la capa de enlaces internos seguros pueda reconocer la mención en la respuesta.

## Estructura de respuesta

La respuesta debe cubrir, cuando corresponda:

1. definición breve de X;
2. definición breve de Y;
3. similitudes pertinentes;
4. diferencias usando criterios paralelos;
5. ejemplos paralelos comparables;
6. síntesis de cuándo corresponde cada concepto.

No se fuerza falsa equivalencia. Si una dimensión no admite comparación útil, debe indicarse claramente.

La acción `Explícame la diferencia` se mantiene dentro de los conceptos realmente presentes o implícitos en la entrada actual y no inventa un segundo término.

## Invariantes

La comparación conserva la variante lingüística y el sistema de escritura canónicos del idioma activo. Las diferencias regionales legítimas no se tratan como errores. No modifica el artículo publicado, R32, FIFO, AUTOOPT, D1, materialización, Atlas, voz, TTS ni el proveedor de IA. No añade cursos, exámenes o ejercicios obligatorios.
