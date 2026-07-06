# Módulo: Veterinario Oficial — Race Day Dashboard + PMF
> Documento de implementación generado desde análisis del Reglamento de Medicación Controlada (Reg. 8760, AIDH, Puerto Rico)
> Llevar a Claude Code como contexto. NO modifica funcionalidad existente — son rutas y modelos nuevos.

---

## Contexto del negocio

El Veterinario Oficial es el funcionario de la Administración de la Industria y el Deporte Hípico (AIDH) responsable de:
1. Ver qué caballos corren cada día
2. Administrar el Furosemide (PMF) a los caballos sangradores inscritos en el Programa
3. Tomar muestras post-carrera
4. Mantener la cadena de custodia de las muestras

Este módulo cubre los puntos 1 y 2 únicamente.

---

## Reglas de negocio críticas (del reglamento)

```
PMF_DOSIS_MIN       = 100   # mg mínimos permitidos (Art. 1408)
PMF_DOSIS_MAX       = 500   # mg máximos permitidos (Art. 1408)
PMF_CC_MIN          = 2     # cc equivalente (100mg)
PMF_CC_MAX          = 10    # cc equivalente (500mg)
PMF_HORAS_ANTES     = 4     # horas mínimas antes de la carrera (Art. 1406)
PMF_PRESENTAR_ANTES = 4.5   # horas para llevar el caballo al Área (Art. 1403)
RX_HORA_LIMITE      = 12    # mediodía — límite para entregar la receta (Art. 1407)
VIA_ADMIN           = "IV"  # siempre intravenosa, no editable (Art. 1408, 1410)
```

### Validaciones que el backend debe ejecutar antes de guardar un PMF:

1. `horse.en_loes == true` — el caballo debe estar en la lista de sangradores
2. `dosis_administrada >= 100 AND dosis_administrada <= 500`
3. `hora_administracion <= hora_carrera - 4h`
4. `hora_entrega_receta < 12:00 PM` del día de retiros y cambios
5. `firma_vet_oficial NOT NULL`
6. `firma_representante NOT NULL`
7. `aguja_desechable_confirmada == true`
8. `dosis_administrada` debe coincidir con `dosis_recetada` (o justificación documentada)

---

## Modelos de datos nuevos

> Añadir a los modelos existentes. NO modificar tablas actuales.

### RaceDay
```
id                  UUID / PK
fecha               DATE          -- único por fecha
hora_retiros        TIME          -- "Hora de Retiros y Cambios" del día
total_carreras      INT
estado              ENUM(borrador, activo, cerrado)
fuente              ENUM(equibase, csv, manual)
creado_por          FK → User
creado_en           DATETIME
```

### Horse (si no existe aún)
```
id                  UUID / PK
nombre              VARCHAR
id_oficial          VARCHAR       -- número de tatoo o chip (único)
en_loes             BOOLEAN DEFAULT false
pmf_activo          BOOLEAN DEFAULT false
entrenador          VARCHAR
dueno               VARCHAR
fecha_ingreso_loes  DATE NULL
tipo_hemorragia     ENUM(epistaxis_unilateral, epistaxis_bilateral, traqueal) NULL
```

### RaceEntry (caballo inscrito en una carrera de un día específico)
```
id                  UUID / PK
race_day_id         FK → RaceDay
horse_id            FK → Horse
num_carrera         INT
hora_salida         TIME
puesto              INT NULL
fuente              ENUM(equibase, manual)   -- de dónde vino el registro
notas               TEXT NULL
```

### PMFRecord (registro de administración de Furosemide)
```
id                  UUID / PK
race_entry_id       FK → RaceEntry

-- Receta (Art. 1407-1408)
vet_autorizado_id   FK → User (o nombre si no está en el sistema)
vet_autorizado_nombre VARCHAR
dosis_recetada      INT           -- en mg
hora_entrega_receta DATETIME      -- debe ser < 12:00 PM del día de retiros

-- Administración (Art. 1406, 1410, 1412)
fecha_admin         DATE          -- automático, no editable
hora_admin          TIME          -- entrada manual del Vet Oficial
dosis_administrada  INT           -- en mg, entre 100 y 500
via_admin           VARCHAR DEFAULT 'IV'  -- siempre IV, no editable
aguja_confirmada    BOOLEAN DEFAULT false

-- Identificación del ejemplar (Art. 1412a)
horse_nombre        VARCHAR       -- snapshot al momento del registro
horse_id_oficial    VARCHAR       -- snapshot al momento del registro

-- Firmas (Art. 1412c)
vet_oficial_id      FK → User
vet_oficial_nombre  VARCHAR       -- nombre en imprenta
firma_vet_oficial   TEXT          -- base64 o referencia a archivo
firma_vet_ts        DATETIME

rep_nombre          VARCHAR       -- dueño/entrenador/mozo presente
firma_representante TEXT          -- base64 o referencia a archivo
firma_rep_ts        DATETIME

-- Observaciones y estado
observaciones       TEXT NULL
estado              ENUM(borrador, certificado, distribuido)
certificado_en      DATETIME NULL

-- Validaciones calculadas (guardar para auditoría)
val_horas_antes     DECIMAL       -- horas de antelación real calculada
val_dosis_ok        BOOLEAN       -- true si 100 <= dosis <= 500
val_rx_tiempo_ok    BOOLEAN       -- true si receta llegó antes del mediodía
val_coincide_dosis  BOOLEAN       -- true si dosis admin == dosis recetada
```

