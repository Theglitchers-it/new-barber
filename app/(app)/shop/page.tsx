import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ShopClient } from "./shop-client"

export const metadata = { title: "Shop" }
export const revalidate = 60

export default async function ShopPage() {
  const session = await auth()
  const isLoggedIn = !!session?.user

  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      price: true,
      originalPrice: true,
      stock: true,
      image: true,
      rating: true,
      reviewCount: true,
    },
  })

  return <ShopClient initialProducts={products} isLoggedIn={isLoggedIn} />
}
