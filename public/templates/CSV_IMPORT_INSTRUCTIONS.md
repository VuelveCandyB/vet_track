# Guía de Importación CSV — Race Day Setup

## Descripción General

El archivo CSV permite al Veterinario Oficial cargar la lista de caballos que competirán en un día de carreras específico. El sistema automáticamente:

1. **Hace match** de los caballos del CSV con los que ya existen en la base de datos
2. **Identifica caballos sangradores** (en LOES) que requieren PMF
3. **Flagea registros sin match** para asignación manual

---

## Columnas Requeridas

| Columna | Tipo | Obligatorio | Ejemplo | Notas |
|---------|------|------------|---------|-------|
| `horse_name` | Texto | ✅ Sí | `THUNDERBOLT` | Nombre del caballo (mayúsculas) |
| `horse_id` | Texto/Número | ✅ Sí | `840003123456789` | Microchip o número de tatoo — **campo de match principal** |
| `race_number` | Número | ✅ Sí | `7` | Número de carrera en el programa del día |
| `post_time` | Hora | ✅ Sí | `14:30` | Hora de salida en formato HH:MM (24h) |
| `trainer` | Texto | ⚪ Opcional | `García José` | Nombre del entrenador |
| `owner` | Texto | ⚪ Opcional | `Rivera Stables` | Nombre del dueño o establo |

---

## Estrategia de Matching

El sistema intenta vincular cada fila del CSV con un caballo existente en la BD:

### Paso 1: Búsqueda Exacta por Microchip
- Busca: `horses.microchip = horse_id` (valor exacto)
- Si encuentra: ✅ **MATCHED** — vinculación completada

### Paso 2: Búsqueda por Nombre (Fallback)
- Busca: `UPPER(horses.name) = UPPER(horse_name)` 
- Si encuentra: ✅ **MATCHED** — vinculación completada

### Paso 3: Sin Match
- Si no hay coincidencia: ⚠️ **UNMATCHED** — badge rojo en UI
- El Vet Oficial debe asignarlo manualmente

---

## Formato Técnico

- **Separador:** coma (`,`)
- **Encoding:** UTF-8
- **Saltos de línea:** LF (`\n`) o CRLF (`\r\n`)
- **Encabezado:** primera línea DEBE contener exactamente los nombres de las columnas
- **Sin espacios** en nombres de columna

### ✅ Correcto
```csv
horse_name,horse_id,race_number,post_time,trainer,owner
THUNDERBOLT,840003123456789,7,14:30,García José,Rivera Stables
```

### ❌ Incorrecto
```csv
horse name, horse id, race number, post time, trainer, owner
THUNDERBOLT, 840003123456789, 7, 14:30, García José, Rivera Stables
```

---

## Cómo Preparar tu CSV

### Opción 1: Desde Equibase (Recomendado)
1. Abre Equibase → "Exportar Carreras del Día"
2. Selecciona la fecha
3. Exporta como CSV
4. El sistema detectará automáticamente el formato

### Opción 2: Desde Excel / Google Sheets
1. Crea una hoja con las 6 columnas (arriba)
2. Llena los datos de los caballos
3. **Archivo → Descargar como → CSV**
4. Carga el archivo en el sistema

### Opción 3: Manualmente en Texto
1. Descarga el template: `race_day_import_template.csv`
2. Abre en editor de texto (Notepad, VS Code, etc.)
3. Reemplaza los datos de ejemplo
4. Guarda como `.csv`

---

## Validaciones Aplicadas

El sistema valida automáticamente:

| Validación | Error | Acción |
|-----------|-------|--------|
| Columnas faltantes | CSV malformado | Rechaza el archivo completo |
| `horse_name` vacío | Campo obligatorio | Fila rechazada |
| `horse_id` vacío | Campo obligatorio | Fila rechazada |
| `race_number` vacío | Campo obligatorio | Fila rechazada |
| `post_time` formato inválido | "14:30" es válido, "2:30 PM" no | Fila rechazada |
| Dupilcados (`horse_id` + `race_number` en el mismo día) | Conflicto | Fila rechazada, muestra advertencia |

---

## Después de Importar

Una vez cargado el CSV:

1. **Revisa el Dashboard** (`/race-day/[fecha]`)
2. **Verifica Matching:** 
   - 🟢 Verde = Matched (vinculado con BD)
   - 🔴 Rojo = Unmatched (requiere asignación manual)
3. **Asigna Manualmente:** si hay registros sin match, puedes:
   - Buscar el caballo en la BD
   - Hacer clic "Asignar caballo"
   - Crear nuevo caballo (si es necesario)
4. **Genera PMF:** para caballos en LOES aparecerá el botón "Administrar PMF"

---

## Preguntas Frecuentes

**P: ¿Qué pasa si el CSV tiene caballos que no existen en la BD?**  
R: Se marcan como `UNMATCHED` (badge rojo). Puedes asignarlos manualmente o crearlos nuevos.

**P: ¿Puedo importar el mismo día dos veces?**  
R: No. El sistema reconoce si ya existe un día de carreras con esa fecha y te pregunta si deseas reemplazarlo.

**P: ¿Qué información se usa para el PMF?**  
R: Una vez matched, el sistema usa `post_time` (hora de salida) y verifica si el caballo está en LOES.

**P: ¿Se puede editar después de importar?**  
R: Sí. Puedes cambiar `trainer`, `owner`, y reasignar caballos. `horse_id` y `race_number` son de solo lectura.

**P: ¿Y si el microchip está mal?**  
R: El caballo quedará sin match. Asígnalo manualmente desde el Dashboard.

---

## Soporte

Si encuentras problemas al importar:
1. Verifica que el archivo sea `.csv` (no `.xlsx`)
2. Asegúrate de que el encoding sea UTF-8
3. Revisa que no haya espacios extra en nombres de columna
4. Contacta al soporte técnico con el archivo de error

**Template:** Descarga `race_day_import_template.csv` desde la app como referencia.
