# VetTrack — Estructura del Proyecto

Sistema interno de registro médico veterinario del Hipódromo Camarero, Puerto Rico.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router) + React 19 |
| Styling | Tailwind v4 (`@tailwindcss/postcss`) |
| UI Components | `@base-ui/react` (headless) + shadcn/ui |
| Base de datos | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password, SSR cookies) |
| Storage | Supabase Storage (`med-attachments` bucket) |
| Deploy | Vercel |
| Scraping | cheerio (sync de caballos desde web del hipódromo) |

---

## Árbol de archivos

```
vet_next/
├── app/
│   ├── layout.tsx                        # Root: fuentes Geist + Dela Gothic, Sonner provider
│   ├── page.tsx                          # Redirige a /dashboard
│   ├── (auth)/
│   │   └── login/
│   │       ├── page.tsx                  # Login: split layout (panel marca + formulario)
│   │       └── login-form.tsx            # Formulario email/password (client component)
│   └── (protected)/
│       ├── layout.tsx                    # Requiere auth, monta Navbar
│       ├── dashboard/
│       │   └── page.tsx                  # Stats generales, vetlist activa, meds recientes
│       ├── horses/
│       │   ├── page.tsx                  # Lista de caballos con búsqueda y SyncButton
│       │   ├── new/
│       │   │   └── page.tsx              # Formulario de nuevo caballo (ruta huérfana — botón removido)
│       │   └── [id]/
│       │       └── page.tsx              # Detalle: info, timeline médico, modals de acción
│       ├── reports/
│       │   ├── page.tsx                  # Índice de reportes
│       │   ├── medications/page.tsx      # Reporte de medicamentos (filtros + tabla)
│       │   ├── vetlist/page.tsx          # Reporte de vetlist
│       │   └── euthanasia/page.tsx       # Reporte de eutanasias
│       └── admin/
│           ├── page.tsx                  # Gestión de catalog_items (med_type, dose)
│           ├── drugs/page.tsx            # CRUD de fármacos
│           └── users/page.tsx            # Gestión de usuarios y permisos
│
├── components/
│   ├── layout/
│   │   └── navbar.tsx                    # Nav responsive, avatar, logout, mobile menu
│   ├── horses/
│   │   ├── horse-actions.tsx             # Gestiona apertura de modals, banner vetlist
│   │   ├── medication-modal.tsx          # Modal: cascade Categoría→Medicamento→Unidad, vía admin, propósito
│   │   ├── vetlist-modal.tsx             # Modal: agregar a vetlist
│   │   ├── vetlist-release-modal.tsx     # Modal: liberar de vetlist
│   │   ├── euthanasia-modal.tsx          # Modal: registrar eutanasia
│   │   └── sync-button.tsx              # Botón para sincronizar caballos desde web externa
│   ├── admin/
│   │   ├── admin-tabs.tsx               # Tabs de navegación de admin
│   │   ├── drug-manager.tsx             # CRUD de fármacos
│   │   ├── create-user-modal.tsx        # Modal de creación de usuarios
│   │   └── confirm-delete-button.tsx    # Botón de eliminación con confirmación
│   └── ui/                              # shadcn/ui: Badge, Button, Card, Dialog, Input,
│                                        # Label, Select, Separator, Sheet, Skeleton,
│                                        # Sonner, Table, Tabs, Textarea
│
├── lib/
│   ├── actions/
│   │   ├── medications.ts               # createMedication, deleteMedication
│   │   ├── vetlist.ts                   # createVetlistEntry, releaseVetlistEntry
│   │   ├── euthanasia.ts                # createEuthanasia (role-gated)
│   │   ├── horses.ts                    # createHorse
│   │   ├── sync.ts                      # syncHorses (scraping + upsert)
│   │   └── admin.ts                     # CRUD catalog, drugs, users, roles
│   ├── supabase/
│   │   ├── server.ts                    # Cliente Supabase SSR (cookies)
│   │   ├── client.ts                    # Cliente Supabase browser
│   │   └── admin.ts                     # Cliente con service role key
│   ├── auth.ts                          # requireUser, isAdmin, canRegisterEuthanasia
│   ├── types.ts                         # Interfaces: Horse, Medication, VetlistEntry, Drug, Profile...
│   ├── constants.ts                     # ADMIN_EMAIL, MOTIVOS_VETLIST, STATUS_LABEL, etc.
│   └── utils.ts                         # cn() para merge de clases Tailwind
│
└── public/
    ├── logo-horizontal-blanco.svg       # Logo horizontal (desktop)
    └── logo-stacked-blanco.svg          # Logo apilado (mobile)
```

