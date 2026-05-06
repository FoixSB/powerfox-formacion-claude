# Caso de estudio (continuación): mantenimiento en producción de un módulo Canvas App + Dataverse asistido por IA

> **Propósito.** Continuación del caso de estudio inicial sobre el desarrollo de un módulo Canvas App con Claude Code. Mientras que el primer documento cubre el *go-live* (diseño, backend Dataverse, generación de YAML, deploy), este se centra en la **fase de mantenimiento real**: ~3 semanas en producción, dos sesiones efectivas de fix (un refactor funcional + cuatro bugfixes en una sola tarde de triage con cliente). Material para la sesión de formación práctica sobre Power Apps + IA, anonimizado para uso en otros clientes. Fuentes: commits de Git, plan ejecutable, handoffs y memorias del proyecto.
>
> **Convención.** A lo largo del documento se usa **"el módulo"** para referirse al subsistema funcional (digitalización de un proceso industrial maestro-detalle dentro de una Canvas App existente), **"el cliente"** para el sponsor de negocio y **"el operador"** para el usuario final.

**Stack:** Power Apps Canvas (`@0.0.X` modern controls) · Dataverse · PAC CLI · Git · Claude Code (Opus) · `python + azure-identity` para administración masiva de Dataverse vía Web API.
**Idioma del entregable:** español.
**Periodo cubierto:** 3 semanas tras go-live, 2 sesiones efectivas de mantenimiento (refactor + bugfixes).

---

## 0. Posición de este documento dentro de la formación

| Documento | Cubre | Audiencia |
|---|---|---|
| Caso de estudio nº 1 (go-live) | Diseño de tablas, generación de YAML por chunks, errores típicos de pegado, ROI del MVP | Devs evaluando si adoptar IA para Power Apps |
| **Caso de estudio nº 2 (este)** | **Vida del módulo después del deploy: cómo se manifiestan los bugs en producción, cómo se fixean con IA + cliente en la misma llamada, qué memorias reusables salieron** | **Devs que ya han hecho un MVP con IA y necesitan operarlo** |

**La tesis del documento.** Donde la IA brilla en mantenimiento no es replicando el rendimiento del go-live (cuando hay un *spec* nuevo a digerir), sino en **comprimir el ciclo "el cliente reporta → el dev reproduce → el dev fixea → el dev publica"** de horas/días a minutos. La condición para que ese ciclo funcione es haber dejado el go-live **bien instrumentado**: handoffs con fecha, memorias del proyecto con las reglas Power Fx descubiertas, plan ejecutable como contrato. Sin ese andamiaje, el LLM en mantenimiento es ruido, no señal.

---

## 1. Resumen ejecutivo

Tras el deploy del módulo a producción, el cliente reportó dos tandas de incidencias separadas en el tiempo:

1. **2026-04-27 — Refactor funcional**: la búsqueda de "lote agrupado" creaba registros con datos parciales (cogía solo la primera fila de N filas con el mismo número de lote). Se reescribió la lógica de búsqueda con un patrón `Filter + Sum`, se añadió una columna *fingerprint* (`fechacierre…`) para trazabilidad, y se desplegó tras un *smoke test* con un caso real (lote `LOTE-XXXXX` con 18 filas). **1 sesión efectiva.**
2. **2026-04-29 — Triage de 4 bugs en producción** (sesión en vivo con el cliente): (1) lookups de Empresa/Usuario guardando `null` por capitalización en `DataField`; (2) error "campo X obligatorio" al usar la búsqueda agregada porque las columnas seguían marcadas Required en Dataverse; (3) galería mostrando "registros fantasma" al crear un registro nuevo porque la variable de estado no se reseteaba; (4) limpieza de ~64 registros huérfanos heredados de pruebas anteriores. **1 sesión efectiva, 4 fixes desplegados, validación end-to-end con el cliente al cierre.**

### Cifras clave de la fase de mantenimiento

| Métrica | Valor | Fuente |
|---|---|---|
| Sesiones efectivas de mantenimiento | 2 | `git log` |
| Bugs/refactors arreglados | 5 (1 refactor + 4 bugs) | Handoffs |
| Commits del periodo | 2 (`5bf716a`, `69c34cc`) | `git log --oneline` |
| LOC de plan ejecutable | 544 | `docs/plans/…-paquete-aggregation.md` |
| LOC de handoffs nuevos | ~300 | 3 handoffs |
| Cambios de schema en Dataverse | 1 columna nueva + 3 columnas con `RequiredLevel` cambiado | `Entity.xml` diff |
| Cambios manuales en PA Studio (sin re-export del `.msapp`) | 5 (DataField × 2, OnSelect del botón "Nuevo", Patch de búsqueda, OnSelect de búsqueda) | Memoria del proyecto |
| Memorias/lecciones promovidas a la base de conocimiento del equipo | 3 (Lookup DataField lowercase, Typed Blank pattern, Required-vs-Patch alineación) | Knowledge base interna |
| % de YAML del go-live aún válido tras 3 semanas | ~95–97 % | Estimación a partir de los chunks que NO se tocaron |

**Tiempo total invertido en mantenimiento de las 3 semanas: ~6–9 h efectivas con IA** (estimación). Sin IA, el equipo lo cifra en ~14–22 h. **Ahorro estimado: 50–60 %** — ligeramente inferior al 60–70 % del go-live, lo que es esperable: en mantenimiento el cuello de botella se desplaza de "generar código" a "razonar sobre estado vivo en producción", donde la IA ayuda menos.

---

