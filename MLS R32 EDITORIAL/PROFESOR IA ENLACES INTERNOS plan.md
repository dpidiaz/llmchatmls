# Profesor IA Enlaces Internos

Versión: `professorInternalLinksVersion = 1.0`

## Objetivo

Convertir menciones inequívocas de conceptos ya existentes en MLS en enlaces internos útiles sin inventar entradas ni usar coincidencia difusa.

## Contrato

- Solo se buscan entradas de la misma enciclopedia y el mismo idioma de la entrada activa.
- La entrada actual se excluye.
- Prioridad: título exacto, luego `target` como alias controlado; el mismo capítulo funciona solo como desempate.
- No se usa fuzzy matching ni búsqueda semántica para crear enlaces.
- Máximo de cinco enlaces por respuesta.
- Los enlaces se insertan únicamente después de completar la respuesta; el streaming sigue siendo texto plano.
- El historial conversacional vuelve a renderizar los mismos enlaces de forma determinista.
- El contenido se construye con nodos de texto y elementos `a`, sin inyectar HTML generado por el modelo.
- Escrituras CJK breves pueden enlazarse aunque tengan menos de cuatro caracteres; formas latinas triviales quedan fuera.

## Seguridad editorial

No modifica artículos, índices, R32, FIFO, AUTOOPT, D1, materialización, Atlas ni voz. Los destinos proceden exclusivamente del índice canónico `MLS.data.byLanguage`.
