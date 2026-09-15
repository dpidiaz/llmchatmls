# MLS AUTOOPT: importación histórica segura

Esta herramienta incorpora evidencia anterior a MLS AUTOOPT 1.0 sin
convertirla en eventos de validación nuevos. Está pensada para una base donde
quedan pocas entradas: permite aprovechar publicaciones y problemas
conservados sin inventar el historial que ya no existe.

## Qué puede aprender

Una publicación es elegible sólo si, antes de la fecha de corte:

* pertenece a un run cerrado (`complete` o `cancelled`);
* se puede unir por código y `audit_model` a un borrador; el Markdown del
  artículo y del borrador es idéntico;
* su contexto, target, versión 32.0, idioma, nivel, profile y referencias son
  completos y compatibles;
* la publicación quedó dentro de los límites que aplicaría hoy al contexto;
* no hay ya un evento AUTOOPT vivo para ese `contextId` y ningún lote histórico
  previo la reclamó.

De ella se conservan familia, firma de profile, fecha, conteo de palabras,
secciones, referencias y rasgos estructurales. No se conserva el texto.
Marca `verified-publication-not-linguistic-certification`: acredita la unión
operativa, no la exactitud lingüística, R32 ni primer intento.

Una incidencia elegible conserva familia, fecha y categorías del primer y
último error preservados. `editorial_attempts` se guarda sólo como dato
descriptivo; puede incluir reintentos y nunca se suma para calcular intentos,
tasas first-pass o rechazos únicos. El patrón `actividad o curso` produce una
recomendación prudente de tono enciclopédico y ejercicios ausentes, no la
afirmación de que R32 se equivocó.

Los niveles MLS como `G1` y niveles CEFR se conservan tal como están en el
target. La familia usa la misma heurística determinista de AUTOOPT; si es
ambigua, es `unknown`. El importador no usa Workers AI ni ningún proveedor.

## Ciclo administrativo

La herramienta exige un destino explícito. Ejecutarla no cambia la base hasta
`apply`, y `apply` deja el lote en `staged`; sólo `activate` permite que el
Worker lo consulte. Use una fecha UTC anterior a la primera observación AUTOOPT
viva conservada y anote de dónde se verificó esa fecha. Si la base no conserva
esa primera observación, el operador debe elegir un corte conservador. Nunca
use una fecha posterior para rellenar una zona que ya pudo ser observada.

```sh
# 1. Simulación de sólo lectura y manifiesto inmutable.
node 'scripts/autoopt history.cjs' preview \
  --database WIKI_DB --remote \
  --before 2026-09-13T00:00:00.000Z \
  --batch historial-20260913-01 \
  --out 'AUTOOPT historial 20260913.json'

# 2. Revise: elegibles, exclusiones, grupos familia/profile y comparación
#    live-only frente a la propuesta. El digest aparece en el manifiesto.

# 3. Inserción idempotente, todavía invisible para recomendaciones.
node 'scripts/autoopt history.cjs' apply \
  --plan 'AUTOOPT historial 20260913.json' \
  --approve DIGEST_DEL_MANIFIESTO

# 4. Inspeccione y active sólo el lote completo.
node 'scripts/autoopt history.cjs' inspect --database WIKI_DB --remote
node 'scripts/autoopt history.cjs' activate \
  --database WIKI_DB --remote --batch historial-20260913-01
```

Después de activar el lote, habilite la lectura histórica con
`AUTOOPT_HISTORY_ENABLED=true` en la configuración que se despliega. Mantener
la bandera en `false` conserva el lote y no altera `siguienteContextoMLS`.
Para retirar sólo esa contribución:

```sh
node 'scripts/autoopt history.cjs' rollback \
  --database WIKI_DB --remote --batch historial-20260913-01
```

El rollback deja las filas como tombstones para impedir una reimportación
silenciosa. Una reactivación consciente se hace con `activate`. Hay un máximo
de ocho lotes activos y cada lote es pequeño, de 25 filas por escritura. Si
una ejecución se interrumpe, volver a ejecutar `apply` con el mismo manifiesto
y digest la reanuda. Si las fuentes cambiaron, el digest no coincide y debe
generarse y revisarse una simulación nueva.

## Lectura que recibe ChatGPT

Con `AUTOOPT_HISTORY_ENABLED=true`, `siguienteContextoMLS` añade al mismo
objeto `autoopt` el campo opcional `historicalEvidence`:

```json
{
  "historicalEvidence": {
    "version": "1.0",
    "publications": 3,
    "incidents": 1,
    "weight": 0.15,
    "firstPassSuccessRate": null,
    "attemptsPerPublication": null,
    "meanPublishedWords": 680,
    "activityLikeIncidents": 1,
    "lengthIncidents": 0,
    "linguisticCorrectness": "not-certified"
  }
}
```

No se devuelven observaciones individuales. La longitud histórica puede ajustar
el `target`, siempre dentro de los límites actuales y con una influencia de
hasta 20 %. El mínimo vigente, las tasas live, la decisión del validador y la
regla de publicación no cambian. Al sumar publicaciones nuevas, el peso de la
historia baja; no se vuelve una plantilla obligatoria.

## Esquema y auditoría

`wiki_autoopt_history_batches` almacena `id`, digest, corte, tamaño esperado,
estado y fecha. `wiki_autoopt_history_items` almacena una huella SHA-256 de la
fila fuente y metadata compacta. `wiki_autoopt_history_stats` contiene los
agregados por lote, versión, prompt, familia y firma de profile. Un trigger
actualiza los agregados al insertar cada item. Las tablas son aditivas y no
tocan las seis tablas editoriales ni las tablas de aprendizaje vivo.

Puede ver el DDL sin conectarse a D1:

```sh
node 'scripts/autoopt history.cjs' schema
```

El mismo DDL idempotente queda versionado en `AUTOOPT historial schema.sql`.
`apply` lo crea antes de insertar el lote, de modo que no es obligatorio
aplicarlo a mano; el archivo permite una revisión o una migración administrada
previa.

Para producción, use el acceso D1 administrativo ya autorizado. No coloque
tokens, account IDs ni Secrets dentro de manifiestos, scripts o consultas. La
herramienta limita cada exploración a 25 000 fuentes y falla antes de generar
un plan parcial. El manifiesto se crea con modo exclusivo: no sobrescribe una
simulación anterior.

## Métricas interpretables

El informe de `preview` muestra publicaciones e incidencias elegibles,
exclusiones por motivo y grupos `familia / profile`. También compara el
consejo live actual con el consejo que produciría sólo ese lote. Los campos
`firstPassRate` y `attemptsPerPublication` se muestran como `null`: con las
tablas históricas disponibles no son medibles de forma fiable.

Tras activar, inspeccione los lotes con `inspect` y el comportamiento con un
`siguienteContextoMLS` autenticado de prueba. Debe aparecer
`historicalEvidence` sólo para el prompt, familia y profile coincidentes.
La mejora de throughput se mide mediante los eventos AUTOOPT live que se
acumulen después; no se atribuye retrospectivamente al historial.
