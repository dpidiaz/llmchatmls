# MLS Traductor — Audio

## Motor

El audio usa Web Speech del navegador/dispositivo.

APIs:
- `speechSynthesis`
- `SpeechSynthesisUtterance`

No existe proveedor TTS de pago ni audio generado en servidor.

## Selección de voz

Orden conceptual:
1. locale exacto local;
2. idioma compatible local;
3. voz default compatible;
4. locale exacto compatible;
5. primera voz compatible.

El código no depende del nombre comercial de una voz.

## Offline

`voice.localService === true` se usa como señal útil, pero **no como prueba definitiva** de funcionamiento en modo avión.

La UI diferencia:
- voz local compatible;
- voz compatible que puede requerir conexión;
- ninguna voz compatible.

## Controles

- Escuchar
- Escuchar lento
- Repetir
- Detener

Todos tienen texto accesible y targets táctiles de al menos 44 px.

## Lifecycle

Se cancela audio:
- antes de una nueva reproducción;
- al detener;
- al abandonar la página.

## QA manual requerido

Antes del cierre definitivo:
- Safari iPhone;
- PWA;
- voz local por idioma disponible;
- modo avión;
- Normal ↔ Lento;
- repetición rápida;
- lock/unlock.
