# Handoffs entre sesiones — preservar contexto cuando Claude lo pierde

> Documento de apoyo para la **Sesión 4 — Lunes** del curso de Claude Code (Power Fox BI).
> Cómo y por qué escribir un *handoff* al final de cada sesión de trabajo, y cómo retomarlo en la siguiente.

---

## 1. El problema

Claude Code es brutal **dentro** de una sesión. Lee tu repo, infiere convenciones, encadena cambios, mantiene en mente lo que dijiste hace 40 mensajes.

El problema empieza cuando cierras la terminal.

La próxima vez que abras Claude en ese mismo proyecto:

- No recuerda en qué rama estabas.
- No recuerda qué decisión descartaste hace tres días *y por qué*.
- No recuerda que el PR está bloqueado esperando una respuesta de QA.
- No recuerda que el bug que te frustró el viernes era en realidad un problema de timezone.

El `CLAUDE.md` arrastra **convenciones** del proyecto. Pero no arrastra *dónde te quedaste* ni *por qué tomaste esa decisión rara*. Ese hueco lo cubre el handoff.

---

## 2. Qué es un handoff

Un **handoff** es un markdown corto que escribes al final de cada sesión de trabajo y guardas dentro del propio repo (o de un vault dedicado, si gestionas varios proyectos).

Tres ideas centrales:

| Idea | Por qué importa |
|---|---|
| Una sola lectura al inicio = ~80% del contexto recuperado | Empiezas la sesión con `cat` del último handoff, no re-explorando |
| Decisiones no obvias se documentan o se pierden | El código dice *qué*; el handoff dice *por qué* eso y no la otra opción |
| Items pendientes no se silencian entre sesiones | La tabla *Carried Forward* obliga a arrastrar lo no resuelto hasta que se cierra |

No es un changelog ni un PR description. Es una **carta a tu yo futuro** (o a otro miembro del equipo) que retoma exactamente donde lo dejaste.

---

## 3. Cuándo escribir uno

- Al **terminar** una sesión de trabajo, aunque no hayas cerrado el feature.
- Al **bloquearte** por algo externo (esperando review, falta info de cliente, depende de otro equipo).
- Antes de un **fin de semana largo** o vacaciones.
- Cuando vas a **cambiar de proyecto** y volverás más tarde a este.

No hace falta uno por cada commit. Uno por sesión productiva basta.

---

## 4. Estructura del template

Este es el template oficial que vamos a usar en clase. Está pensado para que cada sección capture algo que **no se puede recuperar leyendo el código o el `git log`**.

```markdown
---
project: <vault | veltro | clients/<slug> | personal/<slug>>
date: <YYYY-MM-DD>
feature: <feature-slug>
status: <complete | in-progress | blocked>
touched-also: <comma-separated other projects, or empty>
---

# Session Handoff — [YYYY-MM-DD] — [Feature / Topic]

Use this template at the **end of every working session** to preserve context.
Start the **next session** by reading the most recent handoff for that project.

> Copy this file → save as `sessions/<project>/YYYY-MM-DD-<feature-slug>.md` → fill in.

---

### Branch
`[branch-name]` — based off `[base-branch]` (or "no branch yet" for vault scaffolding)

### Status
_What is done and confirmed working._

- [ ] item 1
- [ ] item 2

### Resolved This Session (from prior handoffs)
_Items from previous sessions that were resolved in this session. Remove this section if nothing was resolved._

- [x] [Item description] (from [source-handoff] [date]) — fixed in commit `[sha]`
- [x] [Item description] (from [source-handoff] [date]) — resolved via PR #[number]

### Blockers / Open Questions
_Anything unresolved that the next session must address first._

- [ ] blocker 1
- [ ] question 1

### Next Step (exact)
_Single, unambiguous action to resume work — no vagueness._

> e.g. "Run `infisical run --env=dev -- npm run diff` to verify the sync fix, then commit."

### Non-Obvious Decisions Made This Session
_Choices that aren't visible in the code or spec. Future-you needs to know why._

| Decision | Reason |
|----------|--------|
| [Decision made] | [Why] |

### Files Changed
_Key files only — not a full diff._

```
path/to/file1.ts
path/to/file2.md
```

### Commit Range
`[start-sha]..[end-sha]` — or "no commits yet"

---

### Carried Forward
_Unresolved items inherited from prior sessions. Copy this table from the previous handoff as your starting point. Do NOT delete entries — update their status._

| # | Item | Originally From | Status |
|---|------|-----------------|--------|
| CF-1 | [description] | [source-handoff] [date] | STILL PENDING |
| CF-2 | [description] | [source-handoff] [date] | RESOLVED [date] via [commit/PR] |

**Rules:**
- Copy the previous handoff's Carried Forward table as your starting point.
- Update status for any items you resolved this session (mark RESOLVED with date + reference).
- Add new items from this session's Blockers / Open Questions that remain unresolved.
- Never delete a row — resolved items stay as a historical record.

---

### Tools/MCPs Used
_Listing the tools touched, for future debugging._

ms365, notion-sync, graphify, claude-code-mcp
```

