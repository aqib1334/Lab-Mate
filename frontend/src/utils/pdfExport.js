import { jsPDF } from 'jspdf'

// Manual PDF export using jsPDF without autoTable
export function createAuditPDF(data, type) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 12
  const now = new Date()
  const dateStr = now.toLocaleDateString()

  // Header
  doc.setFontSize(18)
  doc.setFont(undefined, 'bold')
  doc.setTextColor(63, 228, 134)
  doc.text('LABMATE | BIOTECH AUDIT REPORT', margin, margin + 5)

  // Metadata
  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  doc.setTextColor(80, 100, 150)
  doc.text(`Date Generated: ${dateStr}`, margin, margin + 14)
  doc.text(`Total Records: ${data.length}`, margin, margin + 20)

  // Separator line
  doc.setDrawColor(63, 228, 134)
  doc.line(margin, margin + 24, pageWidth - margin, margin + 24)

  let yPos = margin + 30
  const rowHeight = 7
  const headerBg = [26, 92, 255]
  const headerText = [255, 255, 255]

  if (type === 'protocols') {
    const colWidths = [35, 45, 50, 25]
    const headers = ['Date', 'Protocol', 'File', 'Status']

    // Draw header
    doc.setFillColor(...headerBg)
    doc.setTextColor(...headerText)
    doc.setFont(undefined, 'bold')
    doc.setFontSize(8)

    let xPos = margin
    headers.forEach((h, i) => {
      doc.rect(xPos, yPos - 5, colWidths[i], rowHeight, 'F')
      doc.text(h, xPos + 2, yPos, { maxWidth: colWidths[i] - 2 })
      xPos += colWidths[i]
    })
    yPos += rowHeight

    // Draw rows
    doc.setFont(undefined, 'normal')
    doc.setFontSize(7)

    data.forEach(item => {
      const status = item.result?.overall_status || 'UNKNOWN'
      let bg = [220, 220, 220]
      let textCol = [50, 50, 50]

      if (status === 'PASS') {
        bg = [63, 228, 134]
        textCol = [20, 40, 80]
      } else if (status === 'FAIL') {
        bg = [255, 77, 106]
        textCol = [255, 255, 255]
      } else if (status === 'WARNING') {
        bg = [255, 170, 0]
        textCol = [255, 255, 255]
      }

      xPos = margin
      const cells = [
        new Date(item.createdAt).toLocaleDateString(),
        item.result?.protocol_identified || 'Unknown',
        item.fileName || 'N/A',
        status
      ]

      cells.forEach((cell, i) => {
        if (i === 3) {
          doc.setFillColor(...bg)
          doc.rect(xPos, yPos - 5, colWidths[i], rowHeight, 'F')
          doc.setTextColor(...textCol)
        } else {
          doc.setTextColor(80, 100, 150)
        }
        doc.text(String(cell), xPos + 2, yPos, { maxWidth: colWidths[i] - 2 })
        xPos += colWidths[i]
      })
      yPos += rowHeight

      if (yPos > pageHeight - 20) {
        doc.addPage()
        yPos = margin + 30
      }
    })
  } else if (type === 'reagents') {
    const colWidths = [45, 60, 35]
    const headers = ['Reagent', 'Purpose', 'Risk']

    // Draw header
    doc.setFillColor(...headerBg)
    doc.setTextColor(...headerText)
    doc.setFont(undefined, 'bold')
    doc.setFontSize(8)

    let xPos = margin
    headers.forEach((h, i) => {
      doc.rect(xPos, yPos - 5, colWidths[i], rowHeight, 'F')
      doc.text(h, xPos + 2, yPos, { maxWidth: colWidths[i] - 2 })
      xPos += colWidths[i]
    })
    yPos += rowHeight

    // Draw rows
    doc.setFont(undefined, 'normal')
    doc.setFontSize(7)

    data.forEach(item => {
      const risk = (item.riskLevel || 'safe').toUpperCase()
      let bg = [220, 220, 220]
      let textCol = [50, 50, 50]

      if (risk === 'DANGER') {
        bg = [255, 77, 106]
        textCol = [255, 255, 255]
      } else if (risk === 'CAUTION') {
        bg = [255, 170, 0]
        textCol = [255, 255, 255]
      } else if (risk === 'SAFE') {
        bg = [63, 228, 134]
        textCol = [20, 40, 80]
      }

      xPos = margin
      const cells = [
        item.name || 'Unknown',
        item.purposes?.join(', ') || 'N/A',
        risk
      ]

      cells.forEach((cell, i) => {
        if (i === 2) {
          doc.setFillColor(...bg)
          doc.rect(xPos, yPos - 5, colWidths[i], rowHeight, 'F')
          doc.setTextColor(...textCol)
        } else {
          doc.setTextColor(80, 100, 150)
        }
        doc.text(String(cell), xPos + 2, yPos, { maxWidth: colWidths[i] - 2 })
        xPos += colWidths[i]
      })
      yPos += rowHeight

      if (yPos > pageHeight - 20) {
        doc.addPage()
        yPos = margin + 30
      }
    })
  }

  // Footer
  const pageCount = typeof doc.getNumberOfPages === 'function'
    ? doc.getNumberOfPages()
    : doc.internal.pages.length - 1
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(130, 150, 180)
    doc.text('© 2026 LabMate AI Auditor | Confidential Research Data', margin, pageHeight - 8)
  }

  return doc
}
