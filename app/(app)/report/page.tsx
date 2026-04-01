"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Euro,
  Calendar as CalendarIcon,
  Users,
  ShoppingBag,
  Gift,
  Star,
  Download,
  FileSpreadsheet,
} from "lucide-react"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { cn } from "@/lib/utils"

const REPORT_TYPES = [
  { id: "revenue" as const, label: "Fatturato", icon: Euro },
  { id: "appointments" as const, label: "Appuntamenti", icon: CalendarIcon },
  { id: "clients" as const, label: "Clienti", icon: Users },
  { id: "products" as const, label: "Prodotti", icon: ShoppingBag },
  { id: "loyalty" as const, label: "Fedeltà", icon: Gift },
  { id: "reviews" as const, label: "Recensioni", icon: Star },
]

type ReportType = (typeof REPORT_TYPES)[number]["id"]

const PERIODS = [
  { label: "Oggi", days: 0 },
  { label: "Settimana", days: 7 },
  { label: "Mese", days: 30 },
  { label: "Anno", days: 365 },
]

export default function ReportPage() {
  const [reportType, setReportType] = useState<ReportType>("revenue")
  const [periodIndex, setPeriodIndex] = useState(2)
  const [dateFrom, setDateFrom] = useState<Date>(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d
  })
  const [dateTo, setDateTo] = useState<Date>(new Date())
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const [customMode, setCustomMode] = useState(false)

  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      const from = dateFrom.toISOString().split("T")[0]
      const to = dateTo.toISOString().split("T")[0]
      const res = await fetch(`/api/reports?type=${reportType}&dateFrom=${from}&dateTo=${to}`)
      if (res.ok) setData(await res.json())
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [reportType, dateFrom, dateTo])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  function selectPeriod(idx: number) {
    setPeriodIndex(idx)
    setCustomMode(false)
    const d = new Date()
    setDateTo(d)
    const from = new Date(d)
    from.setDate(from.getDate() - PERIODS[idx].days)
    setDateFrom(from)
  }

  async function downloadPDF() {
    if (!data) return
    const { generateReportPDF } = await import("@/lib/report-pdf")
    const blob = await generateReportPDF(reportType, data, dateFrom, dateTo)
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `report-${reportType}-${dateFrom.toISOString().split("T")[0]}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function downloadExcel() {
    if (!data) return
    const { generateReportExcel } = await import("@/lib/report-excel")
    const buffer = await generateReportExcel(reportType, data, dateFrom, dateTo)
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `report-${reportType}-${dateFrom.toISOString().split("T")[0]}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Report</h1>
          <p className="text-sm text-muted-foreground">Esporta dati in PDF o Excel</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadPDF} disabled={!data || loading}>
            <Download className="w-4 h-4 mr-1" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={downloadExcel} disabled={!data || loading}>
            <FileSpreadsheet className="w-4 h-4 mr-1" /> Excel
          </Button>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex flex-wrap gap-2">
        {PERIODS.map((p, i) => (
          <Button
            key={p.label}
            variant={!customMode && periodIndex === i ? "default" : "outline"}
            size="sm"
            onClick={() => selectPeriod(i)}
            className="rounded-full"
          >
            {p.label}
          </Button>
        ))}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant={customMode ? "default" : "outline"} size="sm" className="rounded-full">
              <CalendarIcon className="w-4 h-4 mr-1" />
              {customMode ? `${format(dateFrom, "dd/MM")} - ${format(dateTo, "dd/MM")}` : "Personalizzato"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="flex flex-col sm:flex-row gap-2 p-4 max-h-[70vh] overflow-y-auto">
              <div>
                <p className="text-xs font-medium mb-2">Da</p>
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={(d) => { if (d) { setDateFrom(d); setCustomMode(true) } }}
                  locale={it}
                />
              </div>
              <div>
                <p className="text-xs font-medium mb-2">A</p>
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={(d) => { if (d) { setDateTo(d); setCustomMode(true) } }}
                  locale={it}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Report type selector */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {REPORT_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => setReportType(type.id)}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-300 press-feedback",
              reportType === type.id
                ? "border-primary bg-primary/5 text-primary shadow-sm"
                : "border-border hover:border-primary/30 text-muted-foreground hover:text-foreground"
            )}
          >
            <type.icon className="w-5 h-5" />
            <span className="text-xs font-semibold">{type.label}</span>
          </button>
        ))}
      </div>

      {/* Data preview */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-xl bg-muted/40" />
          <Skeleton className="h-64 rounded-xl bg-muted/40" />
        </div>
      ) : data ? (
        <ReportPreview type={reportType} data={data} />
      ) : null}
    </div>
  )
}

