# Phase 2 — Funcionalidad Pendiente

**Estado:** Implementado (flujo básico funciona) | **Pendiente:** Features críticas

---

## 1. VALIDACIONES DE NEGOCIO (CRÍTICO)

**Descripción:** El formulario PMF permite guardar datos sin validar contra las reglas del reglamento.

**Validaciones faltantes:**
- [ ] Dosis entre 100-500mg (Art. 1408)
- [ ] Hora administración <= hora_carrera - 4h (Art. 1406)
- [ ] Hora entrega receta < 12:00 PM (Art. 1407)
- [ ] Dosis administrada == dosis recetada (o justificación)
- [ ] Aguja desechable confirmada (Art. 1410)
- [ ] Caballo en LOES (en_loes = true)

**Ubicación:** `lib/actions/pmf.ts` — agregar validaciones en `certifyPMFRecord()`

**Impacto:** Sin estas validaciones, el Vet Oficial podría certificar registros inválidos.

---

## 2. CAMPOS DE AUDITORÍA EN BD (CRÍTICO)

**Descripción:** Necesitamos guardar resultados de validaciones para auditoría posterior.

**Campos faltantes en `pmf_records`:**
```sql
ALTER TABLE pmf_records ADD COLUMN
  val_horas_antes DECIMAL(4,2),      -- horas reales antes de carrera
  val_dosis_ok BOOLEAN DEFAULT false,
  val_rx_tiempo_ok BOOLEAN DEFAULT false,
  val_coincide_dosis BOOLEAN DEFAULT false;
```

**Ubicación:** Nueva migración Supabase

**Impacto:** Auditoría regulatoria (AIDH requiere trazabilidad).

---

## 3. PDF GENERATION & EMAIL DISTRIBUTION (CRÍTICO — Art. 1002e)

**Descripción:** Al certificar, el sistema DEBE generar PDF y distribuir copias.

**Funcionalidad faltante:**
- [ ] Generar PDF firmado (con firmas en imagen)
- [ ] Enviar email a dueño/entrenador
- [ ] Enviar email a Secretario de Carreras
- [ ] Enviar email a Administrador Hípico
- [ ] Guardar copia en expediente del caballo

**Ubicación:** 
- PDF: nueva librería (PDFKit o similar)
- Email: `lib/actions/email.ts` (nueva)
- Trigger: `certifyPMFRecord()` en `lib/actions/pmf.ts`

**Impacto:** Reglamento obliga distribución. Sin esto, el PMF no está completo legalmente.

---

## 4. DASHBOARD MEJORADO (IMPORTANTE)

**Descripción:** Race Day Dashboard necesita mejoras de UX para agilizar el flujo del Vet.

**Features faltantes:**
- [ ] 4 KPI cards (total, LOES, admin, pendientes)
- [ ] Urgencia por color (rojo < 30min, ámbar 30min-2h, verde done)
- [ ] Cuenta regresiva a "Hora de Retiros y Cambios"
- [ ] Botón "Sync Equibase" (reload CSV)
- [ ] Botón "Añadir caballo manual"

**Ubicación:** `app/(protected)/race-day/[id]/page.tsx`

**Impacto:** UX. Sin esto, el Vet no ve qué caballos son urgentes.

---

## 5. HISTORIAL PMF POR CABALLO (NICE-TO-HAVE)

**Descripción:** Ver todos los registros PMF históricos de un caballo.

**Features faltantes:**
- [ ] Nueva ruta `GET /horse/:id/pmf` (listado)
- [ ] Nueva ruta `GET /horse/:id/pmf/:pmf_id` (detalle)
- [ ] Componente tabla con filtros (año, estado)

**Ubicación:** Nueva página `app/(protected)/horse/[id]/pmf/page.tsx`

**Impacto:** Auditoría + decisiones clínicas (patrones de sangrado).

---

## 6. LOES RECORD (NICE-TO-HAVE)

**Descripción:** Registrar entrada de caballo a LOES (lista de sangradores).

**Features faltantes:**
- [ ] Nueva tabla `loes_records`
- [ ] Formulario de ingreso a LOES
- [ ] Historial de cambios en LOES

**Ubicación:** Nueva tabla + nueva página

**Impacto:** Control de sangradores. Actualmente no hay forma de marcar un caballo como "en LOES".

---

## Prioridad de implementación

**CRÍTICO (bloquea uso legal):**
1. Validaciones de negocio
2. PDF + Email distribution
3. Campos de auditoría

**IMPORTANTE (mejora UX):**
4. Dashboard mejorado

**NICE-TO-HAVE (soporte):**
5. Historial PMF
6. LOES Record

---

## Estado actual (2026-06-24)

- ✅ Phase 2 core: Registro, firmas, certificación funcionales
- ✅ Optimización: Batch queries, sin loops infinitos
- ❌ Validaciones: No implementadas
- ❌ PDF/Email: No implementado
- ❌ Dashboard: Básico (tabla simple)