## 2. Inventario de los cambios reales (qué tocamos)

### 2.1 Cambios de schema en Dataverse

| Tabla | Cambio | Razón |
|---|---|---|
| `<prefijo>_LineaProceso` (tabla hija del proceso maestro) | **Nueva columna** `<prefijo>_fechacierrelote` (DateTime, User Local, Optional) | *Fingerprint* para trazabilidad — combinado con el campo `Nº Lote Ref` ya existente identifica unívocamente las filas origen del agregado |
| `<prefijo>_LineaProceso` | 3 columnas (`<prefijo>_ancho`, `<prefijo>_largo`, `<prefijo>_grueso`): `RequiredLevel: required → none` | El nuevo Patch de "búsqueda agregada" intencionadamente NO envía dimensiones (decisión de cliente: agregar N filas hace meaningless una sola dimensión). Mantenerlas Required generaba el error #2 del 2026-04-29 |

Ningún cambio en las tablas maestras o de catálogo. El cambio de `RequiredLevel` requirió **re-export** de la solución para capturar el ajuste en el repo (commit `69c34cc`); el campo nuevo se añadió en el commit `5bf716a`.

### 2.2 Cambios en la Canvas App

Todos los cambios fueron **directamente en PA Studio (web)**, sin re-export del `.msapp`. Esta es una regla del proyecto, formalizada como memoria reutilizable (`feedback_canvas_app_no_reexport.md`): el `.msapp` binario en producción es la fuente de verdad para esta app concreta, y `pac canvas pack/unpack` se reserva para apps donde el flujo "YAML → pack → import" es el canal canónico. La consecuencia operativa importante es que **los fixes de PA Studio no aparecen en Git**: solo aparecen los chunks YAML que servimos como *contrato de cambio*.

| Pantalla / Control | Tipo de cambio | Líneas tocadas en el chunk YAML | Líneas reescritas a mano en PA Studio |
|---|---|---|---|
| `…Form_Screen` → `btn_Buscar.OnSelect` | Refactor (LookUp → Filter+Sum) | ~55 (todo el bloque) | 0 — el chunk se pegó tal cual tras Find&Replace |
| `…Form_Screen` → `lbl_FoundInfo.Text` | Update del texto del banner | ~3 | 0 |
| `…Form_Screen` → `btn_AgregarLote.OnSelect` | Patch reescrito (agregados, lookups null) | ~25 | 0 |
| `Empresa_DataCard.DataField` | Lowercase del schema name (`xxx_EmpresaLookup` → `xxx_empresalookup`) | N/A — solo en PA Studio | 1 |
| `Usuario_DataCard.DataField` | Lowercase del schema name | N/A | 1 |
| `…Lista_Screen` → `btn_NuevoRegistro.OnSelect` | Reset de variable de estado | N/A | 1 línea añadida |

**Distribución del esfuerzo durante mantenimiento:**

```
Cambios desplegados via "paste de YAML"        ~3 controles  (refactor del 2026-04-27)
Cambios desplegados via "edición manual"       ~3 controles  (bugfixes del 2026-04-29)
─────
Conclusión: en mantenimiento, la edición manual en PA Studio empata con
el paste de YAML. En el go-live era ~10–20% manual, ~80–90% paste.
```

### 2.3 Documentación generada

| Documento | LOC | Rol |
|---|---|---|
| `docs/plans/<fecha>-aggregation.md` | 544 | Plan ejecutable paso a paso, con checkboxes y rollback |
| `docs/handoffs/<fecha>-aggregation-handoff.md` (start) | ~140 | "Punto de guardado" antes de empezar la sesión |
| `docs/handoffs/<fecha>-aggregation.md` (end) | ~80 | Resumen de ejecución + smoke test + pendientes |
| `docs/handoffs/<fecha>-production-bugfixes.md` | ~115 | Log de la sesión de triage con cliente |

**Total de docs nuevas en mantenimiento: ~880 líneas.** El plan ejecutable es el documento más voluminoso porque sirve dos roles a la vez: (a) contrato cliente-dev, (b) entrada para que la IA ejecute sin re-preguntar el contexto.

---

## 3. Sesión 1 — Refactor "búsqueda agregada" (2026-04-27)

### 3.1 El bug, contado por el cliente

> "Cuando buscamos el lote LOTE-XXXXX, que tiene 18 filas en el catálogo de paquetes, el sistema crea **una** Línea de Proceso con los datos de UNA fila — sale ~0,12 m³, pero el lote real son ~5 m³."

Diagnóstico inmediato: el `OnSelect` del botón Buscar usaba `LookUp` (que devuelve el primer registro coincidente). Hacía falta `Filter` + `Sum` y un Patch que metiera totales en lugar de campos directos.

### 3.2 El plan como contrato

El plan ejecutable (544 líneas) tiene una estructura que es la pieza más reutilizable de toda esta fase:

```
1. Goal             ── 1 frase de propósito
2. Architecture     ── 4 bullets de la decisión técnica
3. Out of scope     ── lo que NO se va a tocar (importante con cliente vivo)
4. File Structure   ── tabla de archivos modificados / creados
5. Tasks 1..N       ── cada task con:
                       • Files
                       • Steps con checkboxes
                       • Comandos exactos a ejecutar
                       • Output esperado
                       • Comando de verificación
                       • Comando de commit
6. Verification     ── smoke test scripted
7. Rollback         ── cómo deshacer si rompe algo
8. Risks            ── decisiones a verificar durante ejecución
```

