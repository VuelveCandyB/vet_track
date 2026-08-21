// Central permissions registry — single source of truth for all window/modal access control
// Structure: key = 'area.window_name', value = { role: level }
// Levels: 'view' < 'full' < 'special'
// Admin always has full access (checked separately via isAdmin)

export type Role = 'admin' | 'authorized_vet' | 'official_vet' | 'director' | 'euthanasia' | 'technician'
export type Level = 'view' | 'full' | 'special'

export const PERMISSIONS: Record<string, Partial<Record<Role, Level>>> = {
  // Pages — route access control
  'page.admin': {
    director: 'full',
  },
  'page.horses': {
    authorized_vet: 'view',
    official_vet: 'view',
    director: 'view',
    technician: 'view',
  },
  'page.reports': {
    authorized_vet: 'view',
    official_vet: 'view',
    director: 'view',
    euthanasia: 'view',
  },
  'page.treatment_reports': {
    authorized_vet: 'full',
    official_vet: 'view',
    director: 'view',
  },
  'page.race_day': {
    official_vet: 'view',
    director: 'view',
  },

  // Horses — modals and actions
  'horses.diagnosis_modal': {
    authorized_vet: 'full',
    official_vet: 'full',
    director: 'full',
  },
  'horses.medication_modal': {
    authorized_vet: 'full',
    official_vet: 'full',
    director: 'full',
    technician: 'full',
  },
  'horses.vaccination_modal': {
    authorized_vet: 'full',
    official_vet: 'full',
    director: 'full',
  },
  'horses.vetlist_modal': {
    authorized_vet: 'view',
    official_vet: 'full',
    director: 'full',
  },
  'horses.vetlist_release': {
    official_vet: 'full',
    director: 'full',
  },
  'horses.euthanasia_modal': {
    official_vet: 'special',
    director: 'special',
    euthanasia: 'special',
  },
  'horses.create': {
    director: 'full',
  },

  // Treatment Reports
  'treatment_reports.create': {
    authorized_vet: 'full',
  },
  'treatment_reports.view_all': {
    official_vet: 'view',
    director: 'view',
  },
  'treatment_reports.edit': {
    official_vet: 'full',
    director: 'full',
  },

  // PMF — Firmas/Certificación (separate from deleted /pmf-records)
  'pmf.signatures_modal': {
    official_vet: 'special',
    director: 'special',
  },

  // Euthanasia Reports
  'reports.euthanasia': {
    official_vet: 'view',
    director: 'view',
    euthanasia: 'view',
  },

  // Admin — Users & Roles
  'admin.users': {
    director: 'full', // For now, only director can manage users; extend if needed
  },

  // Medication Review — technician medication approval
  'horses.medication_review': {
    authorized_vet: 'full',
    official_vet: 'full',
    director: 'full',
  },

  // Revisiones page access
  'page.revisiones': {
    authorized_vet: 'full',
    official_vet: 'full',
    director: 'full',
  },
}

// Level hierarchy for permission evaluation
const LEVEL_HIERARCHY: Record<Level, number> = {
  view: 1,
  full: 2,
  special: 2, // special is alongside full, not above it
}

export function hasPermission(userLevels: Record<Role, Level | undefined>, minLevel: Level): boolean {
  const minValue = LEVEL_HIERARCHY[minLevel]
  for (const level of Object.values(userLevels)) {
    if (level && LEVEL_HIERARCHY[level] >= minValue) {
      return true
    }
  }
  return false
}
