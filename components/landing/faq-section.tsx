"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
  {
    q: "Come posso prenotare un appuntamento?",
    a: "Registrati gratuitamente, scegli il servizio, l'operatore e l'orario che preferisci. Riceverai una conferma immediata via email.",
  },
  {
    q: "Posso scegliere il mio operatore preferito?",
    a: "Certo! Durante la prenotazione puoi selezionare l'esperto che preferisci. Il sistema ricorda le tue preferenze per le volte successive.",
  },
  {
    q: "Qual è la politica di cancellazione?",
    a: "Puoi cancellare o modificare il tuo appuntamento gratuitamente fino a 24 ore prima. Cancellazioni successive potrebbero comportare una penale.",
  },
  {
    q: "Quali metodi di pagamento accettate?",
    a: "Accettiamo contanti, carte di credito/debito e pagamenti digitali. Il pagamento avviene direttamente in salone.",
  },
  {
    q: "Il salone è unisex?",
    a: "Sì! Offriamo servizi per uomo e donna con operatori specializzati per ogni esigenza.",
  },
  {
    q: "Come funziona il programma fedeltà?",
    a: "Ad ogni visita e acquisto accumuli punti fedeltà che puoi riscattare per sconti e trattamenti omaggio. Più vieni, più risparmi!",
  },
]

export function FAQSection() {
  return (
    <Accordion type="single" collapsible className="space-y-3">
      {faqs.map((faq, i) => (
        <AccordionItem
          key={i}
          value={`faq-${i}`}
          className="glass rounded-xl border-0 px-6 overflow-hidden"
        >
          <AccordionTrigger className="text-left font-heading font-bold text-base hover:no-underline py-5">
            {faq.q}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
            {faq.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