**Por qué esa estructura.** Cada `Task N` es una unidad atómica que (a) un humano puede leer en 30 s, (b) la IA puede ejecutar sin volver a preguntar el contexto. Si la sesión se corta a mitad, el siguiente run lee desde la primera checkbox sin marcar y reanuda. Sin checkboxes, no hay "punto de retorno" — y los ciclos de "explica de nuevo qué llevamos hecho" se comen 20-30 minutos de cada sesión nueva.

### 3.3 Decisiones tomadas en sesión (y NO re-litigadas durante la ejecución)

| # | Decisión | Por qué importa |
|---|---|---|
| Q1 | Solo agregamos `Sum(Filas)` y `Sum(Volumen m³)`. Largo/Ancho/Grueso quedan vacíos | Una sola dimensión sobre 18 filas distintas es data engañosa |
| Q2 | Lookups de "Lote Producto Ref" / "Origen Ref" quedan `null` cuando se agrega multi-fila | Apuntar a `First(rows)` sería data engañosa también — preferimos `null` con fingerprint |
| Q3 | Trazabilidad vía nueva columna DateTime (`fechacierrelote`) | El par `Nº Lote Ref` + `Fecha Cierre Lote` identifica unívocamente el grupo origen sin necesidad de relación 1-a-N a un join table |
| Q4 | Filtrar solo lotes con `Cierre` no nulo (ya estaba así) | Mantener |
| Q5 | Mantener regla actual de duplicados (mismo lote no se mete dos veces en el mismo proceso) | Decisión previa, no re-litigar |
| Q6 | Sin backfill de datos antiguos mal cargados | Eran datos de prueba, el cliente los borra y vuelve a meter |
| Q7 | Otra pantalla con el mismo bug → ticket separado, NO tocar | Scope hygiene |

**Por qué documentar las decisiones DESCARTADAS.** En la sesión de ejecución, la IA volvió a sugerir 2 veces "y de paso podríamos…" — el plan tenía la respuesta lista ("decisión Q2: no lo hacemos, ya se decidió"), y la sesión no se desvió. Sin esa lista, cada propuesta de la IA habría exigido una mini-discusión.

### 3.4 Ajustes durante el paste (los que NO previó el plan)

El plan tenía 5 asunciones que PA Studio rechazó. Las correcciones aplicadas y los commits que las trazaron:

| # | Asunción del plan | Realidad en PA Studio | Regla del proyecto reforzada |
|---|---|---|---|
| 1 | `Set(_loteCierre, Blank())` para tipar la variable | Da warning "No type found"; las propiedades del record fallan después | **Typed Blank obligatorio**: `Set(_var, LookUp(<DataSource>, false).<Campo>)` |
| 2 | Campo se llama `'Cierre de Lote'` | El campo real se llama `Cierre` a secas | **Display names canónicos** — siempre verificar contra el schema real, no contra lo que "suena bien" |
| 3 | Valor de option set: `'Origen'.LoteExistente` | El valor real es `'Lote Existente'` (con espacio, requiere comillas) | **Option sets**: la columna y el valor pueden tener nombres distintos; verificar con autocomplete |
| 4 | `_loteEncontrado.Producto.Producto` | Ambiguo — schema-qualificar a `.Producto.'Producto (<schema>_productoid)'` | **Cuando el campo primario coincide con el nombre de la tabla, schema name obligatorio** |
| 5 | `Text(value, "[$-es-ES]#,##0.000")` | El prefijo `[$-es-ES]` rompía el render (`.897.000` en vez de `0.897`) | **Locales en `Text()`**: NO añadir prefijos por reflejo; el motor ya respeta el locale del usuario |

Las 5 reglas estaban en la memoria del proyecto antes de la sesión, **pero el plan las violó porque fue redactado con la abstracción correcta y la sintaxis incorrecta**. Lección operativa: el plan es para el HUMANO + LA IA; la IA durante la ejecución sigue siendo el filtro final que detecta cuando el plan miente. Nunca el plan reemplaza la sesión interactiva, solo la prepara.

### 3.5 Smoke test

Cliente y dev probaron en la misma llamada un caso real:

| Caso | Resultado |
|---|---|
| Lote multi-fila LOTE-XXXXX (18 filas) → banner + Agregar | ✅ Banner: `LOTE-XXXXX — 18 registros — 55 uds — 0.897 m³`. Una sola línea creada. |
| Trazabilidad (`Nº Lote Ref` + `Fecha Cierre Lote` en MDA) | ✅ Ambos rellenos correctamente. |
| Largo/Ancho/Grueso vacíos en la línea creada | ✅ Confirmado. |
| Duplicado (mismo lote dos veces) | ✅ Banner rojo, botón Agregar oculto. |
| Lote no encontrado (`XYZ999999`) | ✅ Banner amarillo, opción "+ Manual" disponible. |
| Entrada manual sigue funcionando | ✅ Línea con `Origen = Manual`. |
| Lote 1-fila (regresión) | ⏳ A verificar — no hubo caso real disponible |
| Lote origen alternativo (otra tabla) | ⏳ A verificar — no había datos cerrados |

**Decisión sobre los pendientes:** marcarlos en el handoff de cierre y no bloquear el deploy. Casos de regresión sintéticos los probaríamos creando datos a mano, pero el coste/beneficio de hacerlo en una sesión con el cliente esperando es negativo — mejor capturar como riesgos conocidos.

---

## 4. Sesión 2 — Triage de 4 bugs en producción (2026-04-29)

Esta sesión es la más útil para la formación porque ilustra el patrón "soporte L3 con IA copiloto", que es muy distinto al patrón "build con IA" del go-live.

