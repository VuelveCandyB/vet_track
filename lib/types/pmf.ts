// PMF (Programa de Medicación con Furosemide) types
// Art. 1401-1415 del Reglamento 8760

export interface RaceDay {
  id: string
  fecha: string // DATE format
  hora_retiros?: string // TIME format HH:MM
  total_carreras?: number
  estado: 'borrador' | 'activo' | 'cerrado'
  fuente: 'equibase' | 'csv' | 'manual'
  creado_por: string
  creado_en: string
  actualizado_en: string
}

export interface RaceEntry {
  id: string
  race_day_id: string
  horse_id?: string // NULL if unmatched
  horse_nombre_csv: string
  horse_id_csv: string
  num_carrera: number
  hora_salida: string // TIME format HH:MM
  puesto?: number
  trainer?: string
  owner?: string
  fuente: 'equibase' | 'csv' | 'manual'
  match_status: 'matched' | 'unmatched' | 'manual'
  notas?: string
  created_at: string
}

export interface PMFRecord {
  id: string
  race_entry_id: string

  // Receta (Art. 1407-1408)
  vet_autorizado_nombre?: string
  dosis_recetada?: number // mg
  hora_entrega_receta?: string // TIMESTAMP

  // Administración (Art. 1406, 1410, 1412)
  fecha_admin?: string // DATE
  hora_admin?: string // TIME HH:MM
  dosis_administrada?: number // mg, 100-500
  via_admin: 'IV' // Always IV, non-editable
  aguja_confirmada: boolean

  // Snapshot (Art. 1412a)
  horse_nombre?: string
  horse_id_oficial?: string

  // Firmas (Art. 1412c)
  vet_oficial_id?: string
  vet_oficial_nombre?: string
  vet_oficial_firmado: boolean
  vet_oficial_firma_ts?: string // TIMESTAMP

  rep_nombre?: string
  rep_firmado: boolean
  rep_firma_ts?: string // TIMESTAMP

  // Validaciones
  val_horas_antes?: number // hours before race
  val_dosis_ok: boolean
  val_rx_tiempo_ok: boolean
  val_coincide_dosis: boolean

  // Estado
  observaciones?: string
  estado: 'borrador' | 'certificado' | 'distribuido'
  certificado_en?: string // TIMESTAMP
  created_at: string
  updated_at: string
}

export interface SignatureAuditLog {
  id: string
  pmf_record_id: string
  signer_type: 'vet_oficial' | 'representante'
  signer_id: string
  signer_name: string
  signed_at: string // TIMESTAMP
  created_at: string
}

// Constants from Art. 1408
export const PMF_CONSTANTS = {
  DOSIS_MIN_MG: 100,
  DOSIS_MAX_MG: 500,
  DOSIS_MIN_CC: 2,
  DOSIS_MAX_CC: 10,
  HORAS_ANTES_CARRERA: 4, // Art. 1406
  HORAS_PRESENTAR_ANTES: 4.5, // Art. 1403
  RX_HORA_LIMITE: 12, // mediodía — Art. 1407
  VIA_ADMIN: 'IV' as const, // Art. 1408, 1410 — always IV
}
