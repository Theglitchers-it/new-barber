import { z } from "zod"

export const addToCartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).default(1),
})

export const updateCartSchema = z.object({
  quantity: z.number().int().min(1),
})

export type AddToCartInput = z.infer<typeof addToCartSchema>
export type UpdateCartInput = z.infer<typeof updateCartSchema>