### 4.1 Cómo apareció cada bug

| Bug | Cómo lo descubrió el cliente | Tiempo entre report → fix desplegado |
|---|---|---|
| Empresa/Usuario `null` al guardar | El cliente abrió la vista MDA "Procesos abiertos" y vio columnas vacías que deberían tener valor | ~15 min |
| "campo `<prefijo>_ancho` obligatorio" al agregar lote | El cliente probó la búsqueda agregada del 2026-04-27 con un lote real y le saltó el banner de error | ~10 min |
| Galería con líneas fantasma en modo "Nuevo Registro" | Durante la verificación del bug 1, el cliente notó que al pulsar "Nuevo" aparecían líneas que no eran del nuevo registro | ~20 min |
| ~64 registros huérfanos | Al fixear el bug 3, la galería pasó de "muestra las del registro anterior" a "muestra 9 registros sin owner" | ~25 min (incluye la limpieza) |

**Tiempo total: ~70 minutos** desde el primer report hasta la verificación end-to-end con un caso real del cliente.

### 4.2 Bug 1 — DataField con mayúscula

```
Empresa_DataCard.DataField  : "<prefijo>_EmpresaLookup"   ← MAL (silently fails)
Usuario_DataCard.DataField  : "<prefijo>_UsuarioLookup"   ← MAL

Empresa_DataCard.DataField  : "<prefijo>_empresalookup"   ← BIEN
Usuario_DataCard.DataField  : "<prefijo>_usuariolookup"   ← BIEN
```

**Por qué es interesante este bug:**

1. **Silent failure**. Dataverse acepta el `Update` con un nombre de campo que no existe y guarda `null` sin tirar error. La Canvas App no detecta el problema porque la operación retorna éxito.
2. **Sutilmente diferente del go-live**. En el go-live, los DataCards de "Cliente" y "Máquina" tuvieron este mismo problema y se arreglaron. Empresa y Usuario sobrevivieron porque tenían `DisplayMode.Disabled` y su `Update` referenciaba directamente la variable global del operador, no un combo box visible. **El problema existía desde el go-live pero era invisible** hasta que el cliente miró las columnas en el MDA.
3. **El test funcional pasó**. Los Secados se creaban; la app respondía. Solo un humano mirando el MDA detectaba el `null`.

**Lección promovida a la base de conocimiento del equipo:**

> **Lookup DataField lowercase rule**. Los logical names en Dataverse son SIEMPRE minúsculas. Cualquier `DataField:` con mayúsculas en una Canvas App falla en silencio en el momento del Update. Auditar TODOS los DataCards de tipo lookup en la pantalla, no solo el que está fallando.

Esta regla ya existía como `feedback_audit_lookup_datafields.md`. La diferencia entre la primera vez y esta es que ya la teníamos formalizada — el dev la consultó **antes** de tocar nada y supo desde el principio que la auditoría debía ser exhaustiva (si Cliente/Máquina caían en el go-live, Empresa/Usuario eran sospechosos por construcción).

### 4.3 Bug 2 — Required en tabla vs Patch

El refactor del 2026-04-27 dejó `Largo/Ancho/Grueso` fuera del Patch de "búsqueda agregada" (decisión Q1: dimensiones no aplican a un agregado). Pero las columnas en `<prefijo>_LineaProceso` seguían marcadas como `Required = Yes` en Dataverse. Resultado: cuando el cliente usó la búsqueda agregada en producción, Dataverse rechazó el insert con `"El campo '<prefijo>_ancho' es obligatorio"`.

**Por qué no se detectó en el smoke test del 2026-04-27.** El smoke test sí agregó un lote (LOTE-XXXXX), pero el dev tenía permisos de admin y el operador puede haber salvado el insert con un default que el admin no ve, o el escenario exacto fue distinto. **La detección llegó cuando el cliente hizo la operación en su sesión.**

**Fix:** maker portal → Tabla Línea de Proceso → Columnas → para `<prefijo>_ancho`, `<prefijo>_grueso`, `<prefijo>_largo`: Edit column → Required: Optional → Save. Publish all customizations. Re-export de la solución para capturar el cambio en `Entity.xml`.

**Lección promovida**:

> **Required-vs-Patch alignment rule**. Antes de marcar una columna como Required en Dataverse, **auditar todos los `Patch()` y `SubmitForm()`** que escriben a esa tabla para confirmar que TODOS rellenan el campo. Si cualquiera lo deja vacío (decisión deliberada o histórico), la columna NO puede ser Required.

### 4.4 Bug 3 — Variable de estado sin reset

```powerfx
// btn_NuevoRegistro.OnSelect — antes
=Set(_modoNuevoRegistro, true);
Navigate(<…>Form_Screen)

// btn_NuevoRegistro.OnSelect — después
=Set(_modoNuevoRegistro, true);
Set(_registroActual, LookUp(<…>, false));   // typed Blank — limpia record previo
Navigate(<…>Form_Screen)
```

Si el operador había abierto un registro existente antes, `_registroActual` apuntaba a ese registro. La galería del form filtraba por `Linea.Padre.id = _registroActual.id` → mostraba las líneas del registro **anterior** dentro del nuevo.

Peor: si el operador clicaba "Nuevo" sin haber abierto nunca un registro, `_registroActual` era undefined → `_registroActual.id` evaluaba a Blank → el filtro se convertía en "give me lines where padre IS NULL" → exposed los registros huérfanos del bug 4.

**Lección promovida (refuerzo de una existente):**

