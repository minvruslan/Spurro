import { authorized } from "@/api/orpc/index.js"
import { getEndpointsService } from "../services/getEndpointsService.js"

const getEndpointsRoute = authorized.endpoints.getEndpoints.handler(async () => {
  const result = await getEndpointsService()
  return result.data.endpoints
})

export { getEndpointsRoute }
