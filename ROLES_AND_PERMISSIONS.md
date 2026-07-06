# Sistema de Roles y Permisos — VetTrack

## 1. Roles según Reglamento 8760

### Roles Médico-Veterinarios

| Rol | Reglamento | Responsabilidades |
|-----|-----------|-------------------|
| **Veterinario Autorizado** | Art. 801, 811 | Atiende caballos privados, crea informes de tratamiento |
| **Veterinario Oficial** | Art. 801, 802, 811c | Radica informes, supervisa tratamientos, administra Furosemide (PMF) |

### Roles Administrativos

| Rol | Reglamento | Responsabilidades |
|-----|-----------|-------------------|
| **Secretaría de Carreras** | Art. 811c | Recibe informes radicados, mantiene registro oficial |
| **Administrador Hípico** | Art. 706, 706a | Control general, decide políticas |

---

## 2. Estructura Actual en VetTrack

**Lo que existe:**
- `user_roles` tabla con valores: `euthanasia`, `official_vet`
- `isAdmin(email)` función basada en email específico
- `isOfficialVet(userId)` función que verifica rol `official_vet`

**Lo que falta:**
- Rol `authorized_vet` (veterinario autorizado)
- Rol `secretary` (secretaría)
- Rol `director` (director de servicios médico-veterinarios)
- Función `canManageUsers()` para admin
- Función `isSecretary()` para secretaría

---

## 3. Permisos por Rol (Fase 1 — Art. 811)

### Veterinario Autorizado
```
✅ Crear informe de tratamiento
✅ Ver sus propios informes
❌ Ver informes de otros vets
❌ Radicar informes
❌ Modificar informes radicados
```

### Veterinario Oficial
```
✅ Ver TODOS los informes (sometidos y radicados)
✅ Radicar informes (estado: sometido → radicado)
✅ Editar informes aún no radicados
❌ Crear informes (solo vets autorizados)
❌ Eliminar informes
```

### Secretaría
```
✅ Ver SOLO informes radicados
✅ Descargar/imprimir informes
✅ Generar reportes
❌ Radicar (lo hace el Vet Oficial)
❌ Crear informes
❌ Modificar informes
```

### Personal de Eutanasia
```
✅ Ver Dashboard
✅ Ver listado de Caballos
✅ Acceso al botón/módulo Eutanasia
✅ Ver Reportes de Eutanasia
❌ TODO lo demás (sin acceso a Informes, Medicinas, Admin, etc.)
```

### Administrador Hípico
```
✅ Acceso total (gestor de usuarios, catálogos, etc.)
✅ Gestionar roles
✅ Auditoría de cambios
```

---

## 4. Implementación en BD

### Tabla: `user_roles`

```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP DEFAULT now(),
  active BOOLEAN DEFAULT true,
  UNIQUE(user_id, role)
);
```

### Roles válidos (mutuamente excluyentes — radio button):

```
- 'authorized_vet'      → Veterinario Autorizado
  Ve: Dashboard, Caballos, Crear Informes (Art. 811)
  
- 'official_vet'        → Veterinario Oficial
  Ve: Dashboard, Caballos, TODOS los Informes, Radicar
  
- 'secretary'           → Personal de Secretaría
  Ve: Dashboard, SOLO Informes Radicados, Generar Reportes
  
- 'euthanasia'          → Personal de Eutanasia
  Ve: SOLO Dashboard, Caballos, Botón Eutanasia (menú reducido)
  
- 'admin'               → Administrador Hípico
  Ve: TODO (admin panel, gestión de usuarios, catálogos, etc.)
```

**Nota:** Un usuario tiene exactamente UN rol. No es posible tener múltiples roles simultáneamente.

---

## 5. Funciones de Auth (`lib/auth.ts`)

```typescript
// Existe
export function isAdmin(email: string): boolean

// Existe
export async function isOfficialVet(userId: string, email: string): boolean

// AGREGAR
export async function isAuthorizedVet(userId: string, email: string): boolean

// AGREGAR
export async function isSecretary(userId: string, email: string): boolean


// AGREGAR (helper)
export async function getUserRoles(userId: string): Promise<string[]>

// AGREGAR (helper)
export async function grantRole(userId: string, role: string, grantedBy: string): Promise<void>

// AGREGAR (helper)
export async function revokeRole(userId: string, role: string): Promise<void>
```

---

## 6. Aplicación en Vistas

### `/treatment-reports` (Listado)

| Rol | Ve columnas | Ve botones |
|-----|------------|-----------|
| **Authorized Vet** | Solo sus informes | Crear |
| **Official Vet / Director** | Todos | Radicar |
| **Secretary** | Solo radicados | Descargar |
| **Admin** | Todos | Radicar + Gestionar |

### `/treatment-reports/[id]` (Detalle)

| Rol | Puede ver | Puede editar | Puede radicar |
|-----|-----------|-------------|---------------|
| **Authorized Vet** | Si es suyo | Si no radicado | ❌ |
| **Official Vet / Director** | Todos | Si no radicado | ✅ |
| **Secretary** | Si radicado | ❌ | ❌ |
| **Admin** | Todos | Si no radicado | ✅ |

### `/admin/users` (Gestión de usuarios)

**Solo Admin puede:**
- Crear usuarios
- Asignar/revocar roles
- Ver auditoría de cambios

---

## 7. Pending Implementation

- [ ] Migración SQL: agregar roles `authorized_vet`, `secretary`, `director`
- [ ] Funciones de auth: implementar todas las listadas en sección 5
- [ ] Actualizar `/treatment-reports/page.tsx` para usar roles en lugar de `isAdmin`
- [ ] Actualizar `/treatment-reports/[id]/page.tsx` para permisos por rol
- [ ] Documentar flujo de creación de usuarios con roles
- [ ] Tests de permisos por rol

---

## 8. Notas

- Un usuario puede tener **múltiples roles** (ej: Vet Oficial + Director)
- Admin hereda todos los permisos
- Email `ADMIN_EMAIL` definido en `CLAUDE.md` es super-admin
- Los roles se almacenan en `user_roles`, no en tabla `users`