---

## 5. Sección por sección — qué poner y qué no

### Frontmatter
Cinco campos. `project` y `feature` son los que te permiten luego encontrar el handoff sin abrirlo. `status` te dice de un vistazo si la sesión cerró un trozo o quedó a medias. `touched-also` es para el caso real en que tocaste dos repos a la vez (ej. un cambio en el componente compartido + el cliente que lo consume).

### Branch
Una línea. La rama y de dónde sale. Suena trivial hasta que vuelves el lunes y no recuerdas si estabas en `feature/time-tracker-refactor` o en `fix/time-tracker-validation`.

### Status — qué está hecho **y confirmado funcionando**
Lo importante es la palabra *confirmado*. No "creo que el endpoint funciona". Lo probaste, viste el 200, te lo apuntas. Si no lo confirmaste, va en *Blockers*.

### Resolved This Session
Cosas que arrastrabas de handoffs anteriores y que cerraste hoy. Si no resolviste nada heredado, **borra esta sección entera**. Sin obligación de inflarla.

### Blockers / Open Questions
Lo que la próxima sesión **tiene que tocar primero**. Bloqueos reales (esperando review, falta credencial), preguntas abiertas (¿usamos `pfx_time_entry` o `pfx_time_entry_day` para esto?).

### Next Step (exact)
La sección que más valor da. Una frase, sin ambigüedad, ejecutable.

| Mal | Bien |
|---|---|
| "Continuar con el refactor" | "Ejecutar `npm run test:integration -- weather-app` y arreglar los 2 tests rojos" |
| "Revisar el endpoint" | "Probar `POST /api/time-entries` con el payload de `fixtures/te-001.json` y verificar que el `approved_by` se rellena" |
| "Seguir con la PR" | "Responder al comentario de Yeriel en línea 47 del PR #142 y re-pedir review" |

Si no eres capaz de escribir un *Next Step* concreto, probablemente la sesión no terminó en buen sitio para parar.

### Non-Obvious Decisions Made This Session
La sección que **más rendimiento da a largo plazo**. Decisiones que no se ven en el diff.

Ejemplos reales:

| Decisión | Razón |
|---|---|
| No usar `Patch` para el upsert; usar el conector custom | `Patch` perdía el `OwnerID` cuando se ejecutaba con impersonación; el conector lo respeta |
| Duplicar los 7 contenedores día en vez de componente | Studio no permite parametrizar `Default` en componentes con tipo Record sin perder reactividad |
| Mover validación de fecha a `OnVisible` y no `OnStart` | `varCurrentUser` no estaba disponible en `OnStart` cuando se abre embebida desde MDA |

Tres meses después leerás el código, pensarás "esto está mal hecho", y este apartado te recordará que ya lo intentaste de la otra forma.

### Files Changed
Solo los archivos clave. No un `git diff --name-only`. Lo justo para que el yo-futuro sepa qué abrir primero.

### Commit Range
`<sha-inicio>..<sha-fin>`. Si no hay commits aún, lo dices. Esto te permite reconstruir lo trabajado con `git log <range>` sin tener que recordar fechas.

### Carried Forward — la sección crítica
La regla: **nunca borras filas**. Solo marcas como resueltas.

```markdown
| # | Item | Originally From | Status |
|---|------|-----------------|--------|
| CF-1 | Falta confirmar timezone en aprobaciones | 2026-04-22 time-tracker | STILL PENDING |
| CF-2 | Validar que approver != owner | 2026-04-22 time-tracker | RESOLVED 2026-04-29 via commit a3f9c1 |
| CF-3 | Cliente custom rate limiter | 2026-04-29 time-tracker | STILL PENDING |
```

¿Por qué no borrar las resueltas? Porque cuando dentro de dos semanas alguien diga *"esto del approver != owner ¿lo llegamos a meter?"*, abres el handoff más reciente y ahí está la trazabilidad: en qué commit se cerró y qué día.

### Tools/MCPs Used
Lista corta de MCPs tocados. Cuando algo se rompa en otra sesión, sabes por dónde empezar a debuggear.

---

## 6. Flujo completo

### Cerrar una sesión

1. Copias el `_template.md`.
2. Lo guardas como `sessions/<project>/YYYY-MM-DD-<feature-slug>.md`.
3. Lo rellenas — 5 a 10 minutos, no más.
4. Añades una línea a `sessions/log.md` con el resumen de una frase.
5. Commit: `git add sessions/<project>/ && git commit -m "chore: session handoff <feature> <date>"`.

