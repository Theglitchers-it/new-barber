import { PrismaClient } from "@prisma/client"
import { hashSync } from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  // Pulisci database
  await prisma.notification.deleteMany()
  await prisma.loyaltyTransaction.deleteMany()
  await prisma.review.deleteMany()
  await prisma.cartItem.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.operatorAvailability.deleteMany()
  await prisma.operator.deleteMany()
  await prisma.service.deleteMany()
  await prisma.product.deleteMany()
  await prisma.coupon.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()

  // Business Settings (singleton)
  await prisma.businessSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      salonName: "SalonPro",
      address: "Via Roma 42, 20121 Milano",
      phone: "+39 02 1234567",
      email: "info@salonpro.it",
      openTime: "09:00",
      closeTime: "19:00",
      slotDuration: 30,
      loyaltyPointsPerEuro: 1,
      loyaltyRedemptionRate: 0.1,
      cancellationPolicy: "Cancellazione gratuita fino a 24 ore prima dell'appuntamento. Cancellazioni tardive possono comportare un addebito del 50% del costo del servizio.",
      depositRequired: false,
      depositAmount: 0,
    },
  })

  // Utente admin
  const admin = await prisma.user.create({
    data: {
      name: "Admin SalonPro",
      email: "admin@salonpro.it",
      hashedPassword: hashSync("admin123", 10),
      role: "ADMIN",
      phone: "+39 02 1234567",
    },
  })

  // Clienti
  const maria = await prisma.user.create({
    data: {
      name: "Maria Rossi",
      email: "maria.rossi@email.it",
      hashedPassword: hashSync("cliente123", 10),
      role: "CLIENT",
      phone: "+39 333 1234567",
      hairType: "Ricci",
      preferredContact: "WHATSAPP",
      loyaltyPoints: 150,
      totalSpent: 320,
    },
  })

  const luca = await prisma.user.create({
    data: {
      name: "Luca Verdi",
      email: "luca.verdi@email.it",
      hashedPassword: hashSync("cliente123", 10),
      role: "CLIENT",
      phone: "+39 339 7654321",
      hairType: "Lisci",
      preferredContact: "EMAIL",
      loyaltyPoints: 80,
      totalSpent: 175,
    },
  })

  const elena = await prisma.user.create({
    data: {
      name: "Elena Bianchi",
      email: "elena.bianchi@email.it",
      hashedPassword: hashSync("cliente123", 10),
      role: "CLIENT",
      phone: "+39 347 1122334",
      hairType: "Mossi",
      preferredContact: "PHONE",
      loyaltyPoints: 220,
      totalSpent: 540,
    },
  })

  // Servizi
  const servizi = await Promise.all([
    prisma.service.create({
      data: {
        name: "Taglio Donna",
        description: "Taglio personalizzato con consulenza stile",
        price: 35,
        duration: 45,
        category: "Taglio",
        popular: true,
      },
    }),
    prisma.service.create({
      data: {
        name: "Taglio Uomo",
        description: "Taglio classico o moderno con styling",
        price: 25,
        duration: 30,
        category: "Taglio",
        popular: true,
      },
    }),
    prisma.service.create({
      data: {
        name: "Piega",
        description: "Piega professionale con prodotti premium",
        price: 20,
        duration: 30,
        category: "Piega",
        popular: true,
      },
    }),
    prisma.service.create({
      data: {
        name: "Colore Completo",
        description: "Colorazione completa con prodotti di alta qualità",
        price: 65,
        duration: 90,
        category: "Colore",
        popular: true,
      },
    }),
    prisma.service.create({
      data: {
        name: "Meches / Balayage",
        description: "Schiariture naturali con tecnica balayage",
        price: 85,
        duration: 120,
        category: "Colore",
        popular: true,
      },
    }),
    prisma.service.create({
      data: {
        name: "Trattamento Cheratina",
        description: "Trattamento lisciante e nutriente alla cheratina",
        price: 120,
        duration: 120,
        category: "Trattamento",
      },
    }),
    prisma.service.create({
      data: {
        name: "Maschera Nutriente",
        description: "Trattamento profondo per capelli secchi e danneggiati",
        price: 30,
        duration: 30,
        category: "Trattamento",
      },
    }),
    prisma.service.create({
      data: {
        name: "Taglio + Piega",
        description: "Taglio e piega completi",
        price: 50,
        duration: 60,
        category: "Taglio",
        popular: true,
      },
    }),
  ])

  // Operatori
  const operatori = await Promise.all([
    prisma.operator.create({
      data: {
        name: "Giulia Moretti",
        role: "Senior Stylist",
        specializations: "Taglio,Colore,Balayage",
        image: "/placeholder-user.jpg",
        email: "giulia@salonpro.it",
        phone: "+39 340 1111111",
        bio: "Giulia è la nostra senior stylist con oltre 10 anni di esperienza. Specializzata in tagli moderni e colorazioni creative, ha partecipato a fashion week internazionali.",
        rating: 4.8,
        reviewCount: 45,
        commission: 40,
        hireDate: new Date("2020-03-15"),
        availabilities: {
          createMany: {
            data: [
              { dayOfWeek: 1, startTime: "09:00", endTime: "18:00" },
              { dayOfWeek: 2, startTime: "09:00", endTime: "18:00" },
              { dayOfWeek: 3, startTime: "09:00", endTime: "18:00" },
              { dayOfWeek: 4, startTime: "09:00", endTime: "18:00" },
              { dayOfWeek: 5, startTime: "09:00", endTime: "18:00" },
              { dayOfWeek: 6, startTime: "09:00", endTime: "14:00" },
            ],
          },
        },
      },
    }),
    prisma.operator.create({
      data: {
        name: "Marco Bianchi",
        role: "Stylist",
        specializations: "Taglio,Piega",
        image: "/placeholder-user.jpg",
        email: "marco@salonpro.it",
        phone: "+39 340 2222222",
        bio: "Marco è il nostro esperto di tagli maschili e styling. Con 5 anni di esperienza, è apprezzato per la sua precisione e attenzione ai dettagli.",
        rating: 4.5,
        reviewCount: 32,
        commission: 35,
        hireDate: new Date("2022-01-10"),
        availabilities: {
          createMany: {
            data: [
              { dayOfWeek: 1, startTime: "10:00", endTime: "19:00" },
              { dayOfWeek: 2, startTime: "10:00", endTime: "19:00" },
              { dayOfWeek: 3, startTime: "10:00", endTime: "19:00" },
              { dayOfWeek: 4, startTime: "10:00", endTime: "19:00" },
              { dayOfWeek: 5, startTime: "10:00", endTime: "19:00" },
            ],
          },
        },
      },
    }),
    prisma.operator.create({
      data: {
        name: "Sara Colombo",
        role: "Colorist",
        specializations: "Colore,Meches,Balayage,Trattamento",
        image: "/placeholder-user.jpg",
        email: "sara@salonpro.it",
        phone: "+39 340 3333333",
        bio: "Sara è la nostra colorista di riferimento. Esperta in balayage e tecniche di colorazione all'avanguardia, trasforma ogni chioma in un'opera d'arte.",
        rating: 4.9,
        reviewCount: 58,
        commission: 40,
        hireDate: new Date("2019-06-20"),
        availabilities: {
          createMany: {
            data: [
              { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
              { dayOfWeek: 2, startTime: "09:00", endTime: "17:00" },
              { dayOfWeek: 3, startTime: "09:00", endTime: "17:00" },
              { dayOfWeek: 4, startTime: "09:00", endTime: "17:00" },
              { dayOfWeek: 5, startTime: "09:00", endTime: "17:00" },
              { dayOfWeek: 6, startTime: "09:00", endTime: "13:00" },
            ],
          },
        },
      },
    }),
    prisma.operator.create({
      data: {
        name: "Luca Ferrara",
        role: "Junior Stylist",
        specializations: "Taglio,Piega,Trattamento",
        image: "/placeholder-user.jpg",
        email: "luca@salonpro.it",
        phone: "+39 340 4444444",
        bio: "Luca è il nostro talento emergente. Formato nelle migliori accademie italiane, porta energia e creatività fresca nel team con un occhio alle ultime tendenze.",
        rating: 4.6,
        reviewCount: 18,
        commission: 30,
        hireDate: new Date("2024-09-01"),
        availabilities: {
          createMany: {
            data: [
              { dayOfWeek: 1, startTime: "09:00", endTime: "18:00" },
              { dayOfWeek: 2, startTime: "09:00", endTime: "18:00" },
              { dayOfWeek: 3, startTime: "09:00", endTime: "18:00" },
              { dayOfWeek: 4, startTime: "09:00", endTime: "18:00" },
              { dayOfWeek: 5, startTime: "09:00", endTime: "18:00" },
            ],
          },
        },
      },
    }),
  ])

  // Prodotti
  await Promise.all([
    prisma.product.create({
      data: {
        name: "Shampoo Idratante",
        description: "Shampoo professionale per capelli secchi e crespi. Formula arricchita con olio di argan.",
        category: "Shampoo",
        price: 24.90,
        stock: 50,
        image: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&h=400&fit=crop",
        rating: 4.5,
        reviewCount: 128,
      },
    }),
    prisma.product.create({
      data: {
        name: "Balsamo Ristrutturante",
        description: "Balsamo intensivo per capelli danneggiati. Ripara e nutre in profondità.",
        category: "Balsamo",
        price: 22.90,
        stock: 35,
        image: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=400&h=400&fit=crop",
        rating: 4.3,
        reviewCount: 89,
      },
    }),
    prisma.product.create({
      data: {
        name: "Maschera Nutriente",
        description: "Maschera profonda per capelli secchi. Da utilizzare una volta a settimana.",
        category: "Trattamento",
        price: 32.50,
        stock: 25,
        image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&h=400&fit=crop",
        rating: 4.7,
        reviewCount: 156,
      },
    }),
    prisma.product.create({
      data: {
        name: "Olio di Argan Puro",
        description: "Olio di argan 100% puro per nutrire e lucidare i capelli.",
        category: "Trattamento",
        price: 18.90,
        stock: 40,
        image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop",
        rating: 4.8,
        reviewCount: 203,
      },
    }),
    prisma.product.create({
      data: {
        name: "Spray Termoprotettore",
        description: "Protegge i capelli dal calore fino a 230°C. Indispensabile per piastre e phon.",
        category: "Styling",
        price: 15.90,
        stock: 60,
        image: "https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=400&h=400&fit=crop",
        rating: 4.4,
        reviewCount: 97,
      },
    }),
    prisma.product.create({
      data: {
        name: "Lacca Tenuta Forte",
        description: "Lacca professionale a tenuta forte. Fissaggio duraturo senza appesantire.",
        category: "Styling",
        price: 12.90,
        stock: 45,
        image: "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=400&h=400&fit=crop",
        rating: 4.2,
        reviewCount: 74,
      },
    }),
    prisma.product.create({
      data: {
        name: "Siero Anti-Crespo",
        description: "Siero lisciante per eliminare il crespo e donare lucentezza.",
        category: "Trattamento",
        price: 28.90,
        originalPrice: 34.90,
        stock: 30,
        image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop",
        rating: 4.6,
        reviewCount: 112,
      },
    }),
    prisma.product.create({
      data: {
        name: "Shampoo Volumizzante",
        description: "Shampoo leggero che dona volume ai capelli fini e piatti.",
        category: "Shampoo",
        price: 21.90,
        stock: 55,
        image: "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=400&h=400&fit=crop",
        rating: 4.1,
        reviewCount: 65,
      },
    }),
    prisma.product.create({
      data: {
        name: "Balsamo Idratante",
        description: "Balsamo leggero per idratazione quotidiana. Lascia i capelli morbidi e setosi.",
        category: "Balsamo",
        price: 19.90,
        stock: 40,
        image: "https://images.unsplash.com/photo-1574169208507-84376144848b?w=400&h=400&fit=crop",
        rating: 4.4,
        reviewCount: 92,
      },
    }),
    prisma.product.create({
      data: {
        name: "Gel Fissante Forte",
        description: "Gel a tenuta extra forte per acconciature definite tutto il giorno. Non lascia residui.",
        category: "Styling",
        price: 14.50,
        stock: 55,
        image: "https://images.unsplash.com/photo-1597354984706-fac992d9306f?w=400&h=400&fit=crop",
        rating: 4.3,
        reviewCount: 81,
      },
    }),
    prisma.product.create({
      data: {
        name: "Shampoo Anti-Forfora",
        description: "Shampoo specifico contro la forfora. Con zinco piritione e tea tree oil.",
        category: "Shampoo",
        price: 18.90,
        originalPrice: 22.90,
        stock: 45,
        image: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&h=400&fit=crop",
        rating: 4.5,
        reviewCount: 134,
      },
    }),
    prisma.product.create({
      data: {
        name: "Crema Definizione Ricci",
        description: "Crema modellante per esaltare i ricci naturali. Senza siliconi, effetto anti-crespo.",
        category: "Trattamento",
        price: 26.90,
        stock: 30,
        image: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400&h=400&fit=crop",
        rating: 4.7,
        reviewCount: 97,
      },
    }),
    prisma.product.create({
      data: {
        name: "Cera Opaca Modellante",
        description: "Cera a effetto opaco per look naturali e texturizzati. Tenuta media rimodellabile.",
        category: "Styling",
        price: 16.90,
        stock: 50,
        image: "https://images.unsplash.com/photo-1622467827417-bbe2237067a9?w=400&h=400&fit=crop",
        rating: 4.2,
        reviewCount: 68,
      },
    }),
    prisma.product.create({
      data: {
        name: "Balsamo Leave-In",
        description: "Balsamo senza risciacquo per capelli secchi e crespi. Nutre e protegge tutto il giorno.",
        category: "Balsamo",
        price: 23.50,
        originalPrice: 27.90,
        stock: 35,
        image: "https://images.unsplash.com/photo-1599751449128-eb7249c3d6b1?w=400&h=400&fit=crop",
        rating: 4.6,
        reviewCount: 105,
      },
    }),
    prisma.product.create({
      data: {
        name: "Shampoo Riparatore",
        description: "Shampoo ricostruttivo per capelli trattati e danneggiati. Con cheratina e collagene.",
        category: "Shampoo",
        price: 22.50,
        stock: 40,
        image: "https://images.unsplash.com/photo-1567721913486-6585f069b332?w=400&h=400&fit=crop",
        rating: 4.4,
        reviewCount: 88,
      },
    }),
    prisma.product.create({
      data: {
        name: "Olio Semi di Lino",
        description: "Olio di semi di lino puro per lucentezza e protezione termica naturale.",
        category: "Trattamento",
        price: 15.90,
        stock: 60,
        image: "https://images.unsplash.com/photo-1615397349754-cfa2066a298e?w=400&h=400&fit=crop",
        rating: 4.5,
        reviewCount: 142,
      },
    }),
  ])

  // Appuntamenti di esempio
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today.getTime() - 86400000)
  const twoDaysAgo = new Date(today.getTime() - 2 * 86400000)
  const tomorrow = new Date(today.getTime() + 86400000)

  const appointments = await Promise.all([
    prisma.appointment.create({
      data: {
        userId: maria.id,
        serviceId: servizi[0].id,
        operatorId: operatori[0].id,
        date: twoDaysAgo,
        startTime: "09:00",
        endTime: "09:45",
        status: "COMPLETED",
        totalPrice: 35,
      },
    }),
    prisma.appointment.create({
      data: {
        userId: elena.id,
        serviceId: servizi[3].id,
        operatorId: operatori[2].id,
        date: yesterday,
        startTime: "10:00",
        endTime: "11:30",
        status: "COMPLETED",
        totalPrice: 65,
      },
    }),
    prisma.appointment.create({
      data: {
        userId: luca.id,
        serviceId: servizi[1].id,
        operatorId: operatori[1].id,
        date: yesterday,
        startTime: "14:00",
        endTime: "14:30",
        status: "COMPLETED",
        totalPrice: 25,
      },
    }),
    prisma.appointment.create({
      data: {
        userId: maria.id,
        serviceId: servizi[7].id,
        operatorId: operatori[0].id,
        date: today,
        startTime: "10:00",
        endTime: "11:00",
        status: "CONFIRMED",
        totalPrice: 50,
      },
    }),
    prisma.appointment.create({
      data: {
        userId: elena.id,
        serviceId: servizi[4].id,
        operatorId: operatori[2].id,
        date: today,
        startTime: "14:00",
        endTime: "16:00",
        status: "PENDING",
        totalPrice: 85,
      },
    }),
    prisma.appointment.create({
      data: {
        userId: luca.id,
        serviceId: servizi[5].id,
        operatorId: operatori[0].id,
        date: tomorrow,
        startTime: "11:00",
        endTime: "13:00",
        status: "PENDING",
        totalPrice: 120,
      },
    }),
    // Appuntamento cancellato
    prisma.appointment.create({
      data: {
        userId: maria.id,
        serviceId: servizi[2].id,
        operatorId: operatori[1].id,
        date: yesterday,
        startTime: "16:00",
        endTime: "16:30",
        status: "CANCELLED",
        totalPrice: 20,
        cancellationReason: "Impegno personale",
        cancelledAt: new Date(yesterday.getTime() - 3600000),
      },
    }),
  ])

  // Reviews
  await Promise.all([
    prisma.review.create({
      data: {
        userId: maria.id,
        operatorId: operatori[0].id,
        appointmentId: appointments[0].id,
        rating: 5,
        comment: "Giulia è fantastica! Ha capito esattamente il taglio che volevo. Consigliatissima!",
        reply: "Grazie Maria! È sempre un piacere averti nel nostro salone.",
        replyDate: new Date(),
      },
    }),
    prisma.review.create({
      data: {
        userId: elena.id,
        operatorId: operatori[2].id,
        appointmentId: appointments[1].id,
        rating: 5,
        comment: "Colore perfetto, Sara è una vera artista. Il balayage è esattamente come lo volevo.",
      },
    }),
    prisma.review.create({
      data: {
        userId: luca.id,
        operatorId: operatori[1].id,
        appointmentId: appointments[2].id,
        rating: 4,
        comment: "Taglio preciso e veloce. Marco è molto professionale.",
        reply: "Grazie Luca, torna a trovarci!",
        replyDate: new Date(),
      },
    }),
  ])

  // Loyalty Transactions
  await Promise.all([
    prisma.loyaltyTransaction.create({
      data: {
        userId: maria.id,
        points: 35,
        type: "EARNED",
        reason: "Appuntamento completato - Taglio Donna",
        appointmentId: appointments[0].id,
      },
    }),
    prisma.loyaltyTransaction.create({
      data: {
        userId: elena.id,
        points: 65,
        type: "EARNED",
        reason: "Appuntamento completato - Colore Completo",
        appointmentId: appointments[1].id,
      },
    }),
    prisma.loyaltyTransaction.create({
      data: {
        userId: luca.id,
        points: 25,
        type: "EARNED",
        reason: "Appuntamento completato - Taglio Uomo",
        appointmentId: appointments[2].id,
      },
    }),
    prisma.loyaltyTransaction.create({
      data: {
        userId: maria.id,
        points: -50,
        type: "REDEEMED",
        reason: "Sconto fedeltà su prenotazione",
      },
    }),
  ])

  // Coupon
  await Promise.all([
    prisma.coupon.create({
      data: {
        code: "BENVENUTO10",
        type: "PERCENTAGE",
        value: 10,
        minOrder: 30,
        maxUses: 100,
        usedCount: 23,
        expiresAt: new Date("2026-12-31"),
      },
    }),
    prisma.coupon.create({
      data: {
        code: "ESTATE5",
        type: "FIXED",
        value: 5,
        minOrder: 20,
        maxUses: 50,
        usedCount: 12,
        expiresAt: new Date("2026-09-30"),
      },
    }),
    prisma.coupon.create({
      data: {
        code: "VIP20",
        type: "PERCENTAGE",
        value: 20,
        minOrder: 50,
        maxUses: 10,
        usedCount: 3,
        expiresAt: new Date("2026-06-30"),
      },
    }),
  ])

  // Notifiche
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: maria.id,
        title: "Appuntamento confermato",
        message: "Il tuo appuntamento per Taglio + Piega di oggi alle 10:00 è stato confermato.",
        type: "APPOINTMENT",
        link: "/prenotazioni",
      },
    }),
    prisma.notification.create({
      data: {
        userId: maria.id,
        title: "Punti fedeltà guadagnati!",
        message: "Hai guadagnato 35 punti fedeltà per il tuo ultimo appuntamento.",
        type: "LOYALTY",
        link: "/fedelta",
      },
    }),
    prisma.notification.create({
      data: {
        userId: elena.id,
        title: "Nuova promozione",
        message: "Usa il codice ESTATE5 per uno sconto di 5€ sul tuo prossimo ordine!",
        type: "SYSTEM",
        link: "/shop",
      },
    }),
    prisma.notification.create({
      data: {
        userId: luca.id,
        title: "Ricordati del tuo appuntamento",
        message: "Il tuo appuntamento per Trattamento Cheratina è domani alle 11:00.",
        type: "APPOINTMENT",
        link: "/prenotazioni",
      },
    }),
  ])

  console.log("Seed completato!")
  console.log(`Admin: admin@salonpro.it / admin123`)
  console.log(`Clienti: maria.rossi@email.it / luca.verdi@email.it / elena.bianchi@email.it (password: cliente123)`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
