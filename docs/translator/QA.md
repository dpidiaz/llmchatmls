# MLS Traductor — QA

## Automatizado aprobado

Run T4–T5 técnico:
`35529732780` — SUCCESS

Run T6–T7:
`35535564896` — SUCCESS

Run T8 certificación técnica final:
`35536193278` — SUCCESS

Cobertura:

- shell y ruta;
- 10 slugs;
- contexto `?lang=`;
- sintaxis de scripts inline;
- Normal / Lento;
- cancelación;
- repetición;
- selección de voz;
- degradación de pronunciación ambigua;
- XSS mediante textContent;
- endpoint online;
- validación de idioma;
- same-language shortcut;
- mock real de Workers AI;
- privacidad de logs;
- packs;
- hashes;
- proxy allowlist;
- cache separado;
- estado parcial;
- reintento;
- eliminación;
- local-first;
- memoria por cambio de par;
- predeploy;
- recovery;
- deploy contract;
- Wrangler dry-run.

## Baseline de MLS

El Traductor debe preservar:
- `test:chat-editorial`;
- `qa:baseline`;
- 10,133 entradas;
- 10 idiomas;
- 10,669 chunks semánticos.

## QA manual que no puede sustituirse por CI

- calidad real de voz en Safari/iPhone;
- funcionamiento de voz local en modo avión;
- inteligibilidad pedagógica de rate 0.65;
- teclado virtual/safe areas;
- traducción local real en dispositivo con memoria limitada.

Estos puntos no deben marcarse PASS sin observación real.

## Procedimiento reproducible para Safari/iPhone sin desplegar producción

El gate físico debe ejecutarse contra el mismo HEAD del PR, no contra `main` ni contra producción.

En una computadora con el repositorio:

```bash
git checkout feature/translator-pronunciation-offline
git pull --ff-only
npm ci
npm run predeploy
npm run dev
```

Con `wrangler dev` activo, pulsar `t` para abrir un Cloudflare Quick Tunnel. Wrangler mostrará una URL HTTPS temporal bajo `trycloudflare.com`.

Abrir desde Safari en el iPhone:

```text
https://<quick-tunnel>/traductor
```

La URL temporal permite probar el Worker local desde el dispositivo físico sin promover la versión a producción. Debe mantenerse `wrangler dev` activo durante la preparación online.

### Preparación online

1. Abrir `/traductor` en Safari.
2. Confirmar que la interfaz carga completa.
3. Descargar voluntariamente un solo pack de idioma para la prueba offline.
4. Ejecutar al menos una traducción con ese pack.
5. Ejecutar Normal, Lento, Repetir y Detener.
6. Recargar una vez mientras todavía hay conexión para asegurar que el Service Worker controla la navegación.
7. Confirmar que no hay errores visuales con teclado abierto, orientación vertical y safe areas.

### Gate físico offline

Activar modo avión y verificar, sin volver a habilitar Wi-Fi o datos:

- recarga de `/traductor` desde el App Shell;
- traducción con el pack previamente descargado;
- ausencia de descarga automática de otros packs;
- voz local disponible cuando iOS disponga de una voz compatible;
- Normal reproduce a velocidad natural;
- Lento es perceptiblemente más lento y sigue siendo inteligible;
- Repetir vuelve a reproducir de forma comprensible;
- Detener cancela la reproducción;
- un fallo de voz o pack se comunica sin bloquear la interfaz;
- el teclado virtual no oculta controles esenciales;
- no aparece overflow horizontal;
- no hay cierre de Safari durante varias traducciones consecutivas;
- no hay calentamiento anormal inmediato ni degradación severa de respuesta.

### Restauración de red

Desactivar modo avión y confirmar:

- recuperación sin recargar forzosamente toda la aplicación;
- el pack instalado sigue disponible;
- la traducción local sigue siendo prioritaria cuando el par está cubierto;
- las funciones online vuelven a estar disponibles sin romper el estado local.

### Registro mínimo del gate

No cerrar el gate físico sin registrar:

- modelo de iPhone;
- versión de iOS;
- idioma/voz probada;
- pack probado;
- resultado de App Shell offline;
- resultado de traducción offline;
- resultado Normal/Lento/Repetir/Detener;
- teclado/safe areas;
- memoria/temperatura percibida;
- PASS/FAIL y observaciones.

Un FAIL debe indicar el paso exacto, el texto mostrado y si es reproducible.

## Chromium final

Run `35536193278`:

- viewports: `320 / 375 / 390 / 430 / 768 / 1024 / 1280 / 1440 / 1920`;
- idioma contextual `?lang=portugues`: PASS;
- overflow horizontal: PASS;
- targets interactivos móviles: PASS;
- skip link como primer foco: PASS;
- modo Pronunciar y resultado dinámico: PASS;
- reflow equivalente 200%: PASS;
- reflow equivalente 400%: PASS;
- recarga de `/traductor` sin red mediante App Shell: PASS.

Resultado del harness:

`TRANSLATOR_CHROMIUM_QA {"issues":[]}`

## Pack policy certificada

- runtime Bergamot: **5.06 MiB**;
- total de nueve packs descargables: **508.14 MiB comprimidos**;
- pack individual máximo: **71.78 MiB**;
- direcciones del registry: **18**;
- descarga: opt-in por idioma;
- descarga automática de todos los idiomas: no.

## Frontera de certificación

T8 certifica el comportamiento web y offline del App Shell en Chromium.

No sustituye la validación física de Safari/iPhone para:
- disponibilidad real de voz local en modo avión;
- inteligibilidad del modo Lento con voces reales de iOS;
- memoria/temperatura/batería durante traducción Bergamot prolongada;
- teclado virtual y safe areas en dispositivo físico.
