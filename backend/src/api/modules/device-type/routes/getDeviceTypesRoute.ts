import { authorized } from "@/api/orpc/index.js"
import { getDeviceTypesService } from "../services/getDeviceTypesService.js"

const getDeviceTypesRoute = authorized.deviceTypes.getDeviceTypes.handler(async () => {
  const result = await getDeviceTypesService()
  return result.data.deviceTypes
})

export { getDeviceTypesRoute }
