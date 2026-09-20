# MLS Traductor — Traducción

## Motor local

- Engine: Bergamot
- Package: `@browsermt/bergamot-translator`
- Version: `0.4.9`
- License declarada en manifest: `MPL-2.0`
- Runtime: WebAssembly
- Registro fuente: Mozilla translations model registry

El runtime Bergamot incluido ocupa aproximadamente **5.06 MiB**.

## Arquitectura de pares

Inglés es pivote.

Existen 18 direcciones directas:
- nueve idiomas → inglés;
- inglés → nueve idiomas.

Una traducción entre dos idiomas no ingleses se compone a través de inglés.

Esto reduce la matriz desde 90 pares dedicados, a cambio de una posible pérdida de calidad en traducciones pivotadas.

## Tamaños comprimidos aproximados

| Idioma | Pack |
| --- | ---: |
| Español | 49.22 MiB |
| Inglés | runtime only |
| Portugués | 49.08 MiB |
| Italiano | 50.31 MiB |
| Francés | 49.58 MiB |
| Alemán | 48.79 MiB |
| Japonés | 70.93 MiB |
| Chino Taiwán | 71.56 MiB |
| Coreano | 71.78 MiB |
| Ruso | 46.90 MiB |

Los nueve packs no ingleses suman aproximadamente **508 MiB comprimidos**, por lo que descargar todo automáticamente está prohibido.

## Traducción online

Fallback/mejora:
- Cloudflare Workers AI;
- modelo MLS existente: `@cf/google/gemma-4-26b-a4b-it`;
- sin proveedor de pago;
- `temperature: 0.05`;
- thinking desactivado;
- salida JSON estructurada.

La traducción online se usa solamente cuando el motor local no puede resolver la solicitud y existe conexión.

## Límites

- entrada pública: máximo 1200 caracteres;
- orientado a palabras, frases y párrafos cortos;
- documentos completos están fuera del alcance R1.

## Seguridad

- idioma origen/destino validado contra los 10 slugs;
- método POST;
- content-type JSON;
- respuestas no cacheables;
- texto de salida insertado mediante `textContent`.