---

## Tablas Supabase

| Tabla | Columnas clave | Propósito |
|-------|---------------|-----------|
| `horses` | id, name, color, status, registration, owner, trainer, birth_date, microchip, gender, last_seen_at | Inventario equino |
| `medications` | id, horse_id, vet_name, **type** (vía admin), **proposito**, drug, dose, notes, administered_at, drug_categoria, withdrawal_time_horas, detection_time_horas, tipo_restriccion, attachment_url | Registros de medicación |
| `vetlist` | id, horse_id, motivo, fecha_ingreso, fecha_egreso, fecha_inicio/fin_descanso, vet_ingreso/egreso, resultado_examen, condiciones_post | Caballos en clínica |
| `euthanasia` | id, horse_id, vet_name, fecha, motivo, propietario_notificado, attachment_url | Registros de eutanasia |
| `drugs` | id, nombre, nombre_comercial, categoria, dosis_ruta, withdrawal_time_horas, detection_time_horas, tipo_restriccion, notas, active | Catálogo de fármacos |
| `catalog_items` | id, category (med_type / dose), name, active, sort_order | Opciones de dropdowns |
| `profiles` | id, email, first_name, last_name | Perfiles de usuario |
| `user_roles` | id, user_id, role (euthanasia), granted_by | Permisos especiales |

**Storage bucket:** `med-attachments` — PDFs/imágenes de meds, vetlist y eutanasias.

---

## Flujo de datos principal

```
Browser (Server Component)
  └── requireUser() → Supabase SSR client
      ├── horses/[id]/page.tsx
      │   ├── supabase.from('medications')
      │   ├── supabase.from('vetlist')
      │   ├── supabase.from('drugs')   ← para el modal
      │   └── HorseActions (Client Component)
      │       └── MedicationModal
      │           └── createMedication() [Server Action]
      │               ├── supabase.storage.upload()
      │               └── supabase.from('medications').insert()
      └── sync.ts
          ├── fetch(hipódromo_url)
          ├── cheerio.load(html)
          └── supabase.from('horses').upsert()
```

---

## Roles y permisos

| Rol | Acceso |
|-----|--------|
| Usuario autenticado | Ver caballos, registrar meds, crear/liberar vetlist |
| Admin (`ADMIN_EMAIL`) | Todo lo anterior + CRUD drugs/users/catalog, eliminar meds |
| Rol `euthanasia` | Registrar eutanasias (grant/revoke desde admin/users) |

---

## Variables de entorno

| Variable | Tipo | Uso |
|----------|------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | Pública | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Pública | Anon key para cliente browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Secreta | Admin client (solo server) |

---

## Estado de features

### Implementado
- [x] Inventario de caballos con estados y badge de color
- [x] Sync automático desde web del hipódromo
- [x] Modal de medicamentos: cascade Categoría → Medicamento → Unidad (auto-inferida), Vía de administración, Propósito
- [x] Compliance panel: withdrawal time, detection time, tipo de restricción por fármaco
- [x] Vetlist: agregar con motivo + descanso, liberar con resultado del examen
- [x] Eutanasia con control de permisos y adjuntos
- [x] Catálogo de fármacos (admin)
- [x] Gestión de usuarios y permisos (admin)
- [x] Reportes: medicamentos, vetlist, eutanasias
- [x] Adjuntos PDF/imagen en meds, vetlist y eutanasia
- [x] Modales responsive (grid col-1 en mobile, col-2 en sm+)

### Pendiente
- [ ] Mostrar `proposito` y vía de administración en el timeline del caballo
- [ ] Columna y filtro `proposito` en el reporte de medicamentos
- [ ] Página de perfil de usuario (cambiar nombre/contraseña)
- [ ] Dashboard con alertas de compliance (withdrawal time próximo a vencer)
- [ ] Eliminar o restringir ruta `/horses/new` (botón removido, ruta sigue accesible)

---

## Scripts

```bash
npm run dev    # Desarrollo local
npm run build  # Build de producción
npm run start  # Servidor de producción
npm run lint   # ESLint
```
