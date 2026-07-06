# TODO Mañana — 2026-06-25

## 🚀 Primer paso: PREGUNTAS REGULATORIAS

Antes de tocar código, aclarar estas 2 preguntas (están en `PREGUNTAS_REGULATORIAS.md`):

### 1. ¿Quién registra caballos en LOES?
- ¿El Vet Oficial en la app?
- ¿Proceso manual en AIDH?
- ¿Se requieren ambas firmas?

**Impacto:** Afecta flujo de LOESRecord, permisos, acceso control

### 2. ¿Hora de Entrega de Receta: mediodía fijo o variable?
- ¿Validar contra 12:00 PM siempre?
- ¿O contra "Hora de Retiros y Cambios" del día (que varía)?

**Contexto:** User confirmó que "hora para retiros" (Art. 1403) ≠ "hora receta" (Art. 1407)

**Impacto:** Cómo re-habilitar la validación deshabilitada

---

## ✅ Después de Preguntas Regulatorias

### Re-habilitar Validación
```
// app/(protected)/pmf/[combined]/page.tsx línea 70-75
// lib/actions/pmf.ts línea 247-256
```
Descomenta la validación y arréglala según respuesta

### LOESRecord Table
Crear tabla para audit trail de ingresos a LOES

### PDF + Email
Generar PDF de PMF certificado y enviar email

### Dashboard
Resumen de PMF por día

---

## 📁 Archivos Clave Hoy

- `PREGUNTAS_REGULATORIAS.md` — Las 2 preguntas
- `PHASE3_STATUS.md` — Estado completo de Phase 3
- `scripts/clear-loes.ts` — Script para limpiar LOES (creado pero no ejecutado)
- `supabase/migrations/20260624_clear_loes.sql` — SQL para limpiar LOES

---

## 🐛 Issues Conocidos

- ❌ Validación hora_entrega_receta DESHABILITADA (necesita aclaración regulatoria)
- ✅ Todo lo demás funciona: crear PMF → firmar → certificar

---

## 💾 Todos los cambios están guardados

- Código actualizado ✅
- Documentación actualizada ✅
- Memoria actualizada ✅
- Preguntas pendientes documentadas ✅

**¡A dormir!** 😴
