"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Plus, Pencil, Trash2, Save, Scissors, Users, ShoppingBag, Ticket, Settings, Store, Clock, Gift, FileText, Mail, Phone, MapPin, Package, Megaphone, Play } from "lucide-react"
import { campaignTypeLabels } from "@/lib/constants"

type Service = {
  id: string
  name: string
  description: string | null
  price: number
  duration: number
  category: string
  popular: boolean
  active: boolean
}

type Operator = {
  id: string
  name: string
  role: string
  specializations: string | null
  email: string | null
  phone: string | null
  bio: string | null
  commission: number | null
  image: string | null
  active: boolean
  rating: number
}

type Product = {
  id: string
  name: string
  description: string | null
  category: string
  price: number
  stock: number
  active: boolean
}

type Coupon = {
  id: string
  code: string
  type: string
  value: number
  minOrder: number
  maxUses: number | null
  usedCount: number
  expiresAt: string | null
  active: boolean
}

type PackageItem = {
  id: string
  name: string
  price: number
  originalPrice: number
  totalSessions: number
  validityDays: number
  active: boolean
  items: { service: { name: string } }[]
}

type CampaignItem = {
  id: string
  name: string
  type: string
  enabled: boolean
  lastRunAt: string | null
  _count: { messages: number }
}

type LocationItem = {
  id: string
  name: string
  address: string | null
  openTime: string
  closeTime: string
  active: boolean
  _count: { operators: number; appointments: number }
}

type BusinessSettingsType = {
  salonName: string
  address: string | null
  phone: string | null
  email: string | null
  openTime: string
  closeTime: string
  slotDuration: number
  loyaltyPointsPerEuro: number
  loyaltyRedemptionRate: number
  cancellationPolicy: string | null
}

