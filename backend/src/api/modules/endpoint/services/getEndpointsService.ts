import type { Endpoint } from "@spurro/shared"
import { EndpointSchema } from "@spurro/shared"
import { db } from "@/core/database/index.js"
import type { ServiceResult } from "@/core/types/index.js"
import { findActiveEndpoints } from "../queries/findActiveEndpoints.js"
import { createEndpointFromDatabaseData } from "../utils/createEndpointFromDatabaseData.js"

export async function getEndpointsService(): Promise<ServiceResult<{ endpoints: Endpoint[] }>> {
  const rows = await findActiveEndpoints(db)
  return {
    ok: true,
    data: { endpoints: EndpointSchema.array().parse(rows.map(createEndpointFromDatabaseData)) },
  }
}