> **Typed Blank pattern para variables de estado**. `LookUp(DataSource, false)` devuelve un record vacío *tipado*. Útil para (a) tipar variables al inicio de la app, (b) **resetear** una variable a "vacío" sin perder el tipado. `Set(var, Blank())` también funciona en algunos contextos pero el patrón typed Blank es siempre seguro.

Este patrón ya estaba en la base de conocimiento del proyecto desde el go-live. La novedad es la *aplicación a un caso de reset* en lugar de a un caso de inicialización.

### 4.5 Bug 4 — Limpieza de huérfanos

Una vez los bugs 1, 2 y 3 estaban arreglados, la galería en modo "Nuevo" mostraba 9 registros con `padre = null` — datos sembrados durante tests del go-live que nunca se limpiaron.

**Decisión:** fix en el dato, no en la UI. Razones:

1. Filtrar `padre <> null` en la galería sería *papering over* — el problema real es que existen filas huérfanas que nadie va a poder editar.
2. La columna `<prefijo>_padrelookup` ya estaba marcada como `Required` en metadata, así que **a partir de ahora** no pueden crearse más huérfanos por la app.
3. El cliente acepta borrar manualmente los ~64 registros vía la vista "Active" del MDA.

**Pendiente capturado en el handoff:** verificar que la relación `padre → hijo` está configurada como `Cascade Delete Parental` para que, si el cliente borra el registro padre, los hijos se borren también. Si no lo está, configurarlo y re-exportar la solución.

### 4.6 Verificación end-to-end con el cliente

Al cierre de la sesión, el cliente reproduce el flujo completo:
1. Crea un nuevo registro con todos los lookups.
2. Confirma que la galería arranca vacía `(0)/(0)/(0)`.
3. Tras guardar, agrega un lote manual.
4. Verifica en el MDA que el registro y la línea persisten con los lookups bien guardados.

**Cierre de sesión sin pendientes inmediatos**, con 3 items en el handoff para la próxima sesión (Cascade Delete + Business Rule cosmético + smoke test de cierre del proceso).

---

## 5. Patrones reutilizables que salieron de la fase de mantenimiento

Estos son los entregables más valiosos para futuros proyectos.

### 5.1 Plan ejecutable como contrato (refuerzo)

El template del plan del 2026-04-27 (sección 3.2) se replicará tal cual en futuras sesiones de refactor. Las propiedades que lo hacen funcionar:

- **Goal en una sola frase.** Si no cabe, el alcance está mal definido.
- **Out of scope explícito.** Más valioso que el In scope, porque protege contra los desvíos típicos de "ya que estoy aquí…".
- **Tasks atómicas con checkboxes.** Permite reanudar sesiones a mitad sin pérdida de contexto.
- **Comandos exactos para verificar y commitear.** La IA los ejecuta tal cual; el humano audita sin reescribirlos.
- **Sección Risks separada.** Las 5 reglas de PA Studio que quizá fallen están aquí, no enterradas en el flujo principal.
- **Sección Rollback.** En producción siempre.

### 5.2 Memorias del proyecto promovidas a base de conocimiento del equipo

Tres reglas pasaron de "memoria del proyecto" a "knowledge base del equipo" en esta fase, porque dejaron de ser específicas de este cliente y aplican a cualquier proyecto Canvas App + Dataverse:

1. **Lookup DataField lowercase**. Auditar TODOS los DataCards de tipo lookup, no solo el que falla.
2. **Typed Blank pattern**. Para inicialización Y para reset de variables de estado.
3. **Required-vs-Patch alignment**. Antes de marcar Required, auditar todos los `Patch()` que escriben a la tabla.

Cada una vive como un archivo MD topic-specific (~50-80 líneas: regla + por qué + ejemplo + cuándo aplicar) que se referencia desde el `CLAUDE.md` del proyecto y se carga automáticamente en cada sesión nueva.

**El círculo virtuoso.** La regla nace en el repo del cliente como `feedback_*.md` (auto-memoria del proyecto). Cuando se aplica a un segundo proyecto, se promueve a la base de conocimiento del equipo. La auto-memoria del cliente queda con un puntero ("véase regla X de la KB") en lugar del texto completo. **Después de 3-4 proyectos, la KB del equipo es la "biblioteca de errores ya pagados"**, y los proyectos nuevos arrancan ya con esas trampas evitadas.

### 5.3 Patrón "el handoff doble" en sesiones complejas

Para la sesión del 2026-04-27 generamos **dos** handoffs distintos con el mismo timestamp:

| Handoff | Cuándo se escribe | Para quién |
|---|---|---|
| `…-aggregation-handoff.md` (start) | ANTES de empezar | Ejecutor (humano o IA) — qué leer, qué decisiones no re-litigar, por dónde empezar, qué NO hacer |
| `…-aggregation.md` (end) | AL CERRAR | Próxima sesión — qué se hizo, qué se desplegó, qué quedó pendiente |

El "handoff de start" es el documento más infravalorado de los proyectos asistidos por IA. Contiene literalmente la frase "Cosas que NO hacer" como sección, lo que comprime el contexto enorme que normalmente se discute en una llamada de kick-off a 5-7 bullets. Si la sesión la ejecuta un dev distinto al que escribió el plan, este documento ahorra ~30 min de re-explicación.

### 5.4 Checklist para sesiones de bugfix con cliente en vivo

Extraído de la sesión del 2026-04-29:

