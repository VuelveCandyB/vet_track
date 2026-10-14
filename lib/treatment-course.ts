// Helpers para tratamientos de dosificación diaria (varios días).
// Las fechas son strings YYYY-MM-DD y las horas HH:MM, sin zona horaria:
// se opera en UTC sobre valores "ingenuos" para que servidor y cliente coincidan.

export const MAX_COURSE_DAYS = 30

const DAY_MS = 24 * 60 * 60 * 1000
const MONTHS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function dateToUtcMs(date: string): number {
  const [y, m, d] = date.slice(0, 10).split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function msToDate(ms: number): string {
  const d = new Date(ms)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

export function addDays(date: string, days: number): string {
  return msToDate(dateToUtcMs(date) + days * DAY_MS)
}

/** Número de días del curso, contando inicio y fin. Sin fin vale 1 (dosis única). */
export function courseDays(inicio: string, fin?: string | null): number {
  if (!fin) return 1
  const diff = Math.round((dateToUtcMs(fin) - dateToUtcMs(inicio)) / DAY_MS)
  return diff >= 0 ? diff + 1 : 1
}

/** Lista de fechas (YYYY-MM-DD) del curso, de inicio a fin. */
export function courseDates(inicio: string, fin?: string | null): string[] {
  const n = courseDays(inicio, fin)
  return Array.from({ length: n }, (_, i) => addDays(inicio, i))
}

/** Devuelve un mensaje de error si el rango no es válido, o null si lo es. */
export function validateCourse(inicio: string, fin?: string | null): string | null {
  if (!fin) return null
  const diff = Math.round((dateToUtcMs(fin) - dateToUtcMs(inicio)) / DAY_MS)
  if (diff < 0) return '"Hasta cuándo" no puede ser anterior a la fecha de tratamiento'
  if (diff + 1 > MAX_COURSE_DAYS) return `El tratamiento no puede durar más de ${MAX_COURSE_DAYS} días`
  return null
}

/** "14 oct" (o "14 oct 2026" si withYear). */
export function formatShortDate(date: string, withYear = false): string {
  const [y, m, d] = date.slice(0, 10).split('-').map(Number)
  return `${d} ${MONTHS_ES[m - 1]}${withYear ? ` ${y}` : ''}`
}

/** "14 al 18 oct" / "29 oct al 2 nov" / "14 oct" si es un solo día. */
export function formatCourseRange(inicio: string, fin?: string | null): string {
  if (!fin || courseDays(inicio, fin) === 1) return formatShortDate(inicio)
  const [, m1] = inicio.split('-').map(Number)
  const [, m2, d2] = fin.split('-').map(Number)
  const [, , d1] = inicio.split('-').map(Number)
  return m1 === m2
    ? `${d1} al ${d2} ${MONTHS_ES[m2 - 1]}`
    : `${formatShortDate(inicio)} al ${formatShortDate(fin)}`
}

/** "5 días" / "1 día". */
export function formatDaysLabel(days: number): string {
  return `${days} ${days === 1 ? 'día' : 'días'}`
}

/**
 * Fin de la restricción: última dosis (hasta_cuando o, si no hay, la fecha de
 * tratamiento) a la hora indicada, más tiempo_restriccion en horas.
 * Devuelve null si el medicamento no tiene restricción.
 */
export function restrictionEnd(params: {
  fecha: string
  hora?: string | null
  hasta_cuando?: string | null
  tiempo_restriccion?: number | null
}): { date: string; time: string } | null {
  const { fecha, hora, hasta_cuando, tiempo_restriccion } = params
  if (!tiempo_restriccion || tiempo_restriccion <= 0) return null
  const lastDay = hasta_cuando || fecha
  const [hh, mm] = (hora || '00:00').split(':').map(Number)
  const [y, m, d] = lastDay.slice(0, 10).split('-').map(Number)
  const end = new Date(Date.UTC(y, m - 1, d, hh || 0, mm || 0) + tiempo_restriccion * 60 * 60 * 1000)
  return {
    date: `${end.getUTCFullYear()}-${pad(end.getUTCMonth() + 1)}-${pad(end.getUTCDate())}`,
    time: `${pad(end.getUTCHours())}:${pad(end.getUTCMinutes())}`,
  }
}

/** "Diaria, 14 al 18 oct (5 días)" o null si es dosis única. */
export function courseLabel(fecha: string, hasta_cuando?: string | null): string | null {
  if (!hasta_cuando || courseDays(fecha, hasta_cuando) <= 1) return null
  return `Diaria, ${formatCourseRange(fecha, hasta_cuando)} (${formatDaysLabel(courseDays(fecha, hasta_cuando))})`
}

/** "hasta 23 oct 2026 08:00" (fin de la restricción) o null si no hay restricción. */
export function restrictionUntilLabel(params: {
  fecha: string
  hora?: string | null
  hasta_cuando?: string | null
  tiempo_restriccion?: number | null
}): string | null {
  const end = restrictionEnd(params)
  return end ? `hasta ${formatShortDate(end.date, true)} ${end.time}` : null
}
