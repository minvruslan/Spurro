import { z } from "zod"

export const PaginationSchema = z.object({
  offset: z.number(),
  limit: z.number(),
  total: z.number(),
})

export function PaginatedSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    pagination: PaginationSchema,
  })
}
