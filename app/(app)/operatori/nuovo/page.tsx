"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function NuovoOperatorePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    name: "",
    role: "",
    email: "",
    phone: "",
    specializations: "",
    bio: "",
    commission: "",
    image: "",
  })

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const body: Record<string, unknown> = {
        name: form.name,
        role: form.role,
        active: true,
      }

      if (form.email) body.email = form.email
      if (form.phone) body.phone = form.phone
      if (form.specializations) body.specializations = form.specializations
      if (form.bio) body.bio = form.bio
      if (form.commission) body.commission = parseFloat(form.commission)
      if (form.image) body.image = form.image

      const res = await fetch("/api/operators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || "Errore durante la creazione dell'operatore")
      }

      toast.success("Operatore creato con successo")
      router.push("/operatori")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Errore durante la creazione dell'operatore"
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 animate-slide-up">
        <Link href="/operatori">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-heading font-extrabold">
            Nuovo Operatore
          </h1>
        </div>
      </div>

      {/* Form */}
      <Card className="glass animate-slide-up" style={{ animationDelay: "50ms" }}>
        <CardHeader>
          <CardTitle className="text-lg font-heading">
            Informazioni Operatore
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="es. Mario Rossi"
                  value={form.name}
                  onChange={handleChange}
                  required
                  minLength={2}
                />
              </div>

              {/* Ruolo */}
              <div className="space-y-2">
                <Label htmlFor="role">Ruolo *</Label>
                <Input
                  id="role"
                  name="role"
                  placeholder="es. Parrucchiere, Colorista"
                  value={form.role}
                  onChange={handleChange}
                  required
                  minLength={2}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="es. mario@salone.it"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>

              {/* Telefono */}
              <div className="space-y-2">
                <Label htmlFor="phone">Telefono</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="es. +39 333 1234567"
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>

              {/* Commissione */}
              <div className="space-y-2">
                <Label htmlFor="commission">Commissione (%)</Label>
                <Input
                  id="commission"
                  name="commission"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  placeholder="es. 30"
                  value={form.commission}
                  onChange={handleChange}
                />
              </div>

              {/* Immagine */}
              <div className="space-y-2">
                <Label htmlFor="image">URL Immagine</Label>
                <Input
                  id="image"
                  name="image"
                  type="url"
                  placeholder="https://..."
                  value={form.image}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Specializzazioni */}
            <div className="space-y-2">
              <Label htmlFor="specializations">Specializzazioni</Label>
              <Input
                id="specializations"
                name="specializations"
                placeholder="es. Taglio uomo, Colore, Balayage (separate da virgola)"
                value={form.specializations}
                onChange={handleChange}
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Biografia</Label>
              <Textarea
                id="bio"
                name="bio"
                placeholder="Breve descrizione dell'operatore..."
                rows={4}
                value={form.bio}
                onChange={handleChange}
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-2">
              <Button type="submit" className="btn-gradient" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Crea Operatore
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
