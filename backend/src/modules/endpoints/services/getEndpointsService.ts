import type { Endpoint } from "@spurro/shared"
import { EndpointSchema } from "@spurro/shared"
import { findActiveEndpoints } from "../repository/findActiveEndpoints.js"
import { createEndpointFromDatabaseData } from "../utils/createEndpointFromDatabaseData.js"

export async function getEndpointsService(): Promise<Endpoint[]> {
  const rows = await findActiveEndpoints()
  return EndpointSchema.array().parse(rows.map(createEndpointFromDatabaseData))
}
