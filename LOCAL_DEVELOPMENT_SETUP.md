# 🚀 Setup: Ambiente Local de Pruebas

Este documento describe cómo configurar y ejecutar VetTrack en tu máquina local con Supabase local.

---

## Requisitos Previos

- Node.js 18+ 
- npm o yarn
- Git
- Docker (opcional, pero recomendado para Supabase)

---

## Instalación (Primera vez)

### 1. Instala Supabase CLI

```bash
npm install -g supabase
```

Verifica que está instalado:
```bash
supabase --version
```

### 2. Inicia Supabase local

Desde la raíz del proyecto:

```bash
npx supabase start
```

**Salida esperada:**
```
Started supabase local development server.

API URL: http://localhost:54321
Postgres Connection String: postgresql://postgres:postgres@localhost:54322/postgres
JWT Secret: [auto-generated]
Anon Key: eyJ...
Service Role Key: eyJ...
```

**Guarda estos valores** (especialmente Anon Key y Service Role Key).

### 3. Configura `.env.local` para ambiente local

Copia estas líneas a tu archivo `.env.local`:

```bash
# Supabase Local (Development)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=[pega aquí el Anon Key del paso anterior]
SUPABASE_SERVICE_ROLE_KEY=[pega aquí el Service Role Key del paso anterior]

# Otros (mantén estos igual)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Aplica migraciones a la BD local

```bash
npx supabase migration up
```

Debería aplicar todas las migraciones en `supabase/migrations/`.

### 5. (Opcional) Resetea la BD local

Si necesitas empezar de cero:

```bash
npx supabase db reset
```

Esto ejecuta todas las migraciones nuevamente desde cero.

### 6. Inicia Next.js

```bash
npm run dev
```

Accede en `http://localhost:3000`

---

## Flujo de trabajo diario

### Para empezar sesión de desarrollo:

```bash
# 1. Inicia Supabase local
npx supabase start

# 2. En otra terminal, inicia Next.js
npm run dev

# Accede a http://localhost:3000
```

### Cuando terminas:

```bash
# Detén Supabase
npx supabase stop

# O deja todo corriendo si vas a continuar después
```

---

## Crear un campo nuevo (Workflow de Migraciones)

**IMPORTANTE:** Cada campo nuevo requiere una migración SQL.

### 1. Crear nueva migración

```bash
npx supabase migration new add_descripcion_de_cambio
```

Esto crea un archivo: `supabase/migrations/TIMESTAMP_add_descripcion_de_cambio.sql`

### 2. Escribe el SQL

Edita el archivo creado:

```sql
-- Migration: Add new field to treatment_reports
-- Fecha: 2026-02-23
-- Descripción: Add field for tracking horse age

ALTER TABLE treatment_reports
ADD COLUMN IF NOT EXISTS horse_age_years INT NULL;

CREATE INDEX IF NOT EXISTS idx_treatment_reports_horse_age
ON treatment_reports(horse_age_years);
```

### 3. Aplica la migración localmente

```bash
npx supabase migration up
```

Verifica que no hay errores.

### 4. Prueba en Next.js

Reinicia el servidor si es necesario y prueba el cambio.

### 5. Commitealo

```bash
git add supabase/migrations/TIMESTAMP_add_descripcion_de_cambio.sql
git commit -m "feat: add horse age field to treatment reports"
```

### 6. En producción

Cuando deploys a Vercel/Supabase remoto, la migración se ejecuta automáticamente (o manualmente si es necesario).

---

## Comparar Local vs Remoto

| Aspecto | Local | Remoto (Producción) |
|---------|-------|-------------------|
| **URL** | `http://localhost:54321` | `https://iutzdscrtwdguhamobpu.supabase.co` |
| **Base de datos** | PostgreSQL en tu máquina | PostgreSQL en Supabase |
| **Velocidad** | ⚡ Instantánea | 🌐 Con latencia de red |
| **Datos** | Test data que creas tú | Datos reales de producción |
| **Archivo config** | `.env.local` | Variables en Vercel |

---

## Archivos importantes

```
.env                           ← No edites (valores por defecto)
.env.local                     ← EDITA AQUÍ para local
.env.local.example             ← Referencia de valores
supabase/config.toml           ← Config de Supabase local
supabase/migrations/           ← Todas las migraciones SQL
  ├── TIMESTAMP_001_init.sql
  ├── TIMESTAMP_002_add_horses.sql
  ├── TIMESTAMP_003_add_tratamiento_duracion.sql
  └── ...
```

---

## Troubleshooting

### "Port 54321 is already in use"

Hay otra instancia de Supabase corriendo. Detén todas:

```bash
npx supabase stop --no-backup
```

Luego intenta nuevamente:

```bash
npx supabase start
```

### "Migration failed: column already exists"

Significa que la migración ya fue aplicada. Verifica con:

```bash
npx supabase migration list
```

Si quieres resetear todo:

```bash
npx supabase db reset
```

### No puedo conectar a http://localhost:54321

Asegúrate que:
1. `npx supabase start` está corriendo
2. El puerto 54321 está disponible
3. `.env.local` tiene la URL correcta

Verifica con:

```bash
curl http://localhost:54321/health
```

---

## Comandos útiles

```bash
# Inicia Supabase
npx supabase start

# Detén Supabase
npx supabase stop

# Resetea BD local (elimina todo, re-aplica migraciones)
npx supabase db reset

# Lista todas las migraciones
npx supabase migration list

# Ver logs de Supabase
npx supabase logs

# Accede a Studio (UI visual de la BD)
# Se abre automáticamente en http://localhost:54325
```

---

## Notas importantes

✅ **SEGURO cambiar `.env.local`:**
- No afecta el archivo `.env` en la nube
- No afecta variables en Vercel
- Es solo local en tu máquina

✅ **Migraciones siempre en Git:**
- Commiteá `supabase/migrations/TIMESTAMP_*.sql`
- Estos archivos se aplican automáticamente en producción

❌ **NO hagas:**
- No edites columnas manualmente en Supabase UI local
- No ignores las migraciones SQL
- No copies el archivo `.env.local` a otros lados (es solo tuyo)

---

## Próximos pasos

1. Ejecuta `npx supabase start`
2. Configura `.env.local`
3. Aplica migraciones: `npx supabase migration up`
4. Inicia Next.js: `npm run dev`
5. Accede a `http://localhost:3000`

¡Listo! 🚀
