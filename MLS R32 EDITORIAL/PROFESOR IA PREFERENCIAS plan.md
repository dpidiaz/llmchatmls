# Profesor IA — preferencias de explicación

## Objetivo

Añadir preferencias de presentación al Profesor IA sin alterar el perfil lingüístico canónico de cada enciclopedia ni convertir MLS en un curso.

## Preferencias

- Idioma de explicación: español o idioma objetivo.
- Profundidad: simple, normal o técnica.

Valores por defecto:

- español;
- normal.

## Principios

1. Las preferencias solo afectan cómo se explica.
2. El perfil lingüístico por idioma sigue siendo autoridad para variante, escritura y convenciones.
3. El artículo publicado nunca se modifica; Profesor IA recibe una copia enriquecida.
4. Las preferencias se guardan únicamente en `localStorage` del navegador del usuario.
5. No se introducen cuentas, servidor, D1, AUTOOPT, FIFO, materialización, publicación ni generación adicional.
6. El sistema sigue siendo enciclopedia: no añade exámenes, ejercicios, progreso ni rutas obligatorias.
7. Si `localStorage` falla o no existe, se usan valores por defecto seguros.

## Interfaz

Cada entrada muestra un botón `⚙ Profesor` junto a `✨ Profesor IA`.

El diálogo usa texto oscuro sobre fondo claro y permite guardar, restablecer o cerrar. En móvil se adapta al ancho disponible.

## Integración

`MLSProfessorPreferences` envuelve `MLS.aiTutor.open` después de `MLSProfessorProfiles`. De esta forma, preferencias y perfil lingüístico permanecen capas distintas y composables.

La versión inicial es `professorPreferencesVersion = 1.0`.
