# Phase 3 Status — Validaciones + Auditoría

**Fecha de inicio:** 2026-06-23
**Último update:** 2026-06-24 (noche)

## ✅ Completado

### Validaciones tempranas (antes de crear PMF)
- [x] Validación de dosis (100-500mg)
- [x] Validación de LOES (caballo debe estar registrado)
- [x] Bloqueo de acceso si caballo NO está en LOES

### Creación y Firma de PMF
- [x] `createPMFRecord()` — crear registro
- [x] `signPMFAsVetOficial()` — firma del Vet Oficial
- [x] `signPMFAsRepresentante()` — firma del Representante
- [x] Audit log de firmas en `signature_audit_log`

### Certificación con Validaciones
- [x] `certifyPMFRecord()` con 6 validaciones
- [x] Validación de dosis (100-500mg)
- [x] Validación de dosis coinciden (recetada = administrada)
- [x] Validación de aguja confirmada
- [x] Validación de caballo en LOES
- [x] Validación de 4 horas antes de carrera

### UI/UX
- [x] Tooltips con referencias a artículos del reglamento
- [x] Campo "Vía" deshabilitado (siempre IV)
- [x] Bloqueo de acceso a PMF si caballo NO está en LOES
- [x] Botón "Registrar en LOES" para marcar caballos como sangradores
- [x] Estado visual: verde si en_loes, rojo si no

### Testing
- [x] CSV con 5 caballos reales cargado
- [x] Match automático por microchip/nombre
- [x] Flujo completo: crear → firmar → certificar

---

## ⏸️ DESHABILITADO TEMPORALMENTE

### Validación de Hora de Entrega de Receta
**Problema:** Comparación de hora fallaba con falso positivo (reportaba "después de mediodía" cuando era AM)

**Cambios:**
- Comentada validación temprana en `app/(protected)/pmf/[combined]/page.tsx` línea 70-75
- Simplificada validación en `lib/actions/pmf.ts` línea 247-256 (ahora solo verifica que existe, no compara hora)

**Razón:** Necesita aclaración regulatoria sobre si debe validarse contra:
- Mediodía fijo (12:00 PM siempre)
- O "Hora de Retiros y Cambios" del día (variable)

**Acción pendiente:** Preguntar mañana (PREGUNTAS_REGULATORIAS.md)

---

## 📋 Pendiente para Phase 3

### Regulatorio (DEBE ACLARAR PRIMERO)
- [ ] ¿Quién registra caballos en LOES? (Vet Oficial o AIDH)
- [ ] ¿Hora de entrega de receta vs Hora de Retiros y Cambios?

### Después de aclarar regulatorio
- [ ] LOESRecord table (historial de ingresos a LOES)
- [ ] Re-habilitar validación de hora_entrega_receta
- [ ] PDF generation + email distribution
- [ ] Dashboard: resumen de PMF por día
- [ ] Historial PMF: ver PMF históricos

---

## 🐛 Bugs Arreglados

1. **CSV Scientific Notation** — Exportar CSV sin formato científico ✅
2. **Duplicate AlertCircle Import** — Consolidar imports de lucide ✅
3. **Rendering Loop en race-entries-table** — Usar useMemo ✅
4. **Early validation hora_receta** — Comparación directa de horas (no Date) ✅
5. **validatePMFRecord hora_receta** — Cambio a getUTCHours (luego deshabilitado) ✅
6. **Default hora_entrega_receta** — Cambio de "12:00" a "09:00" ✅

---

## 📝 Notas

- Usuario confirma que "hora para retiros" (Art. 1403) es DIFERENTE de "hora receta" (Art. 1407)
- Script de limpieza LOES creado: `scripts/clear-loes.ts`
- Migración SQL creada: `supabase/migrations/20260624_clear_loes.sql`
