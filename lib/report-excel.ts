import ExcelJS from "exceljs"

export async function generateReportExcel(
  type: string,
  data: Record<string, unknown>,
  dateFrom: Date,
  dateTo: Date
): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "SalonPro"

  const headerStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, color: { argb: "FFFFFFFF" } },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFC83232" } },
    alignment: { horizontal: "center" },
  }

  const titles: Record<string, string> = {
    revenue: "Fatturato",
    appointments: "Appuntamenti",
    clients: "Clienti",
    products: "Prodotti",
    loyalty: "Fedeltà",
    reviews: "Recensioni",
  }

  switch (type) {
    case "revenue": {
      const d = data as {
        byOperator: { name: string; appointments: number; revenue: number }[]
        byService: { name: string; bookings: number; revenue: number }[]
        totalRevenue: number
      }

      const ws1 = workbook.addWorksheet("Per Operatore")
      ws1.columns = [
        { header: "Operatore", key: "name", width: 25 },
        { header: "Appuntamenti", key: "appointments", width: 15 },
        { header: "Fatturato", key: "revenue", width: 15 },
      ]
      ws1.getRow(1).eachCell((cell) => { cell.style = headerStyle })
      d.byOperator?.forEach((r) => ws1.addRow(r))

      const ws2 = workbook.addWorksheet("Per Servizio")
      ws2.columns = [
        { header: "Servizio", key: "name", width: 25 },
        { header: "Prenotazioni", key: "bookings", width: 15 },
        { header: "Fatturato", key: "revenue", width: 15 },
      ]
      ws2.getRow(1).eachCell((cell) => { cell.style = headerStyle })
      d.byService?.forEach((r) => ws2.addRow(r))
      break
    }

    case "appointments": {
      const d = data as {
        byStatus: { status: string; count: number }[]
        byOperator: { name: string; count: number }[]
      }

      const ws1 = workbook.addWorksheet("Per Stato")
      ws1.columns = [
        { header: "Stato", key: "status", width: 20 },
        { header: "Quantità", key: "count", width: 15 },
      ]
      ws1.getRow(1).eachCell((cell) => { cell.style = headerStyle })
      d.byStatus?.forEach((r) => ws1.addRow(r))

      const ws2 = workbook.addWorksheet("Per Operatore")
      ws2.columns = [
        { header: "Operatore", key: "name", width: 25 },
        { header: "Appuntamenti", key: "count", width: 15 },
      ]
      ws2.getRow(1).eachCell((cell) => { cell.style = headerStyle })
      d.byOperator?.forEach((r) => ws2.addRow(r))
      break
    }

    case "clients": {
      const d = data as {
        topSpenders: { name: string; email: string; totalSpent: number; loyaltyTier: string }[]
        tierDistribution: { tier: string; count: number }[]
      }

      const ws1 = workbook.addWorksheet("Top Spender")
      ws1.columns = [
        { header: "Nome", key: "name", width: 25 },
        { header: "Email", key: "email", width: 30 },
        { header: "Tier", key: "loyaltyTier", width: 12 },
        { header: "Spesa Totale", key: "totalSpent", width: 15 },
      ]
      ws1.getRow(1).eachCell((cell) => { cell.style = headerStyle })
      d.topSpenders?.forEach((r) => ws1.addRow(r))

      const ws2 = workbook.addWorksheet("Distribuzione Tier")
      ws2.columns = [
        { header: "Tier", key: "tier", width: 15 },
        { header: "Clienti", key: "count", width: 15 },
      ]
      ws2.getRow(1).eachCell((cell) => { cell.style = headerStyle })
      d.tierDistribution?.forEach((r) => ws2.addRow(r))
      break
    }

    case "products": {
      const d = data as {
        topProducts: { name: string; quantitySold: number; revenue: number; currentStock: number }[]
      }

      const ws = workbook.addWorksheet("Prodotti")
      ws.columns = [
        { header: "Prodotto", key: "name", width: 25 },
        { header: "Venduti", key: "quantitySold", width: 12 },
        { header: "Fatturato", key: "revenue", width: 15 },
        { header: "Stock", key: "currentStock", width: 12 },
      ]
      ws.getRow(1).eachCell((cell) => { cell.style = headerStyle })
      d.topProducts?.forEach((r) => ws.addRow(r))
      break
    }

    case "loyalty": {
      const d = data as {
        earned: { points: number; transactions: number }
        redeemed: { points: number; transactions: number }
        net: number
      }

      const ws = workbook.addWorksheet("Fedeltà")
      ws.columns = [
        { header: "Metrica", key: "metric", width: 25 },
        { header: "Valore", key: "value", width: 15 },
        { header: "Transazioni", key: "tx", width: 15 },
      ]
      ws.getRow(1).eachCell((cell) => { cell.style = headerStyle })
      ws.addRow({ metric: "Punti Emessi", value: d.earned?.points || 0, tx: d.earned?.transactions || 0 })
      ws.addRow({ metric: "Punti Riscattati", value: d.redeemed?.points || 0, tx: d.redeemed?.transactions || 0 })
      ws.addRow({ metric: "Saldo Netto", value: d.net || 0, tx: "" })
      break
    }

    case "reviews": {
      const d = data as {
        byOperator: { name: string; avgRating: number; count: number }[]
        ratingDistribution: { rating: number; count: number }[]
      }

      const ws1 = workbook.addWorksheet("Per Operatore")
      ws1.columns = [
        { header: "Operatore", key: "name", width: 25 },
        { header: "Media", key: "avgRating", width: 12 },
        { header: "Recensioni", key: "count", width: 15 },
      ]
      ws1.getRow(1).eachCell((cell) => { cell.style = headerStyle })
      d.byOperator?.forEach((r) => ws1.addRow(r))

      const ws2 = workbook.addWorksheet("Distribuzione")
      ws2.columns = [
        { header: "Rating", key: "rating", width: 12 },
        { header: "Quantità", key: "count", width: 15 },
      ]
      ws2.getRow(1).eachCell((cell) => { cell.style = headerStyle })
      d.ratingDistribution?.forEach((r) => ws2.addRow(r))
      break
    }
  }

  // Add info sheet
  const info = workbook.addWorksheet("Info")
  info.getCell("A1").value = "Report"
  info.getCell("B1").value = titles[type] || type
  info.getCell("A2").value = "Periodo"
  info.getCell("B2").value = `${dateFrom.toLocaleDateString("it-IT")} - ${dateTo.toLocaleDateString("it-IT")}`
  info.getCell("A3").value = "Generato"
  info.getCell("B3").value = new Date().toLocaleString("it-IT")
  info.getColumn(1).width = 15
  info.getColumn(2).width = 30

  return (await workbook.xlsx.writeBuffer()) as ArrayBuffer
}