```
[ ] Antes de unirse a la llamada:
    [ ] PA Studio abierto en la app de producción
    [ ] make.powerapps.com abierto en la solución
    [ ] El MDA del cliente abierto en otra pestaña
    [ ] El plan/handoff del último cambio relevante leído (~5 min)
    [ ] La auto-memoria del proyecto leída (~3 min)
    [ ] Git status limpio + branch correcto

[ ] Durante la sesión:
    [ ] Cada bug → reproducir antes de fixear (el cliente reproduce; tú mira)
    [ ] Cada fix → "lo voy a aplicar; cuento contigo para verificar"
    [ ] No batchear varios fixes sin verificar cada uno
    [ ] Si un fix expone otro bug (ej. fix #3 → bug #4), NO entrar en el siguiente
        sin acordar el alcance con el cliente
    [ ] Si un fix requiere cambio de schema, avisar del Publish + tiempo

[ ] Al cerrar:
    [ ] El cliente reproduce el flujo end-to-end con un caso real
    [ ] Handoff escrito ANTES de cerrar la llamada (no "luego lo escribo")
    [ ] Lecciones nuevas → memoria del proyecto / KB del equipo
    [ ] Pendientes en lista numerada para la siguiente sesión
    [ ] Commit con un mensaje que liste los 4 bugs en orden
```

---

## 6. Lo que la IA NO hizo (y siguió haciendo el humano)

Sección honesta para la formación.

### 6.1 Comunicación con el cliente

Toda la sesión de triage del 2026-04-29 transcurrió con el cliente en llamada. La IA estaba presente como copiloto del dev, no del cliente. Las decisiones de alcance ("este bug lo arreglo, este lo dejo para la próxima"), la priorización ("primero el que bloquea producción"), la negociación ("para arreglar este tengo que hacer un cambio de schema, espera 2 minutos") — todo eso lo lleva el humano. Ningún LLM razona bien sobre el contexto político/social de una llamada de cliente.

### 6.2 Reproducir el bug en producción

La IA puede leer el código, leer los logs si los hay, y proponer hipótesis sobre qué está mal. **No puede reproducir el bug**, porque no opera la Canvas App en producción. El humano reproduce, ve el banner de error, verifica los datos en el MDA. La IA sintetiza la observación + el código y propone el fix.

### 6.3 Decidir si un fix es seguro para producción

"¿Cambio el RequiredLevel de 3 columnas en producción ahora mismo, sin maintenance window?" Esa decisión la toma el humano leyendo a quién afecta, qué hora del día es, qué demás procesos están corriendo. La IA puede recordar los pros y contras, pero la decisión es human-in-the-loop por diseño.

### 6.4 Ojo de UX

El bug 4 (huérfanos) terminó decidiéndose por "limpiamos data + relación Cascade Delete". Pero hubo 5 minutos de discusión entre dev y cliente sobre alternativas:
- ¿Filtrar la galería?
- ¿Marcar los huérfanos como "archived"?
- ¿Vista separada "huérfanos" para que un admin los gestione?
- ¿Nada — son solo 64 registros, los limpia el cliente y a otra cosa?

La IA puede listar las 4 alternativas. **Cuál se elige depende de cómo trabaja el cliente** (¿tiene un admin? ¿quiere "ver" los huérfanos para auditar de dónde salen? ¿prefiere no contaminar la base con un estado nuevo?). Ese juicio humano sigue siendo donde el dev senior gana su sueldo.

---

## 7. Métricas honestas de la fase de mantenimiento

### 7.1 Cuánto código nuevo se generó

Comparativa go-live vs mantenimiento:

| Métrica | Go-live (2 días) | Mantenimiento (3 semanas, 2 sesiones) |
|---|---|---|
| LOC YAML generado por IA | ~3.134 | ~85 (un solo bloque OnSelect) |
| LOC Python generado por IA | ~1.140 | 0 |
| LOC Markdown (specs/handoffs/planes) | ~1.114 | ~880 |
| Cambios de schema Dataverse | 3 tablas + 44 campos + 8 lookups | 1 columna nueva + 3 columnas con Required cambiado |
| Cambios manuales en PA Studio | ~10 | ~5 |

**El reparto cambia radicalmente.** En el go-live el LLM produce ~5x más LOC de YAML que de docs. En mantenimiento, **produce ~10x más docs (planes/handoffs) que código**. Esto es positivo: el LLM está haciendo lo que mejor hace (estructurar prosa técnica) y dejando al humano lo que mejor hace (cambios pequeños y precisos en una UI viva).

### 7.2 Tokens estimados de la fase de mantenimiento

| Sesión | Input estimado | Output estimado |
|---|---|---|
| 2026-04-27 (refactor) | ~30-50k (plan + memoria + chunks YAML existentes leídos) | ~25-40k (plan generado + chunk modificado + handoff start + handoff end) |
| 2026-04-29 (triage 4 bugs) | ~20-30k (handoffs previos + entity.xml + chunks relevantes) | ~15-25k (handoff de cierre + análisis de cada bug + commits) |
| **Total mantenimiento** | **~50-80k** | **~40-65k** |

**Coste aproximado de la fase de mantenimiento (a precios públicos del periodo): ~$3-5.** Frente a las ~6-9 h de dev senior que costaría sin IA (~$300-450 a tarifa de mercado), es ruido.

### 7.3 Qué porcentaje del YAML del go-live sobrevivió 3 semanas

Conteo aproximado de los 8 chunks del go-live + el chunk Lista_Screen:

