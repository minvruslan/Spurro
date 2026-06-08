import type { z } from "zod"
import type { PaginationSchema } from "./PaginatedSchema"

export type Pagination = z.infer<typeof PaginationSchema>

export interface Paginated<T> {
  data: T[]
  pagination: Pagination
}
