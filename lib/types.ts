export interface Horse {
  id: string
  name: string
  color: string
  status: 'active' | 'rest' | 'injury' | 'deceased'
  registration?: string
  owner?: string
  trainer?: string
  birth_date?: string
  microchip?: string
  gender?: string
}

export interface Medication {
  id: string
  horse_id: string
  vet_name: string
  type: string
  drug: string
  dose: string
  quantity?: string
  notes?: string
  administered_at: string
  attachment_url?: string
  drug_categoria?: string
  detection_time_horas?: number
  withdrawal_time_horas?: number
  tipo_restriccion?: string
  drug_notas?: string
  created_by: string
}

export interface VetlistEntry {
  id: string
  horse_id: string
  motivo: string
  descripcion?: string
  fecha_ingreso: string
  fecha_egreso?: string
  fecha_inicio_descanso?: string
  fecha_fin_descanso?: string
  vet_ingreso: string
  vet_egreso?: string
  resultado_examen?: string
  condiciones_post?: string
  attachment_ingreso_url?: string
  attachment_egreso_url?: string
  created_by?: string
  created_at?: string
}

export interface EuthanasiaRecord {
  id: string
  horse_id: string
  vet_name: string
  fecha: string
  motivo: string
  propietario_notificado: boolean
  attachment_url?: string
}

export interface Drug {
  id: string
  nombre: string
  nombre_comercial?: string
  categoria: string
  dosis_ruta?: string
  detection_time_horas?: number
  withdrawal_time_horas?: number
  tipo_restriccion?: string
  notas?: string
  active: boolean
}

export interface Profile {
  id: string
  email: string
  first_name?: string
  last_name?: string
}