| Chunk del go-live | Total de "controles + propiedades clave" | Tocados en mantenimiento | % superviviente |
|---|---|---|---|
| Chunk 1 (header) | ~15 | 0 | 100 % |
| Chunk 2 (form) | ~50 | 2 (DataField × 2) | ~96 % |
| Chunk 3 (search) | ~20 | ~10 (refactor 2026-04-27) | ~50 % |
| Chunk 4 (gallery) | ~25 | 0 | 100 % |
| Chunk 5 (footer) | ~10 | 0 | 100 % |
| Chunk 6 (modal A) | ~30 | 0 | 100 % |
| Chunk 7 (modal B) | ~15 | 0 | 100 % |
| Chunk 8 (cierre fórmula) | ~5 | 0 | 100 % |
| Pantalla lista | ~25 | 1 (OnSelect "Nuevo") | ~96 % |
| **Total ponderado** | **~195** | **~13** | **~93%** |

**Conclusión:** ~93 % del YAML generado por la IA en el go-live seguía vigente 3 semanas después. El único chunk con cambios significativos (chunk 3 search) fue el que arregló un bug funcional, no un problema del código generado. **El YAML inicial era correcto para el spec inicial — el spec evolucionó.** Esto es la mejor refutación al miedo de "el código que escribe la IA no se mantiene": se mantiene si los cambios se hacen con el mismo método (planes ejecutables, paste por chunks, memoria del proyecto).

---

## 8. Adaptaciones al ejecutar este patrón con otros clientes

Esta sección es la que el caso de estudio nº 1 no podía dar (porque no había experiencia post-deploy todavía).

### 8.1 Lo que se traslada tal cual

- **Estructura del plan ejecutable** (sección 3.2). Independiente de cliente y de stack.
- **Patrón "handoff doble"** (sección 5.3). Independiente de stack.
- **Las 3 reglas KB** (sección 5.2). Aplican a cualquier proyecto Canvas App + Dataverse.
- **Checklist de sesión de bugfix con cliente en vivo** (sección 5.4). Independiente de stack.
- **Convención de naming `<tema>-YYYY-MM-DD.md`** para handoffs. Convención del equipo, no del cliente.

### 8.2 Lo que toca recalibrar para el siguiente cliente

| Item | Cómo recalibrar |
|---|---|
| Memorias del proyecto (`feedback_*.md`) | Heredar las "horizontales" (typed Blank, lookup lowercase, Required vs Patch). Crear de cero las "verticales" (display names del cliente, optionsets específicos, convenciones de naming `<prefijo>_`) |
| `CLAUDE.md` del repo | Reemplazar prefijo, nombres de soluciones, lista de tablas, perfiles de auth |
| Plan y handoffs históricos | NO heredar. Cada cliente tiene su contexto político-funcional |
| Tabla de display names canónicos | Generar nueva por cliente — son los nombres que el cliente ha personalizado en su app |

### 8.3 Cuándo repetir el patrón completo y cuándo simplificar

**Repetir completo (plan + handoff doble + smoke test + memoria)** si:
- Cambio de schema en Dataverse (afecta export y otros consumidores)
- Refactor de una fórmula > 20 líneas
- Cambio que afecta a > 1 pantalla
- Sesión con cliente en vivo donde se van a tomar decisiones

**Simplificar a "edición directa + commit + 1 línea de handoff"** si:
- Typo o ajuste cosmético
- Cambio aislado en 1 propiedad de 1 control
- Edición de docs

**Pista:** la pregunta clave es "¿quiero poder repetir/auditar/explicar este cambio dentro de 6 meses sin abrir el código?". Si sí → patrón completo. Si no → versión simplificada.

---

## 9. Q&A preparado

**P1: ¿La IA puede operar producción directamente o solo asistir al dev?**
- Asiste al dev. Para cambios de schema en Dataverse, ningún LLM tiene credenciales de admin del entorno cliente — el dev las usa interactivamente. Para cambios en PA Studio, el LLM no tiene acceso a la pantalla — el dev pega los YAML manualmente. La IA es copiloto, no piloto. **Esta separación es deseable**, no una limitación a remover.

**P2: ¿Qué pasa si el LLM cambia de versión entre go-live y mantenimiento?**
- Pasó durante este proyecto. La consistencia se mantiene porque las "reglas duras" (display names, optionsets, schema names) viven en archivos versionados (memoria del proyecto + plan + handoffs), no en la cabeza del LLM. Cualquier modelo nuevo carga esos archivos al inicio y opera con la misma información que el anterior. **El stack de archivos versionados es el "cinturón de seguridad" frente a cambios de modelo**.

**P3: ¿Cuánto cuesta operar el módulo en mantenimiento al mes con IA?**
- Tras el deploy: ~$3-5/mes en tokens (varía con el volumen de bugs reportados). Suscripciones Claude/Anthropic Max cubren esto sin acercarse al límite. El coste real es el tiempo del dev senior que opera la sesión — pero ese coste también baja ~50–60 % vs operar sin IA.

**P4: ¿Vale la pena el plan ejecutable de 544 líneas para un fix que se va a hacer en 2 horas?**
- Sí, **si la sesión va a ser con cliente en vivo o si el fix toca producción**. El coste del plan (~30 min de redacción) se amortiza en 5 min de sesión más eficiente y, sobre todo, en que la sesión queda auditable: 6 meses después se puede leer el plan y entender qué se hizo y por qué. Para fixes triviales sin cliente delante (typos, ajustes cosméticos), no hace falta plan — basta con commit message claro.