### Abrir la siguiente sesión

1. `cat sessions/<project>/<último-handoff>.md` — o pedirle a Claude que lo lea.
2. Lees primero **Carried Forward**: son obligaciones heredadas.
3. Lees **Next Step**: empiezas por ahí, sin re-explorar.
4. Si vas a tocar algo del feature, revisas **Non-Obvious Decisions** antes.

Esa secuencia recupera ~80% del contexto en un par de minutos.

---

## 7. Cómo encaja con Claude Code

El handoff es **markdown** y vive en el repo. Eso significa:

- Claude lo lee como cualquier otro archivo.
- Puedes pedirle al inicio de la sesión: *"Lee el último handoff de este proyecto y dime por dónde íbamos"*.
- Puedes pedirle al final: *"Genera un handoff siguiendo `sessions/_template.md` con lo que hemos hecho"* — y luego revisas y ajustas.
- Si tienes muchos proyectos, el `touched-also` te permite cross-referenciar.

Una práctica útil: añadir al `CLAUDE.md` del proyecto una línea que apunte a `sessions/` para que Claude sepa que existen y los consulte por defecto al arrancar.

---

## 8. Anti-patrones

- **Handoffs vagos** — "Seguir trabajando en el feature". Inútil. Si no puedes ser específico, no escribas el handoff: la sesión no acabó en buen sitio.
- **Handoffs como diario personal** — No es un blog. Hechos, decisiones, próximo paso.
- **Saltar el Carried Forward** — La primera vez que omites un item heredado, en dos semanas reaparece como bug en producción.
- **Documentar lo que ya está en el código** — El diff ya cuenta el *qué*. El handoff cuenta el *por qué* y el *qué falta*.
- **Escribirlo "luego"** — Se escribe al cerrar la sesión, con el contexto fresco. Si lo dejas para mañana, ya perdiste la mitad del valor.

---

## 9. Mini-ejemplo

```markdown
---
project: clients/litoclean
date: 2026-05-04
feature: time-tracker-approval-flow
status: blocked
touched-also:
---

# Session Handoff — 2026-05-04 — Time Tracker Approval Flow

### Branch
`feature/te-approval-flow` — based off `main`

### Status
- [x] Endpoint `POST /api/time-entries/approve` implementado y probado con Postman
- [x] Validación `approver != owner` añadida (commit a3f9c1)
- [ ] UI de aprobación — falta integrar el botón en Screen1

### Blockers / Open Questions
- [ ] Esperando confirmación de Renny sobre si el aprobador puede editar las horas antes de aprobar, o solo aprobar/rechazar tal cual

### Next Step (exact)
> Pingear a Renny por Teams con la pregunta del blocker. Si responde que solo aprobar/rechazar, implementar `btnApprove.OnSelect` en Screen1 línea ~2840 llamando al endpoint nuevo.

### Non-Obvious Decisions Made This Session
| Decisión | Razón |
|---|---|
| Endpoint separado en vez de campo `status` editable | Auditoría: necesitamos log de quién aprobó y cuándo, no solo el estado final |
| `approver != owner` se valida en backend, no en UI | UI puede ser bypaseada con dev tools; la regla de negocio vive en el conector |

### Files Changed
```
api/time-entries/approve.ts
canvas/Screen1.pa.yaml
tests/integration/te-approval.spec.ts
```

### Commit Range
`f01abc..a3f9c1`

---

### Carried Forward

| # | Item | Originally From | Status |
|---|------|-----------------|--------|
| CF-1 | Validar timezone en submitted_at | 2026-04-22 time-tracker | STILL PENDING |
| CF-2 | Validar approver != owner | 2026-04-22 time-tracker | RESOLVED 2026-05-04 via commit a3f9c1 |
| CF-3 | Confirmar si approver puede editar antes de aprobar | 2026-05-04 (este handoff) | STILL PENDING |

### Tools/MCPs Used
ms365 (Teams ping a Renny), claude-code-mcp
```

---

## 10. Para la práctica de hoy

1. Cada uno coge un proyecto real propio (puede ser una rama de cliente, un experimento, lo que sea).
2. Copia el `_template.md` → `sessions/<tu-proyecto>/2026-05-05-<feature>.md`.
3. Rellénalo con lo que estés haciendo **ahora mismo**, aunque sea trivial.
4. Lo más importante: rellena bien **Next Step** y **Non-Obvious Decisions**. Esas dos secciones son el 70% del valor.
5. Pídele a Claude que lo lea y te diga si el *Next Step* es realmente accionable o sigue siendo vago.

El objetivo no es escribir un handoff perfecto la primera vez. Es **establecer el hábito**: cierras sesión → handoff → commit. La calidad del handoff mejora sola con la repetición.