function ReportPreview({ type, data }: { type: ReportType; data: Record<string, unknown> }) {
  switch (type) {
    case "revenue": {
      const d = data as {
        byOperator: { name: string; appointments: number; revenue: number }[]
        byService: { name: string; bookings: number; revenue: number }[]
        totalRevenue: number
      }
      return (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Fatturato Totale</CardTitle></CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">€{(d.totalRevenue || 0).toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Per Operatore</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Operatore</TableHead><TableHead>Appuntamenti</TableHead><TableHead>Fatturato</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {d.byOperator?.map((r, i) => (
                    <TableRow key={i}><TableCell>{r.name}</TableCell><TableCell>{r.appointments}</TableCell><TableCell>€{(r.revenue || 0).toFixed(2)}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Per Servizio</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Servizio</TableHead><TableHead>Prenotazioni</TableHead><TableHead>Fatturato</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {d.byService?.map((r, i) => (
                    <TableRow key={i}><TableCell>{r.name}</TableCell><TableCell>{r.bookings}</TableCell><TableCell>€{(r.revenue || 0).toFixed(2)}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )
    }

    case "appointments": {
      const d = data as {
        byStatus: { status: string; count: number }[]
        byOperator: { name: string; count: number }[]
        total: number; noShowCount: number; noShowRate: number
      }
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Card><CardContent className="pt-6"><p className="text-2xl font-bold">{d.total}</p><p className="text-xs text-muted-foreground">Totale</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-2xl font-bold">{d.noShowCount}</p><p className="text-xs text-muted-foreground">No-Show</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-2xl font-bold">{d.noShowRate}%</p><p className="text-xs text-muted-foreground">Tasso No-Show</p></CardContent></Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-sm">Per Stato</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {d.byStatus?.map((r, i) => (
                <Badge key={i} variant="outline">{r.status}: {r.count}</Badge>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Per Operatore</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Operatore</TableHead><TableHead>Appuntamenti</TableHead></TableRow></TableHeader>
                <TableBody>
                  {d.byOperator?.map((r, i) => (
                    <TableRow key={i}><TableCell>{r.name}</TableCell><TableCell>{r.count}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )
    }

    case "clients": {
      const d = data as {
        newClients: number; totalClients: number
        tierDistribution: { tier: string; count: number }[]
        topSpenders: { name: string; email: string; totalSpent: number; loyaltyTier: string }[]
      }
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Card><CardContent className="pt-6"><p className="text-2xl font-bold">{d.totalClients}</p><p className="text-xs text-muted-foreground">Totale Clienti</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-2xl font-bold">{d.newClients}</p><p className="text-xs text-muted-foreground">Nuovi nel periodo</p></CardContent></Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-sm">Distribuzione Tier</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {d.tierDistribution?.map((r, i) => (
                <Badge key={i} variant="outline">{r.tier}: {r.count}</Badge>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Top 20 Spender</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Tier</TableHead><TableHead>Spesa Totale</TableHead></TableRow></TableHeader>
                <TableBody>
                  {d.topSpenders?.slice(0, 10).map((r, i) => (
                    <TableRow key={i}><TableCell>{r.name || r.email}</TableCell><TableCell><Badge variant="outline">{r.loyaltyTier}</Badge></TableCell><TableCell>€{(r.totalSpent || 0).toFixed(2)}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )
    }

    case "products": {
      const d = data as {
        topProducts: { name: string; quantitySold: number; revenue: number; currentStock: number }[]
        totalQuantity: number; totalRevenue: number
      }
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Card><CardContent className="pt-6"><p className="text-2xl font-bold">{d.totalQuantity}</p><p className="text-xs text-muted-foreground">Pezzi Venduti</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-2xl font-bold">€{(d.totalRevenue || 0).toFixed(2)}</p><p className="text-xs text-muted-foreground">Fatturato Prodotti</p></CardContent></Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-sm">Top Prodotti</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Prodotto</TableHead><TableHead>Venduti</TableHead><TableHead>Fatturato</TableHead><TableHead>Stock</TableHead></TableRow></TableHeader>
                <TableBody>
                  {d.topProducts?.map((r, i) => (
                    <TableRow key={i}><TableCell>{r.name}</TableCell><TableCell>{r.quantitySold}</TableCell><TableCell>€{(r.revenue || 0).toFixed(2)}</TableCell><TableCell>{r.currentStock}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )
    }

    case "loyalty": {
      const d = data as {
        earned: { points: number; transactions: number }
        redeemed: { points: number; transactions: number }
        net: number
      }
      return (
        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="pt-6"><p className="text-2xl font-bold text-green-500">+{d.earned?.points || 0}</p><p className="text-xs text-muted-foreground">Punti Emessi ({d.earned?.transactions || 0} tx)</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-2xl font-bold text-red-500">-{d.redeemed?.points || 0}</p><p className="text-xs text-muted-foreground">Punti Riscattati ({d.redeemed?.transactions || 0} tx)</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-2xl font-bold">{d.net || 0}</p><p className="text-xs text-muted-foreground">Saldo Netto</p></CardContent></Card>
        </div>
      )
    }

    case "reviews": {
      const d = data as {
        ratingDistribution: { rating: number; count: number }[]
        byOperator: { name: string; avgRating: number; count: number }[]
        total: number; avgRating: number
      }
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Card><CardContent className="pt-6"><p className="text-2xl font-bold">{d.total}</p><p className="text-xs text-muted-foreground">Totale Recensioni</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-2xl font-bold flex items-center gap-1"><Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />{d.avgRating}</p><p className="text-xs text-muted-foreground">Media</p></CardContent></Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-sm">Distribuzione Rating</CardTitle></CardHeader>
            <CardContent className="flex gap-3">
              {d.ratingDistribution?.map((r) => (
                <div key={r.rating} className="flex flex-col items-center gap-1">
                  <span className="text-lg font-bold">{r.count}</span>
                  <div className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs">{r.rating}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Per Operatore</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Operatore</TableHead><TableHead>Media</TableHead><TableHead>Recensioni</TableHead></TableRow></TableHeader>
                <TableBody>
                  {d.byOperator?.map((r, i) => (
                    <TableRow key={i}><TableCell>{r.name}</TableCell><TableCell>{r.avgRating}</TableCell><TableCell>{r.count}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )
    }

    default:
      return null
  }
}
