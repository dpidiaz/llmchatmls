# MLS-SND — Checklist de QA de composición

## Unicode

- [ ] Archivos en UTF-8.
- [ ] Texto editorial normalizado a NFC.
- [ ] No hay U+FFFD (replacement character).
- [ ] No hay escapes ASCII usados en lugar de símbolos lingüísticos visibles.
- [ ] Round-trip conserva texto.

## IPA

- [ ] / / y [ ] visualmente distinguibles.
- [ ] Diacríticos anclados a su base.
- [ ] Tie bars no se separan de los segmentos.
- [ ] ˈ y ˌ tienen posición legible.
- [ ] ː no se confunde con dos puntos.
- [ ] Letras de tono renderizan correctamente.

## Zhuyin

- [ ] Símbolos Bopomofo renderizan.
- [ ] Marcas tonales renderizan.
- [ ] No se romaniza automáticamente.
- [ ] Copiar/pegar conserva caracteres.

## CJK / japonés

- [ ] Kanji/tradicionales no aparecen como tofu.
- [ ] Hiragana y katakana mantienen tamaño/alineación.
- [ ] Caracteres japoneses y chinos no se sustituyen silenciosamente por formas de compatibilidad.

## Coreano

- [ ] Hangul syllables renderizan.
- [ ] Jamo, si aparecen, renderizan.
- [ ] No se descompone visualmente una sílaba por fallo de fallback.

## Ruso

- [ ] Cirílico completo.
- [ ] Letras visualmente ambiguas con latín no se sustituyen entre scripts.
- [ ] Búsqueda distingue el texto real.

## Pronunciation Quick Layer

- [ ] El estado de la capa es PRESENT / NOT_APPLICABLE / OMITTED_WITH_REASON.
- [ ] Si está PRESENT, declara reader locale.
- [ ] La forma original se conserva sin sustitución.
- [ ] La pronunciación fácil está etiquetada como aproximada.
- [ ] No usa / / ni [ ] como si fuera IPA.
- [ ] No sustituye IPA, escritura local, romanización ni explicación formal.
- [ ] No introduce sonidos, acentos, contrastes o alófonos no aprobados.
- [ ] Conserva variedad/contexto cuando son materiales.
- [ ] La glosa identifica la forma y no inventa equivalencias.
- [ ] Existe acceso al detalle profundo cuando la vista básica simplifica información.
- [ ] Una caja vacía no se renderiza para NOT_APPLICABLE / OMITTED_WITH_REASON.

## PDF

- [ ] Texto seleccionable.
- [ ] Búsqueda encuentra términos.
- [ ] Copia preserva Unicode.
- [ ] No rasterizar texto lingüístico salvo necesidad excepcional documentada.
- [ ] Fuentes incrustadas solo cuando licencia y pipeline lo permitan.

## Web

- [ ] Fallback estable.
- [ ] Zoom 200% no rompe diacríticos.
- [ ] Reflow no separa secuencias sensibles.
- [ ] Dark/light mode no reduce legibilidad de símbolos finos.

## Accesibilidad

- [ ] El símbolo no es la única pista semántica cuando una etiqueta textual puede ayudar.
- [ ] Tablas tienen encabezados comprensibles.
- [ ] No se usa color como único indicador.
- [ ] Copiar una transcripción produce texto, no una imagen.

## Gate

Un fallo que pueda cambiar la lectura lingüística es **BLOCKING**.