### LOESRecord (certificación de sangrador — solo primera vez)
```
id                  UUID / PK
horse_id            FK → Horse
fecha_certificacion DATE
tipo_hemorragia     ENUM(epistaxis_unilateral, epistaxis_bilateral, traqueal)
firma_vet_oficial   TEXT
firma_vet_autorizado TEXT
vet_oficial_id      FK → User
vet_autorizado_nombre VARCHAR
notas               TEXT NULL
```

---

## Rutas nuevas (añadir sin tocar rutas existentes)

```
GET  /race-day                        → lista de días (calendario)
GET  /race-day/:fecha                 → Race Day Dashboard del día
POST /race-day/:fecha/sync            → sync desde Equibase o re-parsear CSV
POST /race-day/:fecha/horse           → añadir caballo manual al día

GET  /horse/:id                       → perfil del caballo
GET  /horse/:id/pmf                   → historial de PMF del caballo
POST /horse/:id/pmf                   → crear nuevo registro PMF
GET  /horse/:id/pmf/:pmf_id           → ver registro PMF específico
PATCH /horse/:id/pmf/:pmf_id          → actualizar borrador PMF
POST /horse/:id/pmf/:pmf_id/certify   → certificar y distribuir copias

POST /horse/:id/loes                  → registrar ingreso a LOES
```

---

## Pantallas nuevas

### 1. Race Day Dashboard (`/race-day/:fecha`)
**Propósito:** Vista principal del Vet Oficial para el día de carreras.

**Componentes:**
- Date picker / navegación de días (flechas prev/next)
- 4 KPI cards: total corredores, en LOES/PMF, PMF administrado, pendientes PMF
- Chip con cuenta regresiva a la Hora de Retiros y Cambios (se pone rojo si < 1h)
- Lista de caballos ordenada por urgencia:
  - Primero: PMF pendiente y urgente (rojo)
  - Segundo: PMF pendiente con tiempo (ámbar)
  - Tercero: PMF ya administrado (verde)
  - Último: sin medicación (gris)
- Botón "Sync Equibase" — refresca la lista
- Botón "Añadir caballo" — formulario manual

**Lógica de tiempo crítica:**
```
limite_pmf = hora_salida_carrera - 4 horas
estado_urgencia:
  ROJO   → ahora > limite_pmf - 30min
  AMBAR  → ahora entre limite_pmf - 2h y limite_pmf - 30min
  VERDE  → pmf ya registrado y certificado
```

### 2. Formulario PMF (`/horse/:id/pmf/new`)
**Propósito:** Registro completo de administración de Furosemide.

**Secciones (en orden):**
1. Identificación del ejemplar (nombre, ID oficial, carrera, hora salida, límite calculado)
2. Receta del vet autorizado (quién recetó, hora de entrega, dosis recetada con slider 100-500mg)
3. Datos de administración (fecha auto, hora manual, dosis con slider, confirmación aguja)
4. Firmas (canvas touch para Vet Oficial + canvas touch para representante)

**Comportamiento del botón "Certificar":**
- Deshabilitado hasta que TODAS las validaciones pasen
- Al certificar → estado = 'certificado' → dispara notificaciones a:
  - Secretario de Carreras
  - Oficina del Administrador Hípico
  - Dueño/entrenador del caballo
  (Art. 1002e del reglamento)

### 3. Añadir caballo manual
**Campos:**
- Nombre del caballo (búsqueda primero, crear si no existe)
- Número de identificación oficial
- Número de carrera
- Hora estimada de salida
- Entrenador
- Dueño
- Check: ¿En LOES? → si sí, mostrar check: ¿Solicita PMF?

---

## Carga de caballos — flujo recomendado (primera versión)

```
Sin API de Equibase:
  Secretaría exporta CSV desde Equibase cada mañana
  → Sube el archivo a /race-day/:fecha/sync (multipart/form-data)
  → Backend parsea el CSV y crea/actualiza RaceDay + RaceEntries
  → Vet abre la app y ya ve la lista lista

Con API de Equibase (versión futura):
  El mismo endpoint /sync hace el fetch automático
  → El flujo del Vet no cambia en nada
```

**Campos esperados del CSV de Equibase (mínimo):**
```
horse_name, horse_id, race_number, post_time, trainer, owner
```

---

## Distribución de copias al certificar (Art. 1002e)

Al marcar un PMFRecord como `certificado`, el sistema debe:
1. Generar PDF del registro firmado
2. Enviar copia a: dueño/entrenador
3. Enviar copia a: Secretario de Carreras
4. Enviar copia a: Oficina del Administrador Hípico
5. Adjuntar copia permanente al expediente del caballo

---

## Instrucciones para Claude Code

**Mensaje sugerido para iniciar en Claude Code:**

```
Tengo un proyecto [DESCRIBE TU STACK] casi terminado.
Necesito añadir un módulo nuevo sin tocar lo existente.

El módulo es el "Race Day Dashboard + PMF" para el Veterinario Oficial
de un sistema hípico regulado bajo el Reglamento 8760 de Puerto Rico.

Aquí está el documento de especificación completo:
[PEGAR ESTE DOCUMENTO]

Primero muéstrame la estructura actual de mi proyecto para que
puedas decirme exactamente dónde añadir cada pieza sin romper nada.
```

---

## Notas importantes

- **Todo PMF debe ser IV** — el campo `via_admin` nunca es editable por el usuario
- **Las firmas son legalmente requeridas** — sin ambas firmas no se puede certificar
- **Los snapshots de nombre e ID** en PMFRecord son intencionales — si el caballo cambia datos, el registro histórico queda íntegro
- **Los timestamps de firma** deben registrarse en el servidor, no en el cliente
- **La dosis en cc** es derivada: `cc = mg / 50` (250mg = 5cc). Mostrar ambos en UI pero guardar solo mg
