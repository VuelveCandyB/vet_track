// Generador del PDF del informe de tratamiento (navegador).
// Lo usan el botón "Descargar PDF" y el envío del correo con adjunto.
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import type { TreatmentReport } from '@/lib/types'

export interface PdfMedication {
  id?: string
  drug_id: string
  dosis: number
  dosis_unidad?: string
  nivel_dosificacion?: string
  tiempo_restriccion?: number | null
  drug?: { nombre: string; categoria: string; tipo_restriccion?: string }
}

export type PdfReport = TreatmentReport & {
  horse?: { name: string; registration?: string; microchip?: string }
}

export async function buildTreatmentReportPdf(report: PdfReport, medications: PdfMedication[] = []): Promise<jsPDF> {
  // Logo de Cloudinary (mismo del login)
  const logoBase64 = 'https://res.cloudinary.com/dee0x7p16/image/upload/v1780695288/HC_Logo-Principal_Negro_mfsygj.png'

  // Crear un elemento temporal con el contenido del informe
  const element = document.createElement('div')
  element.style.padding = '40px'
  element.style.backgroundColor = 'white'
  element.style.width = '800px'
  element.style.fontFamily = 'Arial, sans-serif'
  element.style.fontSize = '12px'
  element.style.lineHeight = '1.6'

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    const [year, month, day] = dateStr.split('-')
    return `${day}/${month}/${year}`
  }

  const formatDateTime = (dateTimeStr: string | null) => {
    if (!dateTimeStr) return '—'
    const date = new Date(dateTimeStr)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    let hours = date.getHours()
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12 || 12
    const hoursStr = String(hours).padStart(2, '0')
    return `${day}/${month}/${year} ${hoursStr}:${minutes} ${ampm}`
  }

  const medicamentosHTML = medications.length > 0 ? medications.map((med, idx) => `
    <div style="margin-bottom: 15px; padding: 10px; background: #f9f9f9; border-left: 3px solid #059669;">
      <strong>Medicamento ${idx + 1}:</strong> ${med.drug?.nombre || '—'}<br/>
      <strong>Categoría:</strong> ${med.drug?.categoria || '—'}<br/>
      <strong>Dosis:</strong> ${med.dosis} ${med.dosis_unidad || 'mg'}<br/>
      ${med.nivel_dosificacion ? `<strong>Nivel:</strong> ${med.nivel_dosificacion}<br/>` : ''}
      ${med.drug?.tipo_restriccion ? `<strong>Restricción:</strong> ${med.drug.tipo_restriccion}<br/>` : ''}
      ${med.tiempo_restriccion ? `<strong>Tiempo Restricción:</strong> ${med.tiempo_restriccion}h` : ''}
    </div>
  `).join('') : '<p>Sin medicamentos registrados</p>'

  element.innerHTML = `
    <div style="text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #333;">
      <img src="${logoBase64}" style="max-width: 190px; height: auto; margin-bottom: 15px; display: block; margin-left: 0;" alt="Logo" />
      <h1 style="margin: 0; font-size: 20px; color: #059669;">Informe de Tratamiento Veterinario</h1>
      <p style="margin: 10px 0 0 0; color: #666; font-size: 11px;">Art. 811 — Reglamento de Medicación Controlada</p>
    </div>

    <div style="margin-bottom: 30px;">
      <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 15px; color: #059669;">Información del Caballo</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="width: 50%; padding: 8px; border-bottom: 1px solid #ddd;">
            <strong>Nombre:</strong> ${report.horse?.name || '—'}
          </td>
          <td style="width: 50%; padding: 8px; border-bottom: 1px solid #ddd;">
            <strong>ID Oficial:</strong> ${report.numero_identificacion_caballo || report.horse?.registration || '—'}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">
            <strong>Establo:</strong> ${report.establo || '—'}
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">
            <strong>Microchip:</strong> ${report.horse?.microchip || '—'}
          </td>
        </tr>
      </table>
    </div>

    <div style="margin-bottom: 30px;">
      <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 15px; color: #059669;">Medicamentos Registrados</h2>
      ${medicamentosHTML}
    </div>

    <div style="margin-bottom: 30px;">
      <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 15px; color: #059669;">Información del Tratamiento</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="width: 50%; padding: 8px; border-bottom: 1px solid #ddd;">
            <strong>Fecha:</strong> ${formatDate(report.fecha_tratamiento)}
          </td>
          <td style="width: 50%; padding: 8px; border-bottom: 1px solid #ddd;">
            <strong>Hora:</strong> ${report.hora_tratamiento || '—'}
          </td>
        </tr>
      </table>
    </div>

    ${report.diagnostico ? `
      <div style="margin-bottom: 30px;">
        <h3 style="font-size: 12px; font-weight: bold; margin-bottom: 8px;">Diagnóstico:</h3>
        <p style="margin: 0; padding: 10px; background: #f5f5f5; border-left: 3px solid #059669;">${report.diagnostico}</p>
      </div>
    ` : ''}

    ${report.tratamiento ? `
      <div style="margin-bottom: 30px;">
        <h3 style="font-size: 12px; font-weight: bold; margin-bottom: 8px;">Tratamiento:</h3>
        <p style="margin: 0; padding: 10px; background: #f5f5f5; border-left: 3px solid #059669;">${report.tratamiento}</p>
      </div>
    ` : ''}


    <div style="margin-bottom: 30px;">
      <h3 style="font-size: 12px; font-weight: bold; margin-bottom: 8px;">Veterinario Autorizado:</h3>
      <p style="margin: 0; padding: 10px; background: #f5f5f5;">${report.vet_autorizado_nombre || '—'}</p>
    </div>

    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 10px; color: #666;">
      <p><strong>Creado:</strong> ${formatDateTime(report.created_at || null)}</p>
      <p style="margin-top: 15px; color: #999; text-align: center;">
        Este documento ha sido generado digitalmente y tiene validez legal conforme al Reglamento 8760.
      </p>
    </div>
  `

  // Añadir al DOM temporalmente para que html2canvas pueda renderizar
  element.style.position = 'fixed'
  element.style.left = '-9999px'
  document.body.appendChild(element)

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      allowTaint: true,
    })

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    // JPEG en vez de PNG: el PDF queda mucho más liviano (importa para el adjunto del correo)
    const imgData = canvas.toDataURL('image/jpeg', 0.9)
    const imgWidth = 210 - 20 // A4 width minus margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight
    let position = 10

    pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight)
    heightLeft -= 297 - 20 // A4 height minus margins

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + 10
      pdf.addPage()
      pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight)
      heightLeft -= 297 - 20
    }

    return pdf
  } finally {
    element.remove()
  }
}
