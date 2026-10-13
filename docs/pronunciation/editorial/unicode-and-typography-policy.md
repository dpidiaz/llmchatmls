# MLS-SND — Política Unicode y tipografía

Estado: **norma editorial/técnica v0.1**.

## 1. Principio

Todo texto lingüístico de MLS-SND debe conservarse como **Unicode real**.

No se sustituirán símbolos IPA, diacríticos, Zhuyin, hangul, kana, kanji o cirílico por aproximaciones ASCII cuando exista el carácter o secuencia Unicode apropiados.

## 2. Normalización

Para texto editorial general, MLS-SND utilizará **NFC** como forma canónica de almacenamiento y comparación, salvo que una fuente o proceso especializado exija conservar otra representación.

Unicode recomienda NFC como una forma apropiada para texto general y define la equivalencia canónica entre formas precompuestas y secuencias de caracteres combinantes.

### Regla

- normalizar a NFC al importar o generar texto editorial;
- volver a comprobar normalización después de concatenar fragmentos;
- no asumir que concatenar dos cadenas NFC produce automáticamente otra cadena NFC;
- comparar cadenas teniendo en cuenta equivalencia canónica.

## 3. No usar NFKC como normalización editorial indiscriminada

NFKC/NFKD son normalizaciones de compatibilidad y pueden eliminar distinciones.

Por ello no deben aplicarse globalmente al corpus lingüístico, transcripciones o ejemplos solo para “limpiar texto”.

Su uso, si alguna herramienta lo requiere, debe restringirse a un dominio explícito y probar que no altera información lingüística.

## 4. Caracteres combinantes

Muchas transcripciones requieren diacríticos combinantes.

Ejemplos de smoke test:

- [n̥]
- [ã]
- [l̩]
- [t̪]
- [d̤]

El sistema de composición debe verificar:

- anclaje visual correcto;
- orden canónico de marcas;
- que copiar/pegar preserve la secuencia Unicode;
- que el diacrítico no se separe de su base al cambiar de línea.

## 5. IPA

El soporte tipográfico debe cubrir, como mínimo, los símbolos realmente usados por el tomo en:

- IPA Extensions;
- Phonetic Extensions, si aparecen;
- Spacing Modifier Letters;
- Modifier Tone Letters;
- Combining Diacritical Marks y bloques relacionados.

No se exige cubrir todos los caracteres fonéticos de Unicode si el corpus no los utiliza.

## 6. Scripts del MLS-SND

La composición debe probar explícitamente:

- latino;
- IPA;
- Bopomofo/Zhuyin;
- CJK ideographs;
- hiragana;
- katakana;
- hangul;
- cirílico.

La existencia de esos bloques en Unicode no garantiza por sí sola que una fuente tipográfica concreta los renderice correctamente.

## 7. Selección tipográfica

La política no distribuye archivos de fuentes.

Antes de aprobar una familia tipográfica para publicación, deberá verificarse:

1. licencia;
2. cobertura Unicode necesaria;
3. diseño correcto de IPA y diacríticos;
4. legibilidad en cuerpo pequeño;
5. comportamiento en PDF;
6. comportamiento en navegador;
7. fallback entre scripts;
8. copia y búsqueda de texto.

## 8. Fallback

Una única familia no necesita cubrir todos los scripts.

Puede utilizarse una pila de fuentes siempre que:

- el cambio entre scripts sea visualmente coherente;
- no altere métricas de forma destructiva;
- los signos de puntuación y delimitadores permanezcan consistentes;
- los símbolos IPA no cambien de diseño dentro de una misma transcripción.

## 9. Saltos de línea

No introducir saltos que separen:

- base + diacrítico;
- ligadura/tie bar y segmentos relacionados;
- marca de longitud de su contexto de manera confusa;
- signos de tono de la secuencia que representan.

Las reglas de composición deben probar específicamente transcripciones estrechas largas.

## 10. Datos originales

Cuando una fuente externa use una secuencia Unicode válida distinta pero canónicamente equivalente, el pipeline puede almacenar una forma normalizada para trabajo editorial, pero debe conservar trazabilidad hacia el original cuando la distinción de representación sea relevante.

## 11. Caracteres de compatibilidad

No reemplazar silenciosamente caracteres CJK, kana de compatibilidad, variantes gráficas u otros caracteres por “equivalentes” sin comprobar que la sustitución no cambia:

- la cita;
- el nombre propio;
- el ejemplo;
- la fuente histórica;
- la convención local.

## 12. Control de versiones de Unicode

La versión técnica de referencia debe registrarse en el build/composición.

En octubre de 2026, UAX #15 vigente corresponde a Unicode 18.0.0.

Actualizar de versión no autoriza cambios automáticos del texto lingüístico: primero se ejecuta el smoke test.

## 13. Gate

Antes de READY_FOR_COMPOSITION:

- todo archivo textual debe superar normalización/round-trip;
- todas las cadenas del smoke test deben renderizarse;
- PDF y web deben preservar búsqueda/copia;
- no puede haber tofu/cuadrados por glifo faltante en contenido aprobado;
- no puede perderse ningún diacrítico.