export default function ImpostazioniPage() {
  const [services, setServices] = useState<Service[]>([])
  const [operators, setOperators] = useState<Operator[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [settings, setSettings] = useState<BusinessSettingsType>({
    salonName: "SalonPro",
    address: "",
    phone: "",
    email: "",
    openTime: "09:00",
    closeTime: "19:00",
    slotDuration: 30,
    loyaltyPointsPerEuro: 1,
    loyaltyRedemptionRate: 0.1,
    cancellationPolicy: "",
  })
  const [packages, setPackages] = useState<PackageItem[]>([])
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([])
  const [locations, setLocations] = useState<LocationItem[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const safeFetch = async (url: string) => {
        const r = await fetch(url)
        if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`)
        return r.json()
      }
      const [sRes, oRes, pRes, cRes, setRes, pkgRes, campRes, locRes] = await Promise.all([
        safeFetch("/api/services"),
        safeFetch("/api/operators"),
        safeFetch("/api/products"),
        safeFetch("/api/coupons"),
        safeFetch("/api/settings"),
        safeFetch("/api/packages").catch(() => []),
        safeFetch("/api/marketing/campaigns").catch(() => []),
        safeFetch("/api/locations").catch(() => []),
      ])
      setServices(sRes)
      setOperators(oRes)
      setProducts(pRes)
      if (Array.isArray(cRes)) setCoupons(cRes)
      if (Array.isArray(pkgRes)) setPackages(pkgRes)
      if (Array.isArray(campRes)) setCampaigns(campRes)
      if (Array.isArray(locRes)) setLocations(locRes)
      if (setRes && !setRes.error) {
        setSettings({
          salonName: setRes.salonName || "SalonPro",
          address: setRes.address || "",
          phone: setRes.phone || "",
          email: setRes.email || "",
          openTime: setRes.openTime || "09:00",
          closeTime: setRes.closeTime || "19:00",
          slotDuration: setRes.slotDuration || 30,
          loyaltyPointsPerEuro: setRes.loyaltyPointsPerEuro ?? 1,
          loyaltyRedemptionRate: setRes.loyaltyRedemptionRate ?? 0.1,
          cancellationPolicy: setRes.cancellationPolicy || "",
        })
      }
    } catch {
      toast.error("Errore nel caricamento dei dati")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  const tabCounts = [
    { value: "servizi", label: "Servizi", icon: Scissors, count: services.length },
    { value: "operatori", label: "Team", icon: Users, count: operators.length },
    { value: "prodotti", label: "Prodotti", icon: ShoppingBag, count: products.length },
    { value: "coupon", label: "Coupon", icon: Ticket, count: coupons.length },
    { value: "pacchetti", label: "Pacchetti", icon: Package, count: packages.length },
    { value: "marketing", label: "Marketing", icon: Megaphone, count: campaigns.length },
    { value: "sedi", label: "Sedi", icon: MapPin, count: locations.length },
    { value: "salone", label: "Salone", icon: Store, count: null },
  ]

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-extrabold">Impostazioni</h1>
        <p className="text-muted-foreground mt-1">Gestisci il tuo salone</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Servizi attivi", value: services.filter((s) => s.active).length, total: services.length, icon: Scissors, color: "text-primary" },
          { label: "Team attivo", value: operators.filter((o) => o.active).length, total: operators.length, icon: Users, color: "text-blue-500" },
          { label: "Prodotti attivi", value: products.filter((p) => p.active).length, total: products.length, icon: ShoppingBag, color: "text-green-500" },
          { label: "Coupon attivi", value: coupons.filter((c) => c.active).length, total: coupons.length, icon: Ticket, color: "text-amber-500" },
        ].map((stat) => (
          <Card key={stat.label} className="glass border-0">
            <CardContent className="p-3 flex items-center gap-3">
              <div className={cn("w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center", stat.color)}>
                <stat.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-lg font-heading font-extrabold">{stat.value}<span className="text-xs text-muted-foreground font-normal">/{stat.total}</span></p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="servizi">
        <TabsList className="flex overflow-x-auto h-auto gap-1 w-full justify-start no-scrollbar">
          {tabCounts.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 text-xs shrink-0">
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.count !== null && (
                <Badge variant="secondary" className="text-[10px] px-1 py-0 ml-0.5 h-4 min-w-[16px] justify-center">
                  {tab.count}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ===== SERVIZI TAB ===== */}
        <TabsContent value="servizi" className="mt-6">
          <ServiziTab services={services} onRefresh={loadData} />
        </TabsContent>

        {/* ===== OPERATORI TAB ===== */}
        <TabsContent value="operatori" className="mt-6">
          <OperatoriTab operators={operators} onRefresh={loadData} />
        </TabsContent>

        {/* ===== PRODOTTI TAB ===== */}
        <TabsContent value="prodotti" className="mt-6">
          <ProdottiTab products={products} onRefresh={loadData} />
        </TabsContent>

        {/* ===== COUPON TAB ===== */}
        <TabsContent value="coupon" className="mt-6">
          <CouponTab coupons={coupons} onRefresh={loadData} />
        </TabsContent>

        {/* ===== PACCHETTI TAB ===== */}
        <TabsContent value="pacchetti" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold">Pacchetti Servizi</h3>
            </div>
            {packages.length === 0 ? (
              <Card className="p-8 text-center">
                <Package className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-muted-foreground text-sm">Nessun pacchetto. Crea il primo dalla pagina /pacchetti.</p>
              </Card>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Prezzo</TableHead>
                    <TableHead>Sessioni</TableHead>
                    <TableHead>Validità</TableHead>
                    <TableHead>Attivo</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packages.map((pkg) => (
                    <TableRow key={pkg.id}>
                      <TableCell className="font-medium">{pkg.name}</TableCell>
                      <TableCell>€{pkg.price.toFixed(2)} <span className="text-xs text-muted-foreground line-through">€{pkg.originalPrice.toFixed(2)}</span></TableCell>
                      <TableCell>{pkg.totalSessions}</TableCell>
                      <TableCell>{pkg.validityDays}gg</TableCell>
                      <TableCell><Badge variant={pkg.active ? "default" : "secondary"}>{pkg.active ? "Sì" : "No"}</Badge></TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={async () => {
                          await fetch(`/api/packages/${pkg.id}`, { method: "DELETE" })
                          toast.success("Pacchetto disattivato")
                          loadData()
                        }}><Trash2 className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {/* ===== MARKETING TAB ===== */}
        <TabsContent value="marketing" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold">Campagne Marketing</h3>
              <Button size="sm" variant="outline" onClick={async () => {
                const res = await fetch("/api/marketing/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) })
                if (res.ok) {
                  const data = await res.json()
                  const total = data.results?.reduce((s: number, r: { messagesSent: number }) => s + r.messagesSent, 0) || 0
                  toast.success(`${total} messaggi inviati`)
                  loadData()
                } else toast.error("Errore")
              }}><Play className="w-4 h-4 mr-1" /> Esegui Tutte</Button>
            </div>
            {campaigns.length === 0 ? (
              <Card className="p-8 text-center">
                <Megaphone className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-muted-foreground text-sm">Nessuna campagna configurata.</p>
              </Card>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Attiva</TableHead>
                    <TableHead>Messaggi</TableHead>
                    <TableHead>Ultimo invio</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell><Badge variant="outline">{campaignTypeLabels[c.type] || c.type}</Badge></TableCell>
                      <TableCell>
                        <Switch checked={c.enabled} onCheckedChange={async (enabled) => {
                          await fetch(`/api/marketing/campaigns/${c.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled }) })
                          loadData()
                        }} />
                      </TableCell>
                      <TableCell>{c._count.messages}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{c.lastRunAt ? new Date(c.lastRunAt).toLocaleDateString("it-IT") : "Mai"}</TableCell>
                      <TableCell className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={async () => {
                          await fetch(`/api/marketing/campaigns/${c.id}`, { method: "POST" })
                          toast.success("Campagna eseguita")
                          loadData()
                        }}><Play className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={async () => {
                          await fetch(`/api/marketing/campaigns/${c.id}`, { method: "DELETE" })
                          toast.success("Campagna eliminata")
                          loadData()
                        }}><Trash2 className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {/* ===== SEDI TAB ===== */}
        <TabsContent value="sedi" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold">Sedi</h3>
            </div>
            {locations.length === 0 ? (
              <Card className="p-8 text-center">
                <MapPin className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-muted-foreground text-sm">Nessuna sede configurata.</p>
              </Card>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Indirizzo</TableHead>
                    <TableHead>Orari</TableHead>
                    <TableHead>Operatori</TableHead>
                    <TableHead>Attiva</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map((loc) => (
                    <TableRow key={loc.id}>
                      <TableCell className="font-medium">{loc.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{loc.address || "-"}</TableCell>
                      <TableCell className="text-sm">{loc.openTime} - {loc.closeTime}</TableCell>
                      <TableCell>{loc._count.operators}</TableCell>
                      <TableCell><Badge variant={loc.active ? "default" : "secondary"}>{loc.active ? "Sì" : "No"}</Badge></TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={async () => {
                          await fetch(`/api/locations/${loc.id}`, { method: "DELETE" })
                          toast.success("Sede disattivata")
                          loadData()
                        }}><Trash2 className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {/* ===== SALONE TAB ===== */}
        <TabsContent value="salone" className="mt-6">
          <SaloneTab settings={settings} setSettings={setSettings} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

/* ======================= SERVIZI TAB ======================= */

function ServiziTab({ services, onRefresh }: { services: Service[]; onRefresh: () => void }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: 0,
    duration: 30,
    category: "",
    popular: false,
  })

  const resetForm = () => {
    setForm({ name: "", description: "", price: 0, duration: 30, category: "", popular: false })
    setEditingService(null)
  }

  const openEdit = (service: Service) => {
    setEditingService(service)
    setForm({
      name: service.name,
      description: service.description || "",
      price: service.price,
      duration: service.duration,
      category: service.category,
      popular: service.popular,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      const url = editingService ? `/api/services/${editingService.id}` : "/api/services"
      const method = editingService ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "Errore nel salvataggio")
        return
      }
      toast.success(editingService ? "Servizio aggiornato" : "Servizio creato")
      setDialogOpen(false)
      resetForm()
      onRefresh()
    } catch {
      toast.error("Errore nel salvataggio")
    }
  }

  const handleToggleActive = async (service: Service) => {
    try {
      await fetch(`/api/services/${service.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !service.active }),
      })
      toast.success(service.active ? "Servizio disattivato" : "Servizio attivato")
      onRefresh()
    } catch {
      toast.error("Errore")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminare questo servizio?")) return
    try {
      await fetch(`/api/services/${id}`, { method: "DELETE" })
      toast.success("Servizio eliminato")
      onRefresh()
    } catch {
      toast.error("Errore nell'eliminazione")
    }
  }

  return (
    <Card className="glass">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Servizi</CardTitle>
          <CardDescription>Gestisci i servizi del salone</CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" /> Aggiungi Servizio
            </Button>
          </DialogTrigger>
          <DialogContent aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>
                {editingService ? "Modifica Servizio" : "Nuovo Servizio"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label>Descrizione</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Prezzo (€)</Label>
                  <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label>Durata (min)</Label>
                  <Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 30 })} />
                </div>
              </div>
              <div>
                <Label>Categoria</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.popular} onCheckedChange={(checked) => setForm({ ...form, popular: checked })} />
                <Label>Popolare</Label>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Annulla</Button>
              </DialogClose>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-1" /> Salva
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Prezzo</TableHead>
              <TableHead>Durata</TableHead>
              <TableHead>Attivo</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service.id}>
                <TableCell className="font-medium">{service.name}</TableCell>
                <TableCell>{service.category}</TableCell>
                <TableCell>€{service.price.toFixed(2)}</TableCell>
                <TableCell>{service.duration} min</TableCell>
                <TableCell>
                  <Switch
                    checked={service.active}
                    onCheckedChange={() => handleToggleActive(service)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(service)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(service.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {services.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nessun servizio configurato
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

/* ======================= OPERATORI TAB ======================= */

function OperatoriTab({ operators, onRefresh }: { operators: Operator[]; onRefresh: () => void }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingOp, setEditingOp] = useState<Operator | null>(null)
  const [form, setForm] = useState({
    name: "",
    role: "",
    specializations: "",
    email: "",
    phone: "",
    bio: "",
    commission: 0,
  })

  const resetForm = () => {
    setForm({ name: "", role: "", specializations: "", email: "", phone: "", bio: "", commission: 0 })
    setEditingOp(null)
  }

  const openEdit = (op: Operator) => {
    setEditingOp(op)
    setForm({
      name: op.name,
      role: op.role,
      specializations: op.specializations || "",
      email: op.email || "",
      phone: op.phone || "",
      bio: op.bio || "",
      commission: op.commission || 0,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      const url = editingOp ? `/api/operators/${editingOp.id}` : "/api/operators"
      const method = editingOp ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "Errore nel salvataggio")
        return
      }
      toast.success(editingOp ? "Operatore aggiornato" : "Operatore aggiunto")
      setDialogOpen(false)
      resetForm()
      onRefresh()
    } catch {
      toast.error("Errore nel salvataggio")
    }
  }

  const handleDelete = async (op: Operator) => {
    if (!confirm(`Disattivare l'operatore ${op.name}?`)) return
    try {
      const res = await fetch(`/api/operators/${op.id}`, { method: "DELETE" })
      if (!res.ok) {
        toast.error("Errore nella rimozione")
        return
      }
      toast.success("Operatore rimosso")
      onRefresh()
    } catch {
      toast.error("Errore nella rimozione")
    }
  }

  const handleToggleActive = async (op: Operator) => {
    try {
      await fetch(`/api/operators/${op.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !op.active }),
      })
      toast.success(op.active ? "Operatore disattivato" : "Operatore attivato")
      onRefresh()
    } catch {
      toast.error("Errore")
    }
  }

  return (
    <Card className="glass">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Operatori</CardTitle>
          <CardDescription>Gestisci il team del salone</CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" /> Aggiungi Operatore
            </Button>
          </DialogTrigger>
          <DialogContent aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>
                {editingOp ? "Modifica Operatore" : "Nuovo Operatore"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Nome</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <Label>Ruolo</Label>
                  <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Es. Senior Stylist" />
                </div>
              </div>
              <div>
                <Label>Specializzazioni (separate da virgola)</Label>
                <Input value={form.specializations} onChange={(e) => setForm({ ...form, specializations: e.target.value })} placeholder="Es. Colore, Taglio, Barba" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <Label>Telefono</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Bio</Label>
                <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
              </div>
              <div>
                <Label>Commissione (%)</Label>
                <Input type="number" min={0} max={100} value={form.commission} onChange={(e) => setForm({ ...form, commission: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Annulla</Button>
              </DialogClose>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-1" /> Salva
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {operators.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nessun operatore configurato</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {operators.map((op) => (
              <Card key={op.id} className="glass">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                        {op.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold">{op.name}</p>
                        <p className="text-sm text-muted-foreground">{op.role}</p>
                        {op.rating > 0 && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Rating: {op.rating.toFixed(1)}/5
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(op)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(op)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Switch
                        checked={op.active}
                        onCheckedChange={() => handleToggleActive(op)}
                      />
                    </div>
                  </div>
                  {op.specializations && (
                    <div className="flex gap-1 flex-wrap mt-3">
                      {op.specializations.split(",").map((s) => (
                        <Badge key={s} variant="outline" className="text-xs">
                          {s.trim()}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/* ======================= PRODOTTI TAB ======================= */

function ProdottiTab({ products, onRefresh }: { products: Product[]; onRefresh: () => void }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    price: 0,
    stock: 0,
  })

  const resetForm = () => {
    setForm({ name: "", description: "", category: "", price: 0, stock: 0 })
    setEditingProduct(null)
  }

  const openEdit = (product: Product) => {
    setEditingProduct(product)
    setForm({
      name: product.name,
      description: product.description || "",
      category: product.category,
      price: product.price,
      stock: product.stock,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products"
      const method = editingProduct ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "Errore nel salvataggio")
        return
      }
      toast.success(editingProduct ? "Prodotto aggiornato" : "Prodotto creato")
      setDialogOpen(false)
      resetForm()
      onRefresh()
    } catch {
      toast.error("Errore nel salvataggio")
    }
  }

  const handleToggleActive = async (product: Product) => {
    try {
      await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !product.active }),
      })
      toast.success(product.active ? "Prodotto disattivato" : "Prodotto attivato")
      onRefresh()
    } catch {
      toast.error("Errore")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminare questo prodotto?")) return
    try {
      await fetch(`/api/products/${id}`, { method: "DELETE" })
      toast.success("Prodotto eliminato")
      onRefresh()
    } catch {
      toast.error("Errore nell'eliminazione")
    }
  }

  return (
    <Card className="glass">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Prodotti</CardTitle>
          <CardDescription>Gestisci il catalogo prodotti</CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" /> Aggiungi Prodotto
            </Button>
          </DialogTrigger>
          <DialogContent aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Modifica Prodotto" : "Nuovo Prodotto"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label>Descrizione</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <Label>Categoria</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Prezzo (€)</Label>
                  <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label>Stock</Label>
                  <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Annulla</Button>
              </DialogClose>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-1" /> Salva
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Prezzo</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Attivo</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>€{product.price.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={product.stock > 10 ? "default" : "destructive"}>
                    {product.stock}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={product.active}
                    onCheckedChange={() => handleToggleActive(product)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(product)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nessun prodotto configurato
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

/* ======================= COUPON TAB ======================= */

function CouponTab({ coupons, onRefresh }: { coupons: Coupon[]; onRefresh: () => void }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [form, setForm] = useState({
    code: "",
    type: "PERCENTAGE" as string,
    value: 0,
    minOrder: 0,
    maxUses: 0,
    expiresAt: "",
  })

  const resetForm = () => {
    setForm({ code: "", type: "PERCENTAGE", value: 0, minOrder: 0, maxUses: 0, expiresAt: "" })
    setEditingCoupon(null)
  }

  const openEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minOrder: coupon.minOrder,
      maxUses: coupon.maxUses || 0,
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split("T")[0] : "",
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        maxUses: form.maxUses > 0 ? form.maxUses : undefined,
        expiresAt: form.expiresAt || undefined,
      }
      const url = editingCoupon ? `/api/coupons/${editingCoupon.id}` : "/api/coupons"
      const method = editingCoupon ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "Errore nel salvataggio")
        return
      }
      toast.success(editingCoupon ? "Coupon aggiornato" : "Coupon creato")
      setDialogOpen(false)
      resetForm()
      onRefresh()
    } catch {
      toast.error("Errore nel salvataggio")
    }
  }

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      await fetch(`/api/coupons/${coupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !coupon.active }),
      })
      toast.success(coupon.active ? "Coupon disattivato" : "Coupon attivato")
      onRefresh()
    } catch {
      toast.error("Errore")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminare questo coupon?")) return
    try {
      await fetch(`/api/coupons/${id}`, { method: "DELETE" })
      toast.success("Coupon eliminato")
      onRefresh()
    } catch {
      toast.error("Errore nell'eliminazione")
    }
  }

  return (
    <Card className="glass">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Coupon</CardTitle>
          <CardDescription>Gestisci i codici sconto</CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" /> Aggiungi Coupon
            </Button>
          </DialogTrigger>
          <DialogContent aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>
                {editingCoupon ? "Modifica Coupon" : "Nuovo Coupon"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Codice</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="Es. SCONTO20" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Tipo</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Percentuale (%)</SelectItem>
                      <SelectItem value="FIXED">Fisso (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Valore</Label>
                  <Input type="number" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Ordine Minimo (€)</Label>
                  <Input type="number" step="0.01" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label>Utilizzi Massimi</Label>
                  <Input type="number" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: parseInt(e.target.value) || 0 })} placeholder="0 = illimitati" />
                </div>
              </div>
              <div>
                <Label>Data Scadenza</Label>
                <Input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Annulla</Button>
              </DialogClose>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-1" /> Salva
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Codice</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valore</TableHead>
              <TableHead>Min. Ordine</TableHead>
              <TableHead>Utilizzi</TableHead>
              <TableHead>Scadenza</TableHead>
              <TableHead>Attivo</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.map((coupon) => (
              <TableRow key={coupon.id}>
                <TableCell className="font-mono font-medium">{coupon.code}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {coupon.type === "PERCENTAGE" ? "%" : "€"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {coupon.type === "PERCENTAGE" ? `${coupon.value}%` : `€${coupon.value.toFixed(2)}`}
                </TableCell>
                <TableCell>€{coupon.minOrder.toFixed(2)}</TableCell>
                <TableCell>
                  {coupon.usedCount}{coupon.maxUses ? `/${coupon.maxUses}` : ""}
                </TableCell>
                <TableCell>
                  {coupon.expiresAt
                    ? new Date(coupon.expiresAt).toLocaleDateString("it-IT")
                    : "Mai"}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={coupon.active}
                    onCheckedChange={() => handleToggleActive(coupon)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(coupon)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(coupon.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {coupons.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Nessun coupon configurato
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

/* ======================= SALONE TAB ======================= */

function SaloneTab({
  settings,
  setSettings,
}: {
  settings: BusinessSettingsType
  setSettings: (s: BusinessSettingsType) => void
}) {
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "Errore nel salvataggio")
        return
      }
      toast.success("Impostazioni salvate")
    } catch {
      toast.error("Errore nel salvataggio")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Informazioni Salone */}
      <Card className="glass border-0">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Store className="w-4 h-4 text-primary" />
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Informazioni Salone</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs flex items-center gap-1.5 mb-1"><Store className="w-3 h-3" /> Nome Salone</Label>
              <Input value={settings.salonName} onChange={(e) => setSettings({ ...settings, salonName: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1.5 mb-1"><Mail className="w-3 h-3" /> Email</Label>
              <Input type="email" value={settings.email || ""} onChange={(e) => setSettings({ ...settings, email: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1.5 mb-1"><MapPin className="w-3 h-3" /> Indirizzo</Label>
              <Input value={settings.address || ""} onChange={(e) => setSettings({ ...settings, address: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1.5 mb-1"><Phone className="w-3 h-3" /> Telefono</Label>
              <Input value={settings.phone || ""} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orari & Slot */}
      <Card className="glass border-0">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-primary" />
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Orari & Prenotazioni</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs mb-1">Apertura</Label>
              <Input type="time" value={settings.openTime} onChange={(e) => setSettings({ ...settings, openTime: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs mb-1">Chiusura</Label>
              <Input type="time" value={settings.closeTime} onChange={(e) => setSettings({ ...settings, closeTime: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs mb-1">Durata Slot (min)</Label>
              <Input type="number" min={5} max={120} value={settings.slotDuration} onChange={(e) => setSettings({ ...settings, slotDuration: parseInt(e.target.value) || 30 })} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fedeltà */}
      <Card className="glass border-0">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Gift className="w-4 h-4 text-primary" />
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Programma Fedeltà</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1">Punti per Euro speso</Label>
              <Input type="number" step="0.1" min={0} value={settings.loyaltyPointsPerEuro} onChange={(e) => setSettings({ ...settings, loyaltyPointsPerEuro: parseFloat(e.target.value) || 0 })} />
              <p className="text-[10px] text-muted-foreground mt-1">Es: 1 = il cliente guadagna 1 punto per ogni euro speso</p>
            </div>
            <div>
              <Label className="text-xs mb-1">Valore Riscatto (€ per punto)</Label>
              <Input type="number" step="0.01" min={0} value={settings.loyaltyRedemptionRate} onChange={(e) => setSettings({ ...settings, loyaltyRedemptionRate: parseFloat(e.target.value) || 0 })} />
              <p className="text-[10px] text-muted-foreground mt-1">Es: 0.10 = ogni punto vale €0,10 di sconto</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Politica Cancellazione */}
      <Card className="glass border-0">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-primary" />
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Politica di Cancellazione</p>
          </div>
          <Textarea
            value={settings.cancellationPolicy || ""}
            onChange={(e) => setSettings({ ...settings, cancellationPolicy: e.target.value })}
            rows={3}
            placeholder="Inserisci la politica di cancellazione del salone..."
          />
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto gap-2">
        <Save className="w-4 h-4" />
        {saving ? "Salvataggio..." : "Salva Impostazioni"}
      </Button>
    </div>
  )
}
