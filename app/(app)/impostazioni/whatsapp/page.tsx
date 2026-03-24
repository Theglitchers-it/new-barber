"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { copyToClipboard } from "@/lib/utils"
import { MessageCircle, Send, CheckCircle2, XCircle, ArrowLeft, ExternalLink, Info } from "lucide-react"
import Link from "next/link"

export default function WhatsAppSettingsPage() {
  const [testPhone, setTestPhone] = useState("")
  const [testMessage, setTestMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"checking" | "connected" | "disconnected">("checking")

  useEffect(() => {
    fetch("/api/whatsapp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "test", message: "test" }),
    })
      .then((r) => {
        // 400 = endpoint works, just invalid input format
        // 403 = user is not admin
        if (r.status === 400) {
          setConnectionStatus("connected")
        } else {
          setConnectionStatus("disconnected")
        }
      })
      .catch(() => setConnectionStatus("disconnected"))
  }, [])

  const handleSendTest = async () => {
    if (!testPhone.trim()) {
      toast.error("Inserisci un numero di telefono")
      return
    }
    if (!testMessage.trim()) {
      toast.error("Inserisci un messaggio")
      return
    }

    setSending(true)
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: testPhone, message: testMessage }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success("Messaggio di test inviato con successo!")
        setTestMessage("")
      } else {
        toast.error(data.error || "Errore nell'invio del messaggio")
      }
    } catch {
      toast.error("Errore di connessione")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/impostazioni">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-green-600" />
            WhatsApp Business
          </h1>
          <p className="text-muted-foreground">
            Configura il bot WhatsApp per le prenotazioni automatiche
          </p>
        </div>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Stato Connessione</CardTitle>
          <CardDescription>
            Verifica che le API WhatsApp siano configurate correttamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {connectionStatus === "checking" && (
              <Badge variant="secondary" className="gap-1.5 py-1.5 px-3">
                <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                Verifica in corso...
              </Badge>
            )}
            {connectionStatus === "connected" && (
              <Badge variant="secondary" className="gap-1.5 py-1.5 px-3 bg-green-50 text-green-700 border-green-200">
                <CheckCircle2 className="h-4 w-4" />
                Endpoint attivo
              </Badge>
            )}
            {connectionStatus === "disconnected" && (
              <Badge variant="secondary" className="gap-1.5 py-1.5 px-3 bg-red-50 text-red-700 border-red-200">
                <XCircle className="h-4 w-4" />
                Non configurato
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Se le variabili d&apos;ambiente non sono configurate, i messaggi verranno stampati nella console del server (modalita sviluppo).
          </p>
        </CardContent>
      </Card>

      {/* Test Message */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Send className="h-5 w-5" />
            Invia Messaggio di Test
          </CardTitle>
          <CardDescription>
            Verifica il funzionamento inviando un messaggio WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-phone">Numero di Telefono</Label>
            <Input
              id="test-phone"
              placeholder="+39 333 1234567"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Formato internazionale con prefisso (es. +39 per Italia)
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="test-message">Messaggio</Label>
            <Input
              id="test-message"
              placeholder="Ciao! Questo e un messaggio di test."
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
            />
          </div>
          <Button onClick={handleSendTest} disabled={sending}>
            {sending ? "Invio in corso..." : "Invia Messaggio di Test"}
          </Button>
        </CardContent>
      </Card>

      {/* Webhook URL */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">URL Webhook</CardTitle>
          <CardDescription>
            Configura questo URL nella dashboard di WhatsApp Business
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-muted px-3 py-2 rounded-md text-sm font-mono break-all">
              {typeof window !== "undefined"
                ? `${window.location.origin}/api/whatsapp/webhook`
                : "https://tuodominio.com/api/whatsapp/webhook"}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await copyToClipboard(`${window.location.origin}/api/whatsapp/webhook`)
                toast.success("URL copiato negli appunti")
              }}
            >
              Copia
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">Token di Verifica:</Label>
            <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
              salonpro-webhook-verify-2026
            </code>
          </div>
        </CardContent>
      </Card>

      {/* Bot Features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-5 w-5" />
            Funzionalita del Bot
          </CardTitle>
          <CardDescription>
            Comandi disponibili per i clienti via WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Badge variant="outline" className="mt-0.5 font-mono">prenota</Badge>
              <div>
                <p className="font-medium text-sm">Prenota un appuntamento</p>
                <p className="text-xs text-muted-foreground">
                  Avvia il flusso di prenotazione guidata: scelta servizio, operatore, data e orario
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Badge variant="outline" className="mt-0.5 font-mono">stato</Badge>
              <div>
                <p className="font-medium text-sm">Verifica appuntamento</p>
                <p className="text-xs text-muted-foreground">
                  Mostra i dettagli del prossimo appuntamento prenotato
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Badge variant="outline" className="mt-0.5 font-mono">annulla</Badge>
              <div>
                <p className="font-medium text-sm">Annulla appuntamento</p>
                <p className="text-xs text-muted-foreground">
                  Annulla il prossimo appuntamento in programma
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Setup Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Guida alla Configurazione</CardTitle>
          <CardDescription>
            Segui questi passaggi per collegare WhatsApp Business
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="space-y-4 text-sm">
            <li className="flex gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                1
              </span>
              <div>
                <p className="font-medium">Crea un&apos;app su Meta for Developers</p>
                <p className="text-muted-foreground">
                  Vai su{" "}
                  <a
                    href="https://developers.facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline inline-flex items-center gap-1"
                  >
                    developers.facebook.com
                    <ExternalLink className="h-3 w-3" />
                  </a>{" "}
                  e crea una nuova app di tipo &quot;Business&quot;.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                2
              </span>
              <div>
                <p className="font-medium">Aggiungi il prodotto WhatsApp</p>
                <p className="text-muted-foreground">
                  Nella dashboard dell&apos;app, aggiungi &quot;WhatsApp&quot; come prodotto e configura un numero di telefono.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                3
              </span>
              <div>
                <p className="font-medium">Copia le credenziali</p>
                <p className="text-muted-foreground">
                  Copia il <strong>Token di accesso permanente</strong> e il <strong>Phone Number ID</strong> dalla sezione API Setup.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                4
              </span>
              <div>
                <p className="font-medium">Configura le variabili d&apos;ambiente</p>
                <p className="text-muted-foreground">
                  Aggiungi nel file <code className="bg-muted px-1 rounded">.env</code>:
                </p>
                <pre className="mt-2 bg-muted p-3 rounded-md text-xs font-mono overflow-x-auto">
{`WHATSAPP_API_TOKEN="il-tuo-token"
WHATSAPP_PHONE_NUMBER_ID="il-tuo-phone-id"
WHATSAPP_APP_SECRET="il-tuo-app-secret"`}
                </pre>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                5
              </span>
              <div>
                <p className="font-medium">Configura il Webhook</p>
                <p className="text-muted-foreground">
                  Nella sezione &quot;Webhooks&quot; dell&apos;app Meta, inserisci l&apos;URL del webhook (mostrato sopra) e il token di verifica. Sottoscrivi gli eventi <strong>messages</strong>.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                6
              </span>
              <div>
                <p className="font-medium">Testa il bot</p>
                <p className="text-muted-foreground">
                  Invia &quot;Ciao&quot; o &quot;Prenota&quot; al numero WhatsApp configurato per verificare che tutto funzioni.
                </p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
