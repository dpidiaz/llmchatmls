# Profesor IA · Acciones rápidas · Fase 1

## Objetivo

Añadir acciones contextuales reutilizables al Profesor IA sin convertir MASTER LANGUAGE SYSTEM en curso, sin mutar artículos publicados y sin mezclar reglas entre enciclopedias.

## Arquitectura

La capa nueva se sitúa por encima de los perfiles lingüísticos y preferencias ya existentes:

Profesor IA Core + Perfil lingüístico + Preferencias + Entrada + Acción rápida → Respuesta.

`professorQuickActionsVersion = 1.0`

## Núcleo común

Las diez enciclopedias comparten acciones generales de simplificación, profundización, ejemplos, uso, comparación, diferencias, errores comunes, resumen, reformulación y pronunciación.

## Especialización por idioma

Cada idioma agrega acciones propias sin duplicar el núcleo común:

- Español de Guatemala: voseo, registro, uso guatemalteco.
- Inglés: contraste US/UK, pronunciación, registro.
- Portugués brasileño: uso en Brasil, oralidad, pronunciación brasileña.
- Italiano: uso hablado, clíticos, pronunciación.
- Francés: liaison, pronunciación, francés hablado.
- Alemán: caso, orden verbal, pronunciación.
- Japonés: lectura, pronunciación, cortesía, conversación.
- Chino mandarín de Taiwán: tonos, zhuyin, pinyin, uso en Taiwán.
- Coreano: batchim, nivel de habla, honoríficos.
- Ruso: acento, caso, aspecto verbal.

## Aislamiento

Las acciones específicas se resuelven por `languageSlug`. Una acción específica de una enciclopedia no aparece en otra. Si el idioma no se reconoce, se ofrece únicamente el núcleo común y no se inventa una variante regional.

## UI

Se añade `⚡ Acciones` junto a Profesor IA. Abre un diálogo ligero, mobile first, con texto oscuro sobre fondo claro y controles de tamaño legible. La comparación solicita el concepto objetivo antes de enviar la instrucción.

## Persistencia y coste

No se añade persistencia nueva, D1, proveedor externo ni servicio pago. Las acciones solo enriquecen temporalmente una copia del contexto enviado a Profesor IA. `strictZeroCost` y `cloudflareOnly` permanecen intactos.

## No mutación

La entrada original no se modifica. El artículo publicado no se reescribe, no se materializa y no se publica desde esta capa.

## Integración

El helper persistente vive en `MLS R32 OVERLAY`. Un instalador de predeploy lo agrega al módulo generado del Profesor IA y añade el acceso en el lector. El Service Worker cambia de versión para evitar servir JS anterior.

## Criterios de cierre

- diez perfiles cubiertos;
- aislamiento comprobado;
- sistemas de escritura preservados;
- artículo original no mutado;
- R32 intacto;
- AUTOOPT, FIFO, materialización, Atlas y voz intactos;
- tests específicos pasan;
- predeploy pasa;
- deploy contract pasa;
- Wrangler dry run pasa;
- PR mergeable antes de merge.
