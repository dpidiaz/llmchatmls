# MLS Traductor + Pronunciación — Arquitectura

## Estado

Implementación R1 en la rama `feature/translator-pronunciation-offline`.

El módulo es una herramienta independiente de Virtuoso, Reader y Profesor IA.

## Ruta y navegación

- Ruta pública: `/traductor`
- Navegación: `Herramientas → Traductor`
- Contexto opcional: `/traductor?lang=<slug-canónico>`

Los slugs válidos son los mismos 10 idiomas de MLS.

## Flujo de traducción

La política es **local-first**:

1. comprobar si los paquetes necesarios están preparados y verificados;
2. si están listos, traducir en el dispositivo mediante Bergamot/WASM;
3. si la traducción local no está disponible y existe conexión, usar `/api/translate`;
4. el endpoint online usa únicamente el binding existente de Cloudflare Workers AI;
5. si IA no está disponible, Pronunciar y el audio local continúan independientes.

La traducción local entre dos idiomas no ingleses usa inglés como pivote.

## Flujo de pronunciación

La pronunciación se mantiene independiente de traducción:

- guía escrita determinista cuando existe una regla segura;
- síntesis mediante Web Speech disponible en el dispositivo;
- selección de voz por locale con preferencia `localService`;
- Normal: `rate = 1.0`;
- Lento: `rate = 0.65`;
- Repetir conserva texto, voz, idioma y velocidad;
- antes de cada reproducción se cancela la cola anterior.

MLS no afirma que una voz funciona offline únicamente porque `speechSynthesis` exista.

## Almacenamiento

Se mantienen tres dominios separados:

- App Shell;
- Offline Library;
- Language Tools / Translation Packs.

El cache de Language Tools es:

`mls-language-tools-r1`

Las actualizaciones del App Shell no deben borrar paquetes lingüísticos válidos.

## Worker

El Worker añade:

- `/traductor`
- `/api/translate`
- proxy same-origin `/translation-models/*`

El proxy de modelos usa una allowlist generada desde `packs.json`; no es un proxy arbitrario.

## Privacidad

Traducción local:
- el texto se procesa en el dispositivo;
- no se envía a Workers AI.

Traducción online:
- el texto se envía únicamente al endpoint MLS y al binding Workers AI necesario para esa solicitud;
- el código no registra el texto del usuario;
- las respuestas usan `cache-control: no-store`.

## Fuente canónica

Este módulo no modifica `content/` ni incorpora traducciones del usuario al corpus.
