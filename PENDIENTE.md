# VetTrack — Pendientes

Última revisión: 2026-05-29

---

## 🔴 Alta prioridad

### 1. Mostrar `proposito` y vía de administración en el timeline del caballo ✅
**Archivo:** `app/(protected)/horses/[id]/page.tsx` (~línea 325)
**Contexto:** El modal ya captura y guarda estos campos en la DB (`medications.type` = vía, `medications.proposito` = propósito), pero no se renderizan en las tarjetas del historial médico.
**Estado:** Implementado - Se muestran como badges (vía en color gris, propósito en color verde) (2026-06-01)

---

### 2. `proposito` en el reporte de medicamentos ✅
**Archivo:** `app/(protected)/reports/medications/page.tsx`
**Contexto:** La tabla del reporte muestra Caballo, Medicamento, Tipo, Dosis, Restricción, Vet/Fecha, Retiro — pero no el campo `proposito`.
**Estado:** Implementado - Añadida columna Propósito en la tabla y filtro dropdown en el formulario (2026-06-01)

---

## 🟡 Media prioridad

### 3. Ruta `/horses/new` huérfana ✅
**Archivo:** `app/(protected)/horses/new/page.tsx`
**Contexto:** El botón "Nuevo Caballo" fue eliminado de la lista (los caballos se sincronizan desde el hipódromo), pero la ruta sigue siendo accesible por URL directa.
**Estado:** Página eliminada completamente (2026-06-01)

---

### 4. Página de perfil de usuario
**Contexto:** Los vets no pueden actualizar su nombre ni contraseña desde la app. El campo `vet_name` en los registros se genera del perfil (`profiles.first_name + last_name`) — si el nombre está vacío, se usa el email.
**Qué hacer:** Crear `/perfil` (o `/configuracion`) con:
- Formulario para editar `first_name` y `last_name` → `supabase.from('profiles').update()`
- Cambio de contraseña → `supabase.auth.updateUser({ password })`

---

### 5. Dashboard con alertas de compliance
**Archivo:** `app/(protected)/dashboard/page.tsx`
**Contexto:** El dashboard muestra stats generales pero no hay alertas de caballos con withdrawal/detection times activos.
**Qué hacer:**
- Sección "En restricción activa": caballos con medicación reciente que todavía están en período de retiro (administered_at + withdrawal_time_horas > now)
- Badge o indicador de cuántos días faltan para que el caballo pueda correr

---

## 🟢 Baja prioridad

### 6. Limpiar entradas `catalog_items` de categoría `dose`
**Contexto:** Antes el modal de medicamentos usaba `doseSuggestions` del catalog. Eso fue removido. Las filas con `category = 'dose'` en `catalog_items` ya no tienen uso.
**Qué hacer:** Decidir si se eliminan del admin o se reutilizan para otra cosa. No es urgente.

### 7. Cambio de contraseña accesible
Queda cubierto si se implementa el gap #4 (página de perfil).
