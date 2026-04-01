import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin, validationError } from "@/lib/api-utils"
import { APPOINTMENT_STATUS, LOYALTY_TYPE, ORDER_STATUS } from "@/lib/constants"
import { z } from "zod"

const reportQuerySchema = z.object({
  type: z.enum(["revenue", "appointments", "clients", "products", "loyalty", "reviews"]),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  locationId: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const params = Object.fromEntries(request.nextUrl.searchParams)
    const parsed = reportQuerySchema.safeParse(params)
    if (!parsed.success) return validationError(parsed)

    const { type, dateFrom, dateTo, locationId } = parsed.data
    const start = new Date(dateFrom)
    const end = new Date(dateTo)
    end.setDate(end.getDate() + 1)

    const locationFilter = locationId ? { locationId } : {}
    const dateFilter = { gte: start, lt: end }

    switch (type) {
      case "revenue": {
        const [byOperator, byService, dailyRevenue, productRevenue, operators, services] = await Promise.all([
          prisma.appointment.groupBy({
            by: ["operatorId"],
            where: { date: dateFilter, status: APPOINTMENT_STATUS.COMPLETED, ...locationFilter },
            _sum: { totalPrice: true },
            _count: true,
          }),
          prisma.appointment.groupBy({
            by: ["serviceId"],
            where: { date: dateFilter, status: APPOINTMENT_STATUS.COMPLETED, ...locationFilter },
            _sum: { totalPrice: true },
            _count: true,
          }),
          prisma.appointment.findMany({
            where: { date: dateFilter, status: APPOINTMENT_STATUS.COMPLETED, ...locationFilter },
            select: { date: true, totalPrice: true },
          }),
          prisma.orderItem.aggregate({
            where: { order: { createdAt: dateFilter, status: { not: ORDER_STATUS.CANCELLED } } },
            _sum: { price: true },
            _count: true,
          }),
          prisma.operator.findMany({ where: { active: true }, select: { id: true, name: true } }),
          prisma.service.findMany({ where: { active: true }, select: { id: true, name: true } }),
        ])

        const opMap = new Map(operators.map((o) => [o.id, o.name]))
        const svcMap = new Map(services.map((s) => [s.id, s.name]))

        return NextResponse.json({
          byOperator: byOperator.map((r) => ({
            name: opMap.get(r.operatorId) || "N/A",
            appointments: r._count,
            revenue: r._sum.totalPrice || 0,
          })),
          byService: byService.map((r) => ({
            name: svcMap.get(r.serviceId) || "N/A",
            bookings: r._count,
            revenue: r._sum.totalPrice || 0,
          })),
          dailyRevenue: dailyRevenue.map((r) => ({
            date: r.date.toISOString().split("T")[0],
            revenue: r.totalPrice,
          })),
          productRevenue: { total: productRevenue._sum.price || 0, items: productRevenue._count },
          totalRevenue: byOperator.reduce((sum, r) => sum + (r._sum.totalPrice || 0), 0) + (productRevenue._sum.price || 0),
        })
      }

      case "appointments": {
        const [byStatus, byOperator, totalCount, noShowCount, operators] = await Promise.all([
          prisma.appointment.groupBy({
            by: ["status"],
            where: { date: dateFilter, ...locationFilter },
            _count: true,
          }),
          prisma.appointment.groupBy({
            by: ["operatorId"],
            where: { date: dateFilter, ...locationFilter },
            _count: true,
          }),
          prisma.appointment.count({ where: { date: dateFilter, ...locationFilter } }),
          prisma.appointment.count({ where: { date: dateFilter, noShow: true, ...locationFilter } }),
          prisma.operator.findMany({ where: { active: true }, select: { id: true, name: true } }),
        ])

        const opMap = new Map(operators.map((o) => [o.id, o.name]))

        return NextResponse.json({
          byStatus: byStatus.map((r) => ({ status: r.status, count: r._count })),
          byOperator: byOperator.map((r) => ({ name: opMap.get(r.operatorId) || "N/A", count: r._count })),
          total: totalCount,
          noShowCount,
          noShowRate: totalCount > 0 ? Math.round((noShowCount / totalCount) * 100) : 0,
        })
      }

      case "clients": {
        const [newClients, tierDistribution, topSpenders, totalClients] = await Promise.all([
          prisma.user.count({ where: { role: "CLIENT", createdAt: dateFilter } }),
          prisma.user.groupBy({ by: ["loyaltyTier"], where: { role: "CLIENT" }, _count: true }),
          prisma.user.findMany({
            where: { role: "CLIENT" },
            select: { id: true, name: true, email: true, totalSpent: true, loyaltyTier: true },
            orderBy: { totalSpent: "desc" },
            take: 20,
          }),
          prisma.user.count({ where: { role: "CLIENT" } }),
        ])

        return NextResponse.json({
          newClients,
          totalClients,
          tierDistribution: tierDistribution.map((r) => ({ tier: r.loyaltyTier, count: r._count })),
          topSpenders,
        })
      }

      case "products": {
        const [topProducts, totalSold, products] = await Promise.all([
          prisma.orderItem.groupBy({
            by: ["productId"],
            where: { order: { createdAt: dateFilter, status: { not: ORDER_STATUS.CANCELLED } } },
            _sum: { quantity: true, price: true },
            _count: true,
            orderBy: { _sum: { quantity: "desc" } },
            take: 20,
          }),
          prisma.orderItem.aggregate({
            where: { order: { createdAt: dateFilter, status: { not: ORDER_STATUS.CANCELLED } } },
            _sum: { quantity: true, price: true },
          }),
          prisma.product.findMany({ select: { id: true, name: true, stock: true } }),
        ])

        const prodMap = new Map(products.map((p) => [p.id, p]))

        return NextResponse.json({
          topProducts: topProducts.map((r) => ({
            name: prodMap.get(r.productId)?.name || "N/A",
            quantitySold: r._sum.quantity || 0,
            revenue: r._sum.price || 0,
            currentStock: prodMap.get(r.productId)?.stock ?? 0,
          })),
          totalQuantity: totalSold._sum.quantity || 0,
          totalRevenue: totalSold._sum.price || 0,
        })
      }

      case "loyalty": {
        const [earned, redeemed] = await Promise.all([
          prisma.loyaltyTransaction.aggregate({
            where: { type: LOYALTY_TYPE.EARNED, createdAt: dateFilter },
            _sum: { points: true },
            _count: true,
          }),
          prisma.loyaltyTransaction.aggregate({
            where: { type: LOYALTY_TYPE.REDEEMED, createdAt: dateFilter },
            _sum: { points: true },
            _count: true,
          }),
        ])

        return NextResponse.json({
          earned: { points: earned._sum.points || 0, transactions: earned._count },
          redeemed: { points: Math.abs(redeemed._sum.points || 0), transactions: redeemed._count },
          net: (earned._sum.points || 0) + (redeemed._sum.points || 0),
        })
      }

      case "reviews": {
        const [ratingDistribution, byOperator, totalReviews, avgRating, operators] = await Promise.all([
          prisma.review.groupBy({ by: ["rating"], where: { createdAt: dateFilter }, _count: true }),
          prisma.review.groupBy({
            by: ["operatorId"],
            where: { createdAt: dateFilter },
            _avg: { rating: true },
            _count: true,
          }),
          prisma.review.count({ where: { createdAt: dateFilter } }),
          prisma.review.aggregate({ where: { createdAt: dateFilter }, _avg: { rating: true } }),
          prisma.operator.findMany({ where: { active: true }, select: { id: true, name: true } }),
        ])

        const opMap = new Map(operators.map((o) => [o.id, o.name]))

        return NextResponse.json({
          ratingDistribution: ratingDistribution
            .map((r) => ({ rating: r.rating, count: r._count }))
            .sort((a, b) => a.rating - b.rating),
          byOperator: byOperator.map((r) => ({
            name: opMap.get(r.operatorId) || "N/A",
            avgRating: Math.round((r._avg.rating || 0) * 10) / 10,
            count: r._count,
          })),
          total: totalReviews,
          avgRating: Math.round((avgRating._avg.rating || 0) * 10) / 10,
        })
      }

      default:
        return NextResponse.json({ error: "Tipo report non valido" }, { status: 400 })
    }
  } catch (error) {
    console.error("Errore generazione report:", error)
    return NextResponse.json({ error: "Errore nella generazione del report" }, { status: 500 })
  }
}
