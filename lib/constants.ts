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

export const DIAGNOSIS_TIPOS = [
  'Lameness / Unsoundness',
  'Condición Médica',
  'Bajo Rendimiento Inexplicado',
  'Caso Automático de Vet List',
] as const

export const DIAGNOSIS_POR_TIPO: Record<string, readonly string[]> = {
  'Lameness / Unsoundness': [
    'Cojera 3/5+ (escala 1-5)',
    'Fractura tercer hueso carpiano (C3 slab)',
    'Fractura base del sesamoide',
    'Fractura central del sesamoide',
    'Fractura de cañas (Mc3)',
    'Fractura condilar Mc3',
    'Otro',
  ],
  'Condición Médica': [
    'Problemas oculares / úlceras corneales',
    'Otro',
  ],
  'Bajo Rendimiento Inexplicado': [
    'Disminución marcada del rendimiento',
    'Otro',
  ],
  'Caso Automático de Vet List': [
    'BCS 3/9 o menos',
    'Epistaxis',
    'Úlceras corneales activas',
    'Terminó carrera a más de 20 cuerpos',
    'Retirado en el saque / tiempo de retiro',
    'Retirado en el gate / post-carrera',
    'Void Claim Rule',
    'Rabdomiólisis',
    'Estrés de calor (heat stroke)',
    'Importado - no pasó Lameness Test',
    'Protocolo mal estado (inspector)',
  ],
}

export const SEVERIDADES = ['Leve', 'Moderado', 'Grave'] as const

export const SISTEMAS_AFECTADOS = [
  'Musculoesquelético',
  'Respiratorio',
  'Digestivo',
  'Ocular',
  'Cardiovascular',
  'Neurológico',
  'Dermatológico',
  'Otro',
] as const
