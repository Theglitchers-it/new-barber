import { MetadataRoute } from "next"
import { prisma } from "@/lib/prisma"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://salonpro.it"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, operators] = await Promise.all([
    prisma.product.findMany({ where: { active: true }, select: { id: true, updatedAt: true } }),
    prisma.operator.findMany({ where: { active: true }, select: { id: true, updatedAt: true } }),
  ])

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/shop`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/registrati`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ]

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE_URL}/shop/${p.id}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }))

  const operatorRoutes: MetadataRoute.Sitemap = operators.map((o) => ({
    url: `${BASE_URL}/operatori/${o.id}`,
    lastModified: o.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }))

  return [...staticRoutes, ...productRoutes, ...operatorRoutes]
}
