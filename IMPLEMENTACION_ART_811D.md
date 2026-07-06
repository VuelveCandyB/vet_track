# Implementación: Art. 811d — Duración + Replicación Diaria

## ✅ Completado

### 1. **Cambios en la base de datos**
Archivo: `supabase_migrations/add_tratamiento_duracion.sql`

Nuevos campos en tabla `treatment_reports`:
- `hasta_cuando (DATE)` — Hasta cuándo durará el medicamento
- `es_auto_generado (BOOLEAN)` — Si fue generado automáticamente
- `informe_padre_id (UUID)` — Referencia al informe original

Tabla auxiliar: `treatment_reports_replication_log`

**Acción requerida:** Ejecutar la migración en Supabase
```bash
# Copiar el contenido de supabase_migrations/add_tratamiento_duracion.sql
# y ejecutarlo en la consola SQL de Supabase
```

### 2. **Cambios en el formulario**
Archivo: `components/treatment-reports/treatment-report-form.tsx`

Nueva sección: "Duración del Tratamiento (Art. 811d)"
- Campo obligatorio: "Hasta cuándo durará el medicamento"
- Helper text explica la replicación automática
- Validación: `hasta_cuando >= fecha_tratamiento`

### 3. **Lógica de replicación**
Archivo: `lib/actions/treatment-reports.ts`

Nueva acción: `replicateDailyTreatmentReports()`
- Busca informes "borrador" con `hasta_cuando >= hoy`
- Verifica que no exista informe para hoy
- Crea copia automática con:
  - `es_auto_generado = true`
  - `informe_padre_id = id del original`
  - Estado = "sometido" (auto-generado sale ya sometido)

### 4. **Endpoint para cron job**
Archivo: `app/api/cron/replicate-daily-reports/route.ts`

Endpoint: `POST /api/cron/replicate-daily-reports`
Requiere: Header `Authorization: Bearer <CRON_SECRET>`

Respuesta:
```json
{
  "success": true,
  "message": "Replicados X informes de tratamiento",
  "replicated": X,
  "timestamp": "2026-02-23T12:00:00Z"
}
```

### 5. **Actualización de vistas**
- **Tabla de informes:** Columna nueva "Hasta cuándo" + badge "⚙️ auto"
- **Página de detalle:** Sección "Duración del Tratamiento" + indicador de auto-generación

---

## 🔧 Configuración del Cron Job

### Opción 1: Vercel Cron (Recomendado)
Archivo: `vercel.json`
```json
{
  "crons": [{
    "path": "/api/cron/replicate-daily-reports",
    "schedule": "0 0 * * *"
  }]
}
```

### Opción 2: External Cron (ej: EasyCron, AWS EventBridge)
```
URL: https://tu-domain.com/api/cron/replicate-daily-reports
Method: POST
Headers: Authorization: Bearer <CRON_SECRET>
Schedule: Diariamente a las 00:00 UTC
```

### Configurar variable de entorno
Archivo: `.env.local`
```
CRON_SECRET=your-secure-random-secret-here
```

---

## 📋 Flujo Completo (Art. 811d)

### Día 1 (Lunes)
```
1. Vet Autorizado crea informe
   - Medicamento: Phenylbutazone
   - Fecha: 24/02/2025
   - Hasta cuándo: 28/02/2025
   - Estado: borrador
   
2. Vet somete: estado = "sometido"
```

### Día 2-5 (Martes-Viernes) — AUTOMÁTICO
```
Cron job (medianoche):
1. Busca informes "borrador" con hasta_cuando >= hoy
2. Verifica: ¿existe informe para 25/02 para Phenylbutazone + caballo X?
   → NO existe
3. Crea copia automática:
   - Fecha: 25/02/2025
   - Hasta cuándo: 28/02/2025
   - es_auto_generado: true
   - informe_padre_id: <ID del informe del lunes>
   - Estado: sometido (sale ya sometido)

4. Se repite para 26/02, 27/02, 28/02
```

### Resultado
Secretaría ve 5 informes en la tabla:
```
24/02 - Phenylbutazone - Hasta 28/02 - Sometido (manual)
25/02 - Phenylbutazone - Hasta 28/02 - Sometido (⚙️ auto)
26/02 - Phenylbutazone - Hasta 28/02 - Sometido (⚙️ auto)
27/02 - Phenylbutazone - Hasta 28/02 - Sometido (⚙️ auto)
28/02 - Phenylbutazone - Hasta 28/02 - Sometido (⚙️ auto)
```

---

## ✨ Ventajas

✅ **Cumplimiento regulatorio:** Art. 811d implementado completamente
✅ **Automatización:** Vet Autorizado no necesita acordarse de someter diariamente
✅ **Auditoría:** Registro completo de cada día administrado
✅ **Transparencia:** Secretaría ve todo el historial
✅ **Escalabilidad:** Funciona para múltiples medicamentos y caballos

---

## 🚀 Testing

### Manual
```bash
# 1. Crear informe en /treatment-reports/new
#    - Hasta cuándo: mañana
#    - Someter

# 2. Llamar endpoint manualmente
curl -X POST http://localhost:3000/api/cron/replicate-daily-reports \
  -H "Authorization: Bearer <CRON_SECRET>"

# 3. Verificar que se creó nuevo informe en /treatment-reports
#    - Estado: submitido
#    - es_auto_generado: true
```

### Verificar logs
Endpoint retorna:
```json
{ "replicated": 1, "timestamp": "..." }
```

---

## 📝 Notas

- Los informes auto-generados salen ya en estado "sometido" (no "borrador")
- El campo `informe_padre_id` permite rastrear el linaje
- La replicación ocurre en medianoche UTC
- Si un informe se radica antes de hasta_cuando, la replicación se detiene automáticamente
