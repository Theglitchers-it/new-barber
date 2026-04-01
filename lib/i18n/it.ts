export const it = {
  // Navigation
  "nav.dashboard": "Dashboard",
  "nav.appointments": "Prenotazioni",
  "nav.team": "Team",
  "nav.clients": "Clienti",
  "nav.reviews": "Recensioni",
  "nav.shop": "Shop",
  "nav.orders": "Ordini",
  "nav.loyalty": "Fedeltà",
  "nav.report": "Report",
  "nav.timeline": "I Miei Capelli",
  "nav.calendar": "Calendario",
  "nav.profile": "Profilo",
  "nav.home": "Home",
  "nav.book": "Prenota",
  "nav.packages": "Pacchetti",
  "nav.settings": "Impostazioni",

  // Auth
  "auth.welcomeBack": "Bentornato!",
  "auth.loginToAccount": "Accedi al tuo account",
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.forgotPassword": "Password dimenticata?",
  "auth.login": "Accedi",
  "auth.loggingIn": "Accesso in corso...",
  "auth.or": "oppure",
  "auth.continueWithGoogle": "Continua con Google",
  "auth.noAccount": "Non hai un account?",
  "auth.signUpFree": "Registrati gratis",
  "auth.invalidCredentials": "Email o password non validi",
  "auth.createAccount": "Crea il tuo account",
  "auth.startBooking": "Inizia a prenotare in pochi secondi",
  "auth.fullName": "Nome completo",
  "auth.phonePlaceholder": "Telefono (opzionale)",
  "auth.confirm": "Conferma",
  "auth.confirmPassword": "Conferma password",
  "auth.registering": "Registrazione...",
  "auth.register": "Crea account",
  "auth.hasAccount": "Hai già un account?",
  "auth.demo": "DEMO",

  // Common
  "common.save": "Salva",
  "common.cancel": "Annulla",
  "common.delete": "Elimina",
  "common.edit": "Modifica",
  "common.add": "Aggiungi",
  "common.search": "Cerca",
  "common.filter": "Filtra",
  "common.loading": "Caricamento...",
  "common.error": "Errore",
  "common.success": "Successo",
  "common.confirm": "Conferma",
  "common.back": "Indietro",
  "common.next": "Avanti",
  "common.close": "Chiudi",
  "common.all": "Tutti",
  "common.active": "Attivo",
  "common.inactive": "Inattivo",
  "common.yes": "Sì",
  "common.no": "No",
  "common.noResults": "Nessun risultato",
  "common.actions": "Azioni",

  // Appointment status
  "status.appointment.PENDING": "In attesa",
  "status.appointment.CONFIRMED": "Confermato",
  "status.appointment.IN_PROGRESS": "In corso",
  "status.appointment.COMPLETED": "Completato",
  "status.appointment.CANCELLED": "Cancellato",

  // Order status
  "status.order.PENDING": "In attesa",
  "status.order.PROCESSING": "In lavorazione",
  "status.order.SHIPPED": "Spedito",
  "status.order.DELIVERED": "Consegnato",
  "status.order.CANCELLED": "Cancellato",

  // Package status
  "status.package.ACTIVE": "Attivo",
  "status.package.EXPIRED": "Scaduto",
  "status.package.EXHAUSTED": "Esaurito",

  // Campaign types
  "campaign.BIRTHDAY": "Compleanno",
  "campaign.INACTIVITY": "Inattività",
  "campaign.POST_VISIT": "Dopo visita",
  "campaign.TIER_UPGRADE": "Upgrade livello",
  "campaign.SEASONAL": "Promozione stagionale",

  // Shop
  "shop.addToCart": "Aggiungi al carrello",
  "shop.cart": "Carrello",
  "shop.emptyCart": "Il tuo carrello è vuoto",
  "shop.goToShop": "Vai allo Shop",
  "shop.subtotal": "Subtotale",
  "shop.shipping": "Spedizione",
  "shop.free": "Gratuita",
  "shop.total": "Totale",
  "shop.checkout": "Procedi all'ordine",
  "shop.ordering": "Ordine in corso...",
  "shop.products": "prodotti",
  "shop.outOfStock": "Esaurito",
  "shop.inStock": "Disponibile",

  // Appointments
  "appointments.title": "Prenotazioni",
  "appointments.new": "Nuova prenotazione",
  "appointments.detail": "Dettaglio Prenotazione",
  "appointments.noAppointments": "Nessuna prenotazione",
  "appointments.addToCalendar": "Aggiungi al calendario",
  "appointments.downloadIcs": "Scarica .ics",
  "appointments.adminTools": "Strumenti Admin",
  "appointments.staffNotes": "Note Staff",
  "appointments.cancelReason": "Motivo cancellazione",

  // Dashboard
  "dashboard.title": "Dashboard",
  "dashboard.welcome": "Benvenuto, {name}",
  "dashboard.revenue": "Fatturato",
  "dashboard.newClients": "Nuovi Clienti",
  "dashboard.rating": "Rating",
  "dashboard.noShow": "No-Show",
  "dashboard.completion": "Completamento",
  "dashboard.loyaltyPoints": "Punti Fedeltà",
  "dashboard.productsSold": "Prodotti",

  // Packages
  "packages.title": "Pacchetti",
  "packages.subtitle": "Risparmia con i nostri pacchetti servizi",
  "packages.buy": "Acquista",
  "packages.sessions": "sessioni",
  "packages.days": "giorni",
  "packages.myPackages": "I Miei Pacchetti",
  "packages.noPackages": "Nessun pacchetto disponibile al momento",
  "packages.purchased": "Pacchetto acquistato!",

  // Calendar
  "calendar.addGoogle": "Google Calendar",
  "calendar.downloadIcs": "Scarica .ics",

  // Profile
  "profile.title": "Profilo",
  "profile.birthDate": "Data di nascita",
  "profile.personalNotes": "Note personali",
  "profile.preferredContact": "Contatto preferito",
  "profile.updated": "Profilo aggiornato",

  // Sidebar
  "sidebar.subtitle": "Il tuo salone",
  "sidebar.logout": "Esci",

  // Public nav
  "public.login": "Accedi",
  "public.register": "Registrati",
} as const

export type TranslationKey = keyof typeof it
