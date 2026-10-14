# Implementación: Art. 811d — Tratamientos de dosificación diaria

## Diseño actual

Un tratamiento de varios días es **un solo informe**. Cada medicamento indica su frecuencia:

- **Dosis única** (por defecto): comportamiento de siempre.
- **Diaria**: aparece el campo "Hasta cuándo" (`treatment_report_medications.hasta_cuando`). Se asume una dosis por día, a la hora del informe, desde `fecha_tratamiento` hasta `hasta_cuando` inclusive. No se registra cada dosis.

Reglas:
- `hasta_cuando` >= `fecha_tratamiento` y como máximo 30 días en total (`MAX_COURSE_DAYS` en `lib/treatment-course.ts`). Se valida en el formulario y en el servidor (`lib/actions/treatment-reports.ts`).
- Si `hasta_cuando` coincide con el día de inicio se guarda `null` (dosis única).
- Los días se calculan al leer (`courseDays`, `courseDates`); no se guardan filas por día ni se generan copias.
- El fin de la restricción se cuenta desde la **última dosis**: `restrictionEnd()` = (`hasta_cuando` o `fecha_tratamiento`) + hora + `tiempo_restriccion` horas.

Dónde se ve: formulario (selector Frecuencia), detalle del informe, lista de informes, ficha del caballo (una sola tarjeta por curso), revisiones, reporte de medicamentos (pantalla y Excel) y PDF.

## Replicación diaria retirada

El diseño anterior copiaba el informe cada día con un cron (`replicateDailyTreatmentReports` y `/api/cron/replicate-daily-reports`). Nunca se ejecutó en producción (0 informes auto-generados) y habría clonado todos los borradores indefinidamente, por lo que se eliminó. Las columnas `es_auto_generado`, `informe_padre_id` y la tabla `treatment_reports_replication_log` siguen en la base sin uso.

## Pendiente

- Confirmar con el reglamento si se exige un documento separado por día. De ser así, el PDF podría imprimir una página por fecha del rango (`courseDates`) desde el mismo registro.
- Registro de dosis administradas por día y recordatorios (fuera de alcance por ahora).
