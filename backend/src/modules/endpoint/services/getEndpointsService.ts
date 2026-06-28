import type { Endpoint } from "@spurro/shared"
import { EndpointSchema } from "@spurro/shared"
import { db } from "@/core/database/index.js"
import { findActiveEndpoints } from "../queries/findActiveEndpoints.js"
import { createEndpointFromDatabaseData } from "../utils/createEndpointFromDatabaseData.js"

export async function getEndpointsService(): Promise<Endpoint[]> {
  const rows = await findActiveEndpoints(db)
  return EndpointSchema.array().parse(rows.map(createEndpointFromDatabaseData))
}
