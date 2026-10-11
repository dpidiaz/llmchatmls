# MLS-SND — Unicode smoke test

Estado: **QA fixture v0.1**.

Este archivo contiene cadenas diseñadas para detectar pérdidas de caracteres, diacríticos, normalización o fallback tipográfico.

No todas las secuencias son ejemplos lingüísticos del tomo. Algunas son **fixtures técnicas**.

## 1. ASCII / latín básico

MLS-SND pronunciation / sonidos / phonetics / português / français / Deutsch / italiano

## 2. Latín con diacríticos

á é í ó ú ü ñ ç ã õ â ê ô à è ò ä ö

## 3. Delimitadores IPA

/pa/ [pa] /t͡ʃ/ [t͡ʃ] /d͡ʒ/ [d͡ʒ]

## 4. IPA — vocales y consonantes

i y ɨ ʉ ɯ u ɪ ʏ ʊ e ø ɘ ɵ ɤ o ə ɛ œ ɜ ɞ ʌ ɔ æ ɐ a ɶ ɑ ɒ

p b t d ʈ ɖ c ɟ k ɡ q ɢ ʔ m ɱ n ɳ ɲ ŋ ɴ ʙ r ʀ ⱱ ɾ ɽ ɸ β f v θ ð s z ʃ ʒ ʂ ʐ ç ʝ x ɣ χ ʁ ħ ʕ h ɦ ɬ ɮ ʋ ɹ ɻ j ɰ l ɭ ʎ ʟ

## 5. Diacríticos combinantes

[n̥] [ã] [l̩] [t̪] [d̤] [kʲ] [tʰ] [ɫ] [ɚ]

## 6. Suprasegmentales

ˈa ˌa aː aˑ | ‖

## 7. Letras de tono

˥ ˦ ˧ ˨ ˩  
˩˧˥ ˥˩ ˧˥

## 8. Zhuyin / Bopomofo

ㄅ ㄆ ㄇ ㄈ ㄉ ㄊ ㄋ ㄌ ㄍ ㄎ ㄏ ㄐ ㄑ ㄒ ㄓ ㄔ ㄕ ㄖ ㄗ ㄘ ㄙ ㄧ ㄨ ㄩ ㄚ ㄛ ㄜ ㄝ ㄞ ㄟ ㄠ ㄡ ㄢ ㄣ ㄤ ㄥ ㄦ

ˉ ˊ ˇ ˋ ˙

## 9. Chino tradicional

臺灣華語  
中文  
注音符號

## 10. Hangul

한국어  
한글  
서울

## 11. Hiragana

にほんご  
とうきょう  
きょう

## 12. Katakana

ニホンゴ  
トーキョー  
アクセント

## 13. Kanji

日本語  
東京  
発音  
音声  
アクセント

## 14. Cirílico

русский язык  
произношение  
Москва

## 15. Mezcla de capas

日本語 → にほんご → Nihongo → /…/ → […]

臺灣華語 → ㄊㄞˊ ㄨㄢ → IPA → explicación

한국어 → Romanización → IPA → explicación

русский → transliteración identificada → IPA → explicación

## 16. NFC round-trip

El pipeline debe confirmar:

1. lectura del archivo;
2. normalización NFC;
3. serialización;
4. lectura de nuevo;
5. igualdad canónica;
6. ausencia de sustituciones U+FFFD;
7. ausencia de pérdida de marcas combinantes.

## 17. Render targets

Ejecutar este fixture en:

- Markdown/source view;
- interfaz web;
- PDF de prueba;
- impresión/exportación, si aplica.

## 18. Fallo

Cualquier carácter perdido, reemplazado por tofu o visualmente separado de forma que cambie la interpretación bloquea READY_FOR_COMPOSITION.
