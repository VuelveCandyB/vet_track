# Preguntas Regulatorias Pendientes

## 1. Registro en LOES — Autoridad y Proceso
**Pregunta:** Según el reglamento, ¿quién tiene la autoridad de registrar un caballo en LOES?

**Contexto:**
- El sistema actual permite al Vet Oficial presionar "Registrar en LOES"
- Pero NO está claro si esto es correcto según el reglamento
- Hay mención de dos firmas: Vet Oficial + Vet Autorizado

**Necesita clarificación:**
- ¿Quién registra? (Vet Oficial de AIDH / Vet Autorizado privado / Ambos)
- ¿Es un proceso manual en AIDH o en la app?
- ¿Se requieren ambas firmas o solo una?
- ¿Hay un examen o certificación específica antes de registrar?

**Impacto:**
- Afecta el flujo de Phase 3 (LOESRecord)
- Afecta los permisos en la app (quién puede marcar como LOES)
- Afecta las validaciones (cuándo se puede usar PMF)

**Fecha a resolver:** HOY (2026-06-24)

---

## 2. Hora de Entrega de Receta — ¿Contra qué se valida?
**Pregunta:** La receta debe entregarse antes de... ¿qué hora?

**Opciones:**
- ¿Siempre antes de las 12:00 PM (mediodía)?
- ¿O antes de la "Hora de Retiros y Cambios" del día (que puede variar)?

**Contexto:**
- El sistema actual valida contra mediodía fijo (12:00 PM)
- Pero cada día de carreras tiene una "Hora de Retiros y Cambios" diferente
- Art. 1407 dice "antes del mediodía" pero no especifica si es hora fija o relativa
- Usuario confirmó que "hora para retiros" es diferente de "hora receta"

**Impacto:**
- Afecta la validación de `hora_entrega_receta`
- Afecta la lógica de restricción de PMF

**Fecha a resolver:** HOY (2026-06-24)

---

## Estado General
- Phase 2 implementada ✅
- Phase 3 (Validaciones + Auditoría) en progreso
- Validación de hora_entrega_receta DESHABILITADA TEMPORALMENTE (línea 70-75 en page.tsx y línea 247-256 en pmf.ts)
- Pendiente: Aclarar ambas preguntas antes de re-habilitar validación
