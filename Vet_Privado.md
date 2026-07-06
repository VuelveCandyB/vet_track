# CLAUDE.md — Contexto del Proyecto + Módulo Nuevo a Implementar

## Stack actual
- Next.js 16 (App Router)
- Supabase (PostgreSQL — sin Prisma, queries directas con supabase-js)
- Tailwind v4 + shadcn/ui
- Tema: warm professional light (en proceso de migración)

## Modelos existentes en Supabase (NO tocar)

| Tabla | Descripción |
|-------|-------------|
| `horses` | Entidad principal — status: active/rest/injury/deceased |
| `medications` | Medicamentos con tiempos de retiro |
| `vetlist` | Registros de visitas veterinarias (ingreso/egreso) |
| `euthanasia` | Registros de eutanasia |
| `diagnosticos` | Diagnósticos clínicos |
| `drugs` | Base de datos maestra de drogas con restricciones |

---

## Contexto regulatorio

Este sistema opera bajo el **Reglamento de Medicación Controlada 8760**
de la Administración de la Industria y el Deporte Hípico (AIDH) de Puerto Rico.

Hay dos tipos de veterinario en el sistema:
- **Veterinario Autorizado** (privado) — trata los caballos, somete informes
- **Veterinario Oficial** (de la AIDH) — recibe informes, administra PMF, toma muestras

---

## Módulo nuevo #1 — Informe de Tratamiento (Art. 811)
> Para el Veterinario Autorizado (privado). Conecta con lo ya existente.

### Qué dice el reglamento (Art. 811)
- El Vet Autorizado tiene **24 horas** para someter un informe de cualquier tratamiento
- El informe llega al Director de Servicios Médico-Veterinarios o al **Vet Oficial de turno**
- Debe radicarse en Secretaría de Carreras **antes de la Hora de Retiros y Cambios**
- Se requiere una hoja de tratamiento **por cada día** que se administre el medicamento
- Aplica a cualquier medicamento **excepto** el Furosemide del PMF

### Campos obligatorios del informe (Art. 811b)
```
horse_id              → FK a horses (ya existe)
establo               → nombre del establo
diagnostico           → condición o diagnóstico
drug_id               → FK a drugs (ya existe)
fecha_tratamiento     → DATE
hora_tratamiento      → TIME
dosis_administrada    → DECIMAL
dosis_unidad          → VARCHAR (mg, cc, ml)
nivel_dosificacion    → VARCHAR
tiempo_restriccion    → INT (días que no puede competir)
fecha_fin_tratamiento → DATE (hasta cuándo dura)
vet_autorizado_id     → FK a users/veterinarios
notas                 → TEXT NULL
estado                → ENUM: borrador | sometido | radicado
```

### Tabla nueva sugerida: `treatment_reports`
```sql
create table treatment_reports (
  id                   uuid primary key default gen_random_uuid(),
  horse_id             uuid references horses(id) not null,
  drug_id              uuid references drugs(id) not null,
  establo              varchar not null,
  diagnostico          text not null,
  fecha_tratamiento    date not null,
  hora_tratamiento     time not null,
  dosis_administrada   decimal not null,
  dosis_unidad         varchar not null default 'mg',
  nivel_dosificacion   varchar,
  tiempo_restriccion   int not null,        -- días sin competir
  fecha_fin_tratamiento date not null,
  vet_autorizado_nombre varchar not null,
  notas                text,
  estado               varchar not null default 'borrador',
  -- estado: borrador | sometido | radicado
  creado_en            timestamptz default now(),
  sometido_en          timestamptz,
  radicado_en          timestamptz
);
```

### Cómo conecta con lo existente
- Reutiliza `horses` — el selector de caballos ya existe
- Reutiliza `drugs` — la base de drogas ya existe, incluye `tiempo_retiro`
- Reutiliza `diagnosticos` — puede precargar el diagnóstico si ya hay uno
- Es un **paso nuevo** después del flujo de `vetlist` (visita) → ahora también genera `treatment_reports`