**P5: ¿Cómo evitar que un cliente vea la IA como "el dev" y le escriba directamente?**
- Política de cuenta: el cliente nunca interactúa con un LLM directamente. Toda la comunicación cliente ↔ dev ↔ IA pasa por el dev. Razones: (a) el LLM no tiene las credenciales para tocar producción, (b) los criterios de alcance los define el dev, no la IA, (c) los compromisos contractuales los asume el dev. La IA es interna del dev, como su IDE.

**P6: ¿Qué KPIs debería medir un equipo que adopta este patrón?**
- (1) Tiempo medio "report → fix desplegado" antes y después de adoptar IA. (2) % de YAML/código del go-live aún vigente a los 3 / 6 / 12 meses. (3) Nº de memorias promovidas a la KB del equipo por trimestre (proxy de cuánto está aprendiendo el equipo). (4) Nº de planes ejecutables ejecutados sin desviación significativa (proxy de calidad de los planes). (5) Coste de tokens ÷ horas de dev ahorradas.

---

## 10. Lecciones cerrando el ciclo de vida (go-live → 3 semanas en producción)

Las 5 ideas que llevarse a casa después de operar este patrón en un proyecto real:

1. **El YAML que la IA genera SÍ es mantenible** — si los cambios futuros usan el mismo método (planes + handoffs + memoria viva), no si se hacen ad-hoc en PA Studio sin documentar.
2. **Los planes ejecutables son el contrato compartido humano-IA**. Sin ellos, la IA en mantenimiento es ruido. Con ellos, la IA acelera 2-3x el ciclo de fix.
3. **Las memorias horizontales (regla genérica de stack) deben promoverse a la KB del equipo**; las verticales (specific al cliente) viven en el repo del cliente. **La línea entre "mi proyecto" y "mi equipo" es el límite de promoción de la regla**.
4. **El triage de bugs en producción con IA + cliente en vivo es el caso donde la IA aporta más valor por minuto invertido** — comprime ciclos de horas a minutos. Pero requiere que el dev tenga la sesión preparada (PA Studio + portal + MDA + handoffs leídos) antes de que el cliente entre. Sin esa preparación, la IA no compensa.
5. **No re-exportar el `.msapp`** (regla del proyecto). En PA Studio web, los cambios viven en producción. El YAML en el repo es **contrato de cambio**, no fuente de verdad. Esta inversión de la "fuente de verdad" es contraintuitiva pero es la que casa con cómo Microsoft opera Canvas Apps en la web.

---

## Apéndice A — Mapa de fuentes (por si se quiere reproducir el análisis)

```
docs/
├── plans/
│   └── <fecha>-secaderos-paquete-aggregation.md     ← Plan ejecutable (544 LOC)
├── handoffs/
│   ├── <fecha>-aggregation-handoff.md               ← Start handoff
│   ├── <fecha>-aggregation.md                       ← End handoff
│   └── <fecha>-production-bugfixes.md               ← Triage de 4 bugs
└── training/
    ├── secaderos-case-study-2026-04-09.md           ← Caso de estudio nº 1 (go-live)
    └── secaderos-case-study-followup-mantenimiento.md ← este documento

solutions/<SolucionPrincipal>/Entities/
└── <prefijo>_LineaProceso/Entity.xml                ← Diff: nueva columna fingerprint + 3 columnas Required→Optional

git log:
5bf716a feat(...): paquete aggregation fix (smoke test passed)
69c34cc fix(...): production bugfixes (4 issues)

memorias del proyecto (auto-memoria):
project_<modulo>.md                                  ← Status post-deploy + 4 bugfixes
feedback_canvas_app_powerfx.md                       ← Reglas Power Fx + YAML
feedback_canvas_app_no_reexport.md                   ← Regla "no re-exportar .msapp"
feedback_audit_lookup_datafields.md                  ← Auditar TODOS los lookup DataCards
feedback_table_required_aligns_with_patch.md         ← Required vs Patch alignment
feedback_publish_all_customizations.md               ← Saved ≠ Published
feedback_yaml_paste.md                               ← Formato bare, sin Screens: wrapper
feedback_handoff_naming.md                           ← <tema>-YYYY-MM-DD.md
feedback_pa_datasource_names.md                      ← Display names canónicos

base de conocimiento del equipo (knowledge base centralizada):
canvas-apps/lookup-datafield-lowercase.md
canvas-apps/typed-blank-pattern.md
dataverse/required-vs-patch-alignment.md
```

## Apéndice B — Comparativa go-live vs mantenimiento (resumen visual)

| Dimensión | Go-live | Mantenimiento (3 semanas) |
|---|---|---|
| Sesiones efectivas | 3 | 2 |
| LOC YAML generado | ~3.134 | ~85 |
| LOC docs generados | ~1.114 | ~880 |
| % YAML que sobrevive sin tocar | (no aplica — recién creado) | ~93 % |
| Cambios manuales en PA Studio | ~10 | ~5 |
| Cambios de schema Dataverse | grandes (3 tablas, 44 campos) | mínimos (1 columna + 3 Required-toggle) |
| Sesiones con cliente en vivo | 1 (demo final) | 1 (triage 2026-04-29) |
| Tiempo de ciclo "report → fix" | n/a | 10–25 min/bug |
| Coste estimado en tokens | ~$9–14 | ~$3–5 |
| Ahorro estimado vs sin IA | ~60–70 % | ~50–60 % |
| Aporte principal de la IA | Generar YAML voluminoso correctamente | Comprimir ciclos de triage + redactar planes/handoffs |
| Cuello de botella humano | Validar Power Fx + pegar YAML chunk a chunk | Razonar sobre estado vivo en producción + comunicar con cliente |
