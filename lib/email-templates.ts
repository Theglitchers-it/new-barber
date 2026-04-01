const BRAND_COLOR = "#c83232"
const BRAND_GRADIENT = "linear-gradient(135deg, #c83232, #6b3fa0, #2b3a8c)"

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

function safeHref(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) return url
  return "#"
}

function layout(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:32px 16px">
  <div style="text-align:center;padding:24px 0">
    <span style="font-size:24px;font-weight:800;background:${BRAND_GRADIENT};-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">SalonPro</span>
  </div>
  <div style="background:white;border-radius:16px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
    ${content}
  </div>
  <p style="text-align:center;color:#a1a1aa;font-size:12px;margin-top:24px">
    &copy; ${new Date().getFullYear()} SalonPro — Il salone che ti capisce
  </p>
</div>
</body>
</html>`
}

function button(text: string, href: string): string {
  return `<a href="${safeHref(href)}" style="display:inline-block;background:${BRAND_GRADIENT};color:white;text-decoration:none;font-weight:700;font-size:14px;padding:12px 28px;border-radius:12px;margin:16px 0">${escapeHtml(text)}</a>`
}

// ===== APPOINTMENT CONFIRMATION =====

interface AppointmentData {
  customerName: string
  serviceName: string
  operatorName: string
  date: string
  startTime: string
  endTime: string
  totalPrice: number
  address?: string
  calendarUrl?: string
}

export function appointmentConfirmation(data: AppointmentData): string {
  const e = { ...data, customerName: escapeHtml(data.customerName), serviceName: escapeHtml(data.serviceName), operatorName: escapeHtml(data.operatorName), address: data.address ? escapeHtml(data.address) : undefined }
  return layout(`
    <h2 style="margin:0 0 8px;font-size:20px;color:#18181b">Prenotazione confermata!</h2>
    <p style="color:#71717a;margin:0 0 24px">Ciao ${e.customerName}, il tuo appuntamento è stato confermato.</p>

    <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:16px 0">
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="padding:6px 0;color:#71717a;font-size:13px;width:110px">Servizio</td>
          <td style="padding:6px 0;font-weight:600;font-size:14px">${data.serviceName}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#71717a;font-size:13px">Operatore</td>
          <td style="padding:6px 0;font-weight:600;font-size:14px">${data.operatorName}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#71717a;font-size:13px">Data</td>
          <td style="padding:6px 0;font-weight:600;font-size:14px">${data.date}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#71717a;font-size:13px">Orario</td>
          <td style="padding:6px 0;font-weight:600;font-size:14px">${data.startTime} — ${data.endTime}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#71717a;font-size:13px">Totale</td>
          <td style="padding:6px 0;font-weight:700;font-size:16px;color:${BRAND_COLOR}">&euro;${data.totalPrice.toFixed(2)}</td>
        </tr>
        ${data.address ? `<tr><td style="padding:6px 0;color:#71717a;font-size:13px">Indirizzo</td><td style="padding:6px 0;font-size:14px">${data.address}</td></tr>` : ""}
      </table>
    </div>

    <div style="text-align:center">
      ${data.calendarUrl ? button("Aggiungi al calendario", data.calendarUrl) : ""}
    </div>

    <p style="color:#a1a1aa;font-size:12px;margin-top:24px;text-align:center">Se hai bisogno di modificare o cancellare, accedi al tuo account.</p>
  `)
}

// ===== APPOINTMENT REMINDER =====

export function appointmentReminder(data: AppointmentData): string {
  return layout(`
    <h2 style="margin:0 0 8px;font-size:20px;color:#18181b">Promemoria appuntamento</h2>
    <p style="color:#71717a;margin:0 0 24px">Ciao ${data.customerName}, ti ricordiamo il tuo appuntamento di domani.</p>

    <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:16px 0">
      <p style="margin:0;font-size:18px;font-weight:700">${data.serviceName}</p>
      <p style="margin:4px 0 0;color:#71717a">con ${data.operatorName}</p>
      <p style="margin:12px 0 0;font-size:16px;font-weight:600">${data.date} alle ${data.startTime}</p>
      ${data.address ? `<p style="margin:8px 0 0;color:#71717a;font-size:13px">${data.address}</p>` : ""}
    </div>

    <p style="color:#71717a;font-size:13px;text-align:center">Ti aspettiamo!</p>
  `)
}

// ===== ORDER CONFIRMATION =====

interface OrderData {
  customerName: string
  orderId: string
  items: { name: string; quantity: number; price: number }[]
  total: number
}

export function orderConfirmation(data: OrderData): string {
  const rows = data.items.map((item) =>
    `<tr>
      <td style="padding:8px 0;font-size:14px;border-bottom:1px solid #f4f4f5">${item.name}</td>
      <td style="padding:8px 0;font-size:14px;text-align:center;border-bottom:1px solid #f4f4f5">${item.quantity}</td>
      <td style="padding:8px 0;font-size:14px;text-align:right;border-bottom:1px solid #f4f4f5">&euro;${item.price.toFixed(2)}</td>
    </tr>`
  ).join("")

  return layout(`
    <h2 style="margin:0 0 8px;font-size:20px;color:#18181b">Ordine confermato!</h2>
    <p style="color:#71717a;margin:0 0 24px">Ciao ${data.customerName}, il tuo ordine #${data.orderId.slice(-6)} è stato confermato.</p>

    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr style="border-bottom:2px solid #e4e4e7">
        <th style="padding:8px 0;text-align:left;font-size:12px;color:#71717a;text-transform:uppercase">Prodotto</th>
        <th style="padding:8px 0;text-align:center;font-size:12px;color:#71717a;text-transform:uppercase">Qtà</th>
        <th style="padding:8px 0;text-align:right;font-size:12px;color:#71717a;text-transform:uppercase">Prezzo</th>
      </tr>
      ${rows}
    </table>

    <div style="text-align:right;padding-top:12px;border-top:2px solid #18181b">
      <span style="font-size:13px;color:#71717a">Totale: </span>
      <span style="font-size:20px;font-weight:800;color:${BRAND_COLOR}">&euro;${data.total.toFixed(2)}</span>
    </div>
  `)
}

// ===== WELCOME EMAIL =====

export function welcomeEmail(data: { name: string; loginUrl: string }): string {
  return layout(`
    <h2 style="margin:0 0 8px;font-size:20px;color:#18181b">Benvenuto su SalonPro!</h2>
    <p style="color:#71717a;margin:0 0 24px">Ciao ${data.name}, il tuo account è stato creato con successo.</p>

    <p style="color:#52525b;font-size:14px;line-height:1.6">
      Ora puoi prenotare appuntamenti, accumulare punti fedeltà e scoprire i nostri servizi.
    </p>

    <div style="text-align:center">
      ${button("Accedi al tuo account", data.loginUrl)}
    </div>
  `)
}

// ===== REVIEW REQUEST =====

export function reviewRequest(data: { name: string; serviceName: string; operatorName: string; reviewUrl: string }): string {
  return layout(`
    <h2 style="margin:0 0 8px;font-size:20px;color:#18181b">Com'è stata la tua esperienza?</h2>
    <p style="color:#71717a;margin:0 0 24px">Ciao ${escapeHtml(data.name)}, speriamo che il tuo appuntamento sia stato fantastico!</p>

    <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:16px 0;text-align:center">
      <p style="margin:0;font-size:16px;font-weight:600">${escapeHtml(data.serviceName)}</p>
      <p style="margin:4px 0 0;color:#71717a">con ${escapeHtml(data.operatorName)}</p>
    </div>

    <p style="color:#52525b;font-size:14px;text-align:center">La tua opinione ci aiuta a migliorare!</p>

    <div style="text-align:center">
      ${button("Lascia una recensione", data.reviewUrl)}
    </div>
  `)
}

// ===== CAMPAIGN EMAIL (generic) =====

export function campaignEmail(data: { title: string; message: string }): string {
  return layout(`
    <h2 style="margin:0 0 16px;font-size:20px;color:#18181b">${escapeHtml(data.title)}</h2>
    <p style="color:#52525b;font-size:14px;line-height:1.6">${escapeHtml(data.message)}</p>
  `)
}