### Regla de negocio importante
```
Si drug.tiene_restriccion == true:
  tiempo_restriccion es obligatorio y no puede ser 0
  fecha_fin_tratamiento = fecha_tratamiento + tiempo_restriccion (días)
  El caballo no puede inscribirse en carrera hasta fecha_fin_tratamiento
```

### Rutas nuevas (App Router)
```
app/treatment-reports/
  page.tsx              → lista de informes (con filtros: pendientes, sometidos)
  new/page.tsx          → formulario nuevo informe
  [id]/page.tsx         → ver informe individual
  [id]/edit/page.tsx    → editar borrador
```

### Flujo UX sugerido
```
1. Vet crea el informe → estado: borrador
2. Revisa y somete → estado: sometido (timestamp sometido_en)
3. Vet Oficial lo radica en Secretaría → estado: radicado (timestamp radicado_en)
```

---

## Módulo nuevo #2 — Race Day Dashboard + PMF (Art. 1406-1412)
> Para el Veterinario Oficial. Módulo completamente nuevo.

### Qué es el PMF
Programa de Medicación con Furosemide — única medicación permitida
antes de una carrera, solo para caballos sangradores (en LOES).

### Reglas críticas (del reglamento)
```
PMF_DOSIS_MIN       = 100      -- mg (Art. 1408)
PMF_DOSIS_MAX       = 500      -- mg (Art. 1408)
PMF_HORAS_ANTES     = 4        -- horas mínimas antes de la carrera (Art. 1406)
PMF_PRESENTAR_ANTES = 4.5      -- horas para llevar el caballo (Art. 1403)
RX_HORA_LIMITE      = '12:00'  -- mediodía, límite para entregar receta (Art. 1407)
VIA_ADMIN           = 'IV'     -- siempre intravenosa, campo no editable (Art. 1410)
```

### Tablas nuevas sugeridas

```sql
-- Caballos habilitados a correr en un día específico
create table race_days (
  id               uuid primary key default gen_random_uuid(),
  fecha            date not null unique,
  hora_retiros     time not null,   -- Hora de Retiros y Cambios
  total_carreras   int,
  estado           varchar default 'activo',
  fuente           varchar default 'manual', -- manual | csv | equibase
  creado_en        timestamptz default now()
);

-- Inscripción de un caballo en una carrera de un día
create table race_entries (
  id               uuid primary key default gen_random_uuid(),
  race_day_id      uuid references race_days(id) not null,
  horse_id         uuid references horses(id) not null,
  num_carrera      int not null,
  hora_salida      time not null,
  puesto           int,
  fuente           varchar default 'manual',
  notas            text
);

-- Registro de administración de Furosemide
create table pmf_records (
  id                    uuid primary key default gen_random_uuid(),
  race_entry_id         uuid references race_entries(id) not null,

  -- Receta (Art. 1407-1408)
  vet_autorizado_nombre varchar not null,
  dosis_recetada        int not null,
  hora_entrega_receta   timestamptz not null,

  -- Administración (Art. 1406, 1410, 1412b)
  fecha_admin           date not null,
  hora_admin            time not null,
  dosis_administrada    int not null check (dosis_administrada between 100 and 500),
  via_admin             varchar not null default 'IV',
  aguja_confirmada      boolean not null default false,

  -- Snapshots del ejemplar al momento del registro (Art. 1412a)
  horse_nombre          varchar not null,
  horse_id_oficial      varchar not null,

  -- Firmas (Art. 1412c)
  vet_oficial_nombre    varchar not null,
  firma_vet_oficial     text,
  firma_vet_ts          timestamptz,
  rep_nombre            varchar not null,
  firma_representante   text,
  firma_rep_ts          timestamptz,

  -- Estado y auditoría
  observaciones         text,
  estado                varchar default 'borrador',
  -- estado: borrador | certificado | distribuido
  certificado_en        timestamptz,

  -- Validaciones guardadas para auditoría
  val_horas_antes       decimal,
  val_dosis_ok          boolean,
  val_rx_tiempo_ok      boolean
);

-- Añadir columnas a horses (si no existen)
alter table horses add column if not exists en_loes boolean default false;
alter table horses add column if not exists pmf_activo boolean default false;
alter table horses add column if not exists fecha_ingreso_loes date;
alter table horses add column if not exists tipo_hemorragia varchar;
-- tipo_hemorragia: epistaxis_unilateral | epistaxis_bilateral | traqueal
```

