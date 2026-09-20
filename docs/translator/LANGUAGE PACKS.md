# MLS Traductor — Language Packs

## Manifest

Fuente canónica del módulo:

`MLS R32 OVERLAY/translator/packs.json`

Registry adaptado:

`MLS R32 OVERLAY/translator/registry.json`

Pack version actual:

`mozilla-20260920T004248Z-e17d89b3d076`

## Runtime

Aproximadamente **5.06 MiB**.

Archivos:
- translator.js
- translator-worker.js
- bergamot-translator-worker.js
- bergamot-translator-worker.wasm

## Descarga

Los modelos no se guardan dentro del repositorio.

El manifest guarda rutas, tamaños y hashes. En ejecución se descargan por un proxy same-origin estrictamente limitado a rutas presentes en el manifest.

## Integridad

Cada archivo registra hash comprimido y descomprimido.

Un pack solamente puede quedar ready después de verificar todos sus recursos.

## Política de almacenamiento

- descarga explícita por usuario;
- no existe Guardar todos automático;
- Inglés no descarga pack de modelos porque funciona como pivote/runtime;
- App Shell y Offline Library no deben eliminar Language Tools durante upgrades.

## Actualización

Un cambio de `packVersion` debe tratarse como actualización del pack.

La UI debe informar al usuario y evitar declarar ready un estado perteneciente a otra versión.
