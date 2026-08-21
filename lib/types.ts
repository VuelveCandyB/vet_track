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
  ubicacion?: string
  red_flag?: boolean
  red_flag_reason?: string
  red_flag_by?: string
  red_flag_date?: string
}

export interface Medication {
  id: string
  horse_id: string
  vet_name: string
  type: string
  drug: string
  dose: string
  proposito?: string
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
  fecha_ultima_carrera?: string
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
  dosis_min?: number
  dosis_max?: number
  dosis_unidad?: string
  detection_time_horas?: number
  withdrawal_time_horas?: number
  withdrawal_time_dias?: number
  tipo_restriccion?: string
  nivel_maximo_permitido?: string
  notas?: string
  active: boolean
}

export interface Profile {
  id: string
  email: string
  first_name?: string
  last_name?: string
  license_number?: string
  license_renewal_date?: string
  phone1?: string
  phone2?: string
  notify_vaccinations?: boolean
  active_vet_id?: string | null
}

export interface Diagnostico {
  id: string
  horse_id: string
  vet_name: string
  created_by?: string
  fecha: string
  tipo: string
  diagnostico: string
  sistema_afectado?: string
  severidad?: string
  tratamiento_recomendado?: string
  notas?: string
  recomendar_vetlist: boolean
  attachment_url?: string
  created_at?: string
}

export interface VaccineType {
  id: string
  name: string
  validity_days: number
  warning_days: number
  required: boolean
  active: boolean
  sort_order: number
  created_at?: string
}

export interface Vaccination {
  id: string
  horse_id: string
  vet_name: string
  vaccine_type_id?: string
  fecha: string
  notas?: string
  created_by?: string
  created_at?: string
  vaccine_types?: VaccineType
}

export interface TreatmentReport {
  id: string
  horse_id: string
  drug_id: string
  numero_identificacion_caballo?: string
  establo: string
  tratamiento?: string
  diagnostico: string
  fecha_tratamiento: string
  hora_tratamiento: string
  dosis: number
  dosis_unidad?: string
  nivel_dosificacion?: string
  tiempo_restriccion?: number | null
  fecha_fin_tratamiento?: string | null
  hora_fin_tratamiento?: string | null
  hasta_cuando?: string | null
  es_auto_generado?: boolean
  informe_padre_id?: string | null
  notas?: string
  vet_autorizado_nombre: string
  created_for_vet_id?: string | null
  estado: 'borrador' | 'sometido' | 'radicado'
  sometido_en?: string | null
  radicado_en?: string | null
  created_by?: string
  created_at?: string
}
