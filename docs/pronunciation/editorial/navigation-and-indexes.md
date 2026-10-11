# MLS-SND — Navegación e índices

Estado: **diseño editorial v0.1**.

## 1. Dos formas de lectura

El tomo debe funcionar en:

### Lectura progresiva

Fundamentos → representación → perfiles → comparación → referencia.

### Consulta

El lector llega directamente a una entrada y puede reconstruir el contexto mediante metadatos y enlaces.

## 2. Navegación mínima de cada entrada

Cada entrada debe poder mostrar:

- **Anterior / Siguiente** dentro de su secuencia editorial;
- **Parte / capítulo**;
- **Entradas relacionadas**;
- **Volver al perfil del idioma**, cuando corresponda;
- **Glosario/IPA** para términos o símbolos técnicos.

## 3. Índice por idioma

Agrupa entradas bajo:

- 🇬🇹 Español de Guatemala;
- 🇺🇸 Inglés estadounidense;
- 🇧🇷 Portugués brasileño — referencia carioca;
- 🇮🇹 Italiano;
- 🇫🇷 Francés;
- 🇩🇪 Alemán;
- 🇹🇼 Mandarín de Taiwán;
- 🇰🇷 Coreano;
- 🇯🇵 Japonés;
- 🇷🇺 Ruso.

Los fundamentos transversales se listan aparte.

## 4. Índice por fenómeno

Taxonomía inicial:

- articulación;
- consonantes;
- vocales;
- sílaba;
- fonotáctica;
- duración/cantidad;
- acento/prominencia;
- ritmo;
- tono;
- acento tonal;
- entonación;
- habla conectada;
- variación;
- escritura;
- romanización;
- transliteración;
- IPA/transcripción.

Una entrada puede pertenecer a más de una categoría.

## 5. Índice IPA

No será una simple reproducción de la tabla IPA.

Para cada símbolo realmente utilizado por MLS-SND podrá indicar:

- símbolo;
- nombre/descripción breve;
- entradas donde aparece;
- idiomas/perfiles donde se usa;
- enlace a la explicación correspondiente.

Que un símbolo aparezca en el índice no significa que exista en todos los idiomas.

## 6. Índice de variedades

Debe permitir encontrar descripciones por alcance:

- país/región;
- estándar/norma cuando esté definido;
- urbano/regional;
- corpus o muestra particular si es importante.

Esto ayuda a que la variedad no quede escondida en el cuerpo.

## 7. Índice de sistemas de representación

Agrupa recursos sobre:

- IPA;
- Zhuyin;
- Romanización Revisada coreana;
- romanizaciones que se aprueben posteriormente;
- kana/kanji;
- hangul;
- cirílico;
- ortografías latinas.

## 8. Grafo de referencias cruzadas

La generación digital futura puede derivar un grafo a partir de IDs.

Nodos = entradas.  
Aristas = tipos definidos en `id-and-linking-policy.md`.

El grafo es una herramienta de navegación; no implica semejanza lingüística automática.

## 9. Regla anti-repetición

Antes de redefinir un término en un perfil:

1. comprobar si existe una entrada FND/REP;
2. enlazarla;
3. explicar únicamente qué cambia o importa en ese idioma.

Así se cumple:

**definir transversalmente una vez; especializar localmente cuando sea necesario.**

## 10. Índices y composición

Los índices deben generarse, cuando sea posible, desde metadatos canónicos para evitar listas manuales divergentes.

El repositorio seguirá siendo la fuente de verdad para IDs y relaciones.