### Rutas nuevas (App Router)
```
app/race-day/
  page.tsx                        → calendario / lista de días
  [fecha]/page.tsx                → Race Day Dashboard
  [fecha]/add-horse/page.tsx      → añadir caballo manual

app/race-day/[fecha]/horse/[id]/
  pmf/new/page.tsx                → formulario PMF completo
  pmf/[pmfId]/page.tsx            → ver registro PMF
```

### Componentes nuevos sugeridos
```
components/race-day/
  DayHeader.tsx          → fecha + hora retiros + countdown chip
  HorseList.tsx          → lista ordenada por urgencia PMF
  HorseRow.tsx           → fila individual con badges LOES/PMF/estado
  KpiCards.tsx           → 4 cards (total, LOES, administrado, pendiente)
  AddHorseModal.tsx      → formulario añadir caballo manual

components/pmf/
  PmfForm.tsx            → formulario completo 4 secciones
  DoseSlider.tsx         → slider 100-500mg con validación
  SignatureBox.tsx       → canvas táctil para firmas
  TimeValidator.tsx      → chip que muestra si cumple las 4 horas
```

### Carga de caballos (primera versión sin API Equibase)
```
POST /api/race-day/[fecha]/sync
  → acepta multipart/form-data con CSV
  → parsea campos: horse_name, horse_id, race_number, post_time, trainer, owner
  → crea o actualiza race_day + race_entries
  → responde con { created, updated, errors }
```

### Al certificar un PMF — distribución de copias (Art. 1002e)
```
1. Generar PDF del registro firmado
2. Notificar a: dueño/entrenador del caballo
3. Notificar a: Secretario de Carreras
4. Notificar a: Oficina del Administrador Hípico
5. Adjuntar al expediente permanente del caballo
```

---

## Orden de implementación recomendado

```
Fase 1 — Lo que conecta con lo ya existente (más rápido de implementar)
  1. Añadir columnas en_loes, pmf_activo a tabla horses
  2. Crear tabla treatment_reports (Art. 811)
  3. Formulario de informe de tratamiento (conecta con horses + drugs)
  4. Lista de informes pendientes / sometidos

Fase 2 — Módulo Race Day
  5. Crear tablas race_days + race_entries
  6. Race Day Dashboard con carga manual de caballos
  7. Endpoint de sync CSV

Fase 3 — PMF completo
  8. Crear tabla pmf_records
  9. Formulario PMF con validaciones y firmas
 10. Distribución de copias al certificar
```

---

## Convenciones del proyecto (mantener consistencia)

- Queries: `supabase.from('tabla').select(...)` — sin Prisma
- Componentes UI: shadcn/ui — usar los que ya existen en el proyecto
- Estilos: Tailwind v4 — warm professional light theme
- Rutas: App Router de Next.js 16 — carpetas en `app/`
- Idioma del código: inglés para variables/funciones, español para labels de UI
- UUIDs para todos los IDs primarios

---

## Instrucción para Claude Code

Antes de crear cualquier archivo:
1. Lee la estructura actual de `app/` para no duplicar rutas
2. Lee los componentes existentes en `components/` para reutilizar
3. Revisa las queries de Supabase existentes para mantener el mismo patrón
4. Pregunta si no estás seguro de cómo está implementado algo — no asumas

Empieza siempre por la **Fase 1** a menos que se indique lo contrario.
