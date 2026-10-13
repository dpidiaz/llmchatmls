# MLS-SND — Política de composición de página

Estado: **norma editorial v0.2**.

## 1. Regla principal

**Cada entrada comienza en una página nueva.**

La regla significa inicio inequívoco, no “una entrada = una página”.

Una entrada puede ocupar tantas páginas como requiera una explicación clara y documentada.

## 2. Razón editorial

El comienzo en página nueva permite:

- localizar rápidamente el título;
- separar conceptos próximos sin confundirlos;
- mantener la consulta modular;
- facilitar enlaces desde índices;
- reutilizar entradas en formatos digitales;
- evitar que una entrada comience visualmente subordinada a la anterior.

## 3. Lo que no se hará

No se debe:

- recortar una explicación para que quepa en una página;
- reducir el cuerpo tipográfico para “hacerla entrar”;
- dividir una entrada solo por paginación;
- insertar ejercicios para llenar espacios;
- forzar idéntico número de páginas por idioma.

## 4. Encabezado de entrada

El inicio de una entrada debe mostrar, en jerarquía:

1. número editorial de la edición, si existe;
2. título;
3. ID canónico;
4. idioma y bandera cuando corresponda;
5. variedad;
6. dominio;
7. etiqueta de representación si es material.

Los estados internos de workflow/R33 no forman parte necesariamente de la edición destinada al lector.

## 5. Bloques recomendados

El diseño debe reconocer visualmente, cuando existan:

- Pronunciation Quick Layer / acceso rápido;
- explicación principal;
- IPA/transcripción;
- escritura original;
- comparación;
- advertencia de equivalencia;
- variación;
- nota editorial visible al lector, si procede;
- fuentes;
- entradas relacionadas.

No todos los bloques son obligatorios en todas las entradas.


### 5.1 Pronunciation Quick Layer

Cuando la entrada tenga una capa rápida aprobada en el handoff, debe aparecer **antes del análisis profundo** y mantener una jerarquía visual compacta:

1. forma original;
2. significado/glosa breve;
3. **Pronunciación fácil (aprox.)** en el locale del lector;
4. IPA aprobado, si corresponde;
5. variedad/contexto material;
6. acceso a la explicación completa.

La capa rápida debe sentirse como una ayuda de consulta, no como un bloque técnico de R33.

Reglas visuales:

- la forma original tiene mayor prioridad que la respelling;
- la pronunciación fácil usa una etiqueta explícita de aproximación;
- IPA conserva su tipografía y delimitadores propios;
- alcance/variedad puede mostrarse como metadata secundaria, pero nunca desaparecer cuando sea material;
- no usar color como única diferencia entre pronunciación fácil e IPA;
- no añadir contenido para equilibrar visualmente la caja;
- `NOT_APPLICABLE` y `OMITTED_WITH_REASON` no producen una caja vacía.

La especificación completa está en `pronunciation-quick-layer.md`.

## 6. Transcripciones

Las secuencias IPA deben:

- usar una tipografía con cobertura adecuada;
- distinguir claramente / / y [ ];
- evitar saltos de línea que separen símbolos combinantes de su base;
- conservar diacríticos;
- poder copiarse como Unicode real en formatos digitales.

## 7. Sistemas de escritura

Para zh-TW, ko, ja y ru, la composición debe reservar espacio suficiente para escritura original sin convertir romanización en capa visual dominante por defecto.

## 8. Tablas

Las tablas se usan cuando comparan dimensiones homogéneas.

No usar una tabla si obliga a simplificar fenómenos no equivalentes para llenar columnas simétricas.

## 9. Fuentes y evidencia

La edición de consulta mostrará bibliografía y localizadores según la política final de “Fuentes y fundamento”.

Los metadatos internos de auditoría pueden mantenerse en el repositorio sin cargar visualmente la página de lectura.

## 10. PDF e interfaz digital

La misma entrada debe poder resolverse en:

- página/secuencia de páginas PDF;
- ruta individual web;
- navegación por ID;
- índice de idioma;
- índice de fenómeno.

La composición impresa no debe ser el único modelo de navegación.
