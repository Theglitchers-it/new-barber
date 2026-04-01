import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export async function generateReportPDF(
  type: string,
  data: Record<string, unknown>,
  dateFrom: Date,
  dateTo: Date
): Promise<Blob> {
  const doc = new jsPDF("p", "mm", "a4")
  const pageWidth = doc.internal.pageSize.getWidth()

  // Header
  doc.setFontSize(20)
  doc.text("SalonPro", pageWidth / 2, 20, { align: "center" })
  doc.setFontSize(12)
  const titles: Record<string, string> = {
    revenue: "Report Fatturato",
    appointments: "Report Appuntamenti",
    clients: "Report Clienti",
    products: "Report Prodotti",
    loyalty: "Report Fedeltà",
    reviews: "Report Recensioni",
  }
  doc.text(titles[type] || "Report", pageWidth / 2, 28, { align: "center" })
  doc.setFontSize(9)
  doc.setTextColor(120)
  doc.text(
    `Periodo: ${dateFrom.toLocaleDateString("it-IT")} - ${dateTo.toLocaleDateString("it-IT")}`,
    pageWidth / 2, 34, { align: "center" }
  )
  doc.setTextColor(0)

  let startY = 42

  switch (type) {
    case "revenue": {
      const d = data as {
        byOperator: { name: string; appointments: number; revenue: number }[]
        byService: { name: string; bookings: number; revenue: number }[]
        totalRevenue: number
      }

      doc.setFontSize(14)
      doc.text(`Fatturato Totale: €${(d.totalRevenue || 0).toFixed(2)}`, 14, startY)
      startY += 10

      if (d.byOperator?.length) {
        autoTable(doc, {
          startY,
          head: [["Operatore", "Appuntamenti", "Fatturato"]],
          body: d.byOperator.map((r) => [r.name, String(r.appointments), `€${(r.revenue || 0).toFixed(2)}`]),
          theme: "grid",
          headStyles: { fillColor: [200, 50, 50] },
        })
        startY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
      }

      if (d.byService?.length) {
        autoTable(doc, {
          startY,
          head: [["Servizio", "Prenotazioni", "Fatturato"]],
          body: d.byService.map((r) => [r.name, String(r.bookings), `€${(r.revenue || 0).toFixed(2)}`]),
          theme: "grid",
          headStyles: { fillColor: [50, 50, 200] },
        })
      }
      break
    }

    case "appointments": {
      const d = data as {
        byStatus: { status: string; count: number }[]
        byOperator: { name: string; count: number }[]
        total: number; noShowRate: number
      }

      doc.setFontSize(12)
      doc.text(`Totale: ${d.total} | No-Show: ${d.noShowRate}%`, 14, startY)
      startY += 10

      if (d.byStatus?.length) {
        autoTable(doc, {
          startY,
          head: [["Stato", "Quantità"]],
          body: d.byStatus.map((r) => [r.status, String(r.count)]),
          theme: "grid",
          headStyles: { fillColor: [200, 50, 50] },
        })
        startY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
      }

      if (d.byOperator?.length) {
        autoTable(doc, {
          startY,
          head: [["Operatore", "Appuntamenti"]],
          body: d.byOperator.map((r) => [r.name, String(r.count)]),
          theme: "grid",
          headStyles: { fillColor: [50, 50, 200] },
        })
      }
      break
    }

    case "clients": {
      const d = data as {
        newClients: number; totalClients: number
        topSpenders: { name: string; email: string; totalSpent: number; loyaltyTier: string }[]
      }

      doc.setFontSize(12)
      doc.text(`Totale Clienti: ${d.totalClients} | Nuovi: ${d.newClients}`, 14, startY)
      startY += 10

      if (d.topSpenders?.length) {
        autoTable(doc, {
          startY,
          head: [["Nome", "Email", "Tier", "Spesa Totale"]],
          body: d.topSpenders.map((r) => [r.name || "-", r.email, r.loyaltyTier, `€${(r.totalSpent || 0).toFixed(2)}`]),
          theme: "grid",
          headStyles: { fillColor: [200, 50, 50] },
        })
      }
      break
    }

    case "products": {
      const d = data as {
        topProducts: { name: string; quantitySold: number; revenue: number; currentStock: number }[]
        totalQuantity: number; totalRevenue: number
      }

      doc.setFontSize(12)
      doc.text(`Pezzi Venduti: ${d.totalQuantity} | Fatturato: €${(d.totalRevenue || 0).toFixed(2)}`, 14, startY)
      startY += 10

      if (d.topProducts?.length) {
        autoTable(doc, {
          startY,
          head: [["Prodotto", "Venduti", "Fatturato", "Stock"]],
          body: d.topProducts.map((r) => [r.name, String(r.quantitySold), `€${(r.revenue || 0).toFixed(2)}`, String(r.currentStock)]),
          theme: "grid",
          headStyles: { fillColor: [200, 50, 50] },
        })
      }
      break
    }

    case "loyalty": {
      const d = data as {
        earned: { points: number; transactions: number }
        redeemed: { points: number; transactions: number }
        net: number
      }

      autoTable(doc, {
        startY,
        head: [["Metrica", "Valore"]],
        body: [
          ["Punti Emessi", `${d.earned?.points || 0} (${d.earned?.transactions || 0} transazioni)`],
          ["Punti Riscattati", `${d.redeemed?.points || 0} (${d.redeemed?.transactions || 0} transazioni)`],
          ["Saldo Netto", String(d.net || 0)],
        ],
        theme: "grid",
        headStyles: { fillColor: [200, 50, 50] },
      })
      break
    }

    case "reviews": {
      const d = data as {
        byOperator: { name: string; avgRating: number; count: number }[]
        total: number; avgRating: number
      }

      doc.setFontSize(12)
      doc.text(`Totale: ${d.total} | Media: ${d.avgRating}/5`, 14, startY)
      startY += 10

      if (d.byOperator?.length) {
        autoTable(doc, {
          startY,
          head: [["Operatore", "Media", "Recensioni"]],
          body: d.byOperator.map((r) => [r.name, String(r.avgRating), String(r.count)]),
          theme: "grid",
          headStyles: { fillColor: [200, 50, 50] },
        })
      }
      break
    }
  }

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(`Generato il ${new Date().toLocaleString("it-IT")} — Pagina ${i}/${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" })
  }

  return doc.output("blob")
}
