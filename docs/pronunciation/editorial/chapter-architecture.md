# MLS-SND — Arquitectura de capítulos v0.1

Estado: **propuesta editorial operativa**.

Los números de capítulo son propios de una edición. Los IDs `SND-*` son persistentes y no dependen de esta numeración.

## Parte I — Orientarse en los sonidos

1. El sonido como parte del idioma
2. Hablar, escuchar y representar
3. Sonido, letra, fonema y transcripción
4. Cómo utilizar este tomo
5. Lenguas, variedades, acentos y registros

## Parte II — Cómo se producen y organizan los sonidos

6. Fonética y fonología
7. El tracto vocal y la articulación
8. Consonantes
9. Vocales
10. La sílaba
11. Fonotáctica
12. Duración y cantidad
13. Acento y prominencia
14. Ritmo
15. Tono
16. Acento tonal
17. Entonación
18. Procesos del habla conectada
19. Variación fonética y fonológica

## Parte III — Cómo representamos la pronunciación

20. Introducción funcional al AFI/IPA
21. Transcripción fonológica y fonética
22. Transcripción amplia y estrecha
23. Ortografía y pronunciación
24. Romanización y transliteración
25. Sistemas locales de anotación y consulta

## Parte IV — Perfiles MLS

26. 🇬🇹 Español de Guatemala
27. 🇺🇸 Inglés estadounidense
28. 🇧🇷 Portugués brasileño — referencia carioca
29. 🇮🇹 Italiano
30. 🇫🇷 Francés
31. 🇩🇪 Alemán
32. 🇹🇼 Mandarín de Taiwán
33. 🇰🇷 Coreano
34. 🇯🇵 Japonés
35. 🇷🇺 Ruso

## Parte V — Comparar sin confundir

36. Cómo comparar sonidos entre lenguas
37. Sistemas vocálicos en perspectiva
38. Sistemas consonánticos en perspectiva
39. Sílaba y fonotáctica
40. Duración y cantidad
41. Acento y prominencia
42. Tono y acento tonal
43. Ritmo
44. Entonación
45. Escritura y pronunciación
46. Qué significa hablar con acento

## Parte VI — Consulta

47. Glosario
48. Índice IPA
49. Índice por fenómeno
50. Índice por idioma
51. Sistemas de romanización y transliteración
52. Bibliografía general
53. Bibliografías por idioma

## Regla de congelación

Esta arquitectura no debe considerarse `FROZEN` hasta que:

1. el piloto de fundamentos esté revisado;
2. es-GT, en-US y pt-BR-rio hayan demostrado que la plantilla funciona;
3. al menos una lengua con tono/acento tonal haya sido prototipada;
4. al menos una lengua con escritura no latina haya sido prototipada;
5. el inventario confirme que los perfiles no requieren una estructura radicalmente distinta.

## Regla anti-simetría

Los capítulos 26–35 no tendrán obligatoriamente:

- el mismo número de entradas;
- la misma extensión;
- idénticas subsecciones.

Compartirán una navegación comparable, pero cada idioma recibirá la profundidad que exijan su sistema y sus fuentes.

## Relación con entradas

Los capítulos contienen IDs canónicos; no crean IDs.

Ejemplo:

`Capítulo 32 → SND-ZHTW-001 … SND-ZHTW-010`

Si el capítulo cambia de número en una futura edición, los IDs y la evidencia permanecen estables.
