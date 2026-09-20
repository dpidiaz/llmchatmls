# MLS Traductor — Offline

## Contrato

El Traductor debe seguir siendo útil sin Internet.

Actualmente se implementan offline:

- apertura de `/traductor` desde App Shell;
- pronunciación escrita determinista disponible;
- audio cuando el dispositivo tiene una voz local realmente utilizable;
- traducción local cuando los packs requeridos ya fueron descargados y verificados.

## No se promete automáticamente

No se declara audio offline solo por detectar Web Speech.

La certificación final de audio offline requiere una prueba real en modo avión sobre Safari/iPhone.

## Packs

Los packs son opt-in. MLS nunca descarga automáticamente los 10 idiomas.

Estado posible:

- empty;
- downloading;
- partial;
- ready.

Cache Storage es fuente de verdad. Un flag local no convierte un paquete incompleto en ready.

## Integridad

Cada asset lleva:

- tamaño comprimido;
- SHA-256 comprimido;
- tamaño descomprimido;
- SHA-256 descomprimido.

El runtime verifica integridad antes de marcar un pack como disponible.

## Descarga y recuperación

Una descarga interrumpida queda parcial y puede reintentarse.

El usuario puede eliminar un paquete y liberar almacenamiento.

Cuando está disponible, `navigator.storage.estimate()` se usa para informar espacio aproximado.

## Memoria móvil

Solo se mantiene un traductor activo por par. Al cambiar de par, el anterior se elimina para reducir presión de memoria.

## Prueba manual pendiente antes de Definition of Done

Safari/iPhone real:

1. descargar un pack;
2. cerrar y reabrir;
3. activar modo avión;
4. abrir Traductor;
5. traducir;
6. reproducir Normal;
7. reproducir Lento;
8. Repetir;
9. reconectar.
