import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireUser, isAdmin } from '@/lib/auth'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser()
    if (!(await isAdmin(user.id, user.email!))) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 })
    }

    // Parsear Excel en el servidor (si el cliente no lo hizo)
    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    let sheetName = 'CABALLOS ACTIVOS'
    if (!workbook.Sheets[sheetName]) {
      sheetName = workbook.SheetNames[0]
    }

    const sheet = workbook.Sheets[sheetName]
    if (!sheet) {
      return NextResponse.json({ error: 'No se encontró ninguna hoja en el archivo Excel' }, { status: 400 })
    }

    const data = XLSX.utils.sheet_to_json(sheet, { defval: '', blankrows: false })

    return NextResponse.json({
      rows: data,
      totalRows: data.length,
      errorRows: 0,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error procesando archivo' },
      { status: 500 }
    )
  }
}
