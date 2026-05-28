export const ADMIN_EMAIL = 'm.rivera@camareroracepr.com'

export const STATUS_OPTIONS = ['active', 'rest', 'injury'] as const
export const COLOR_OPTIONS = ['Bay', 'Dark Bay', 'Chestnut', 'Grey', 'Roan', 'Black'] as const

export const STATUS_LABEL: Record<string, string> = {
  active:   'Activo',
  rest:     'Descanso',
  injury:   'Lesionado',
  deceased: 'Fallecido',
}

export const MOTIVOS_VETLIST = [
  'Lesión',
  'Enfermedad',
  'Medicación activa',
  'Cojera',
  'Cirugía',
  'Comportamiento',
  'Otro',
]

export const RESTRICTION_TYPES = ['WDT', 'RAT', 'RAT+WDT', 'Stand Down']
