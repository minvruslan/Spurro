import { implement } from "@orpc/server"
import { ApiContract } from "@vancloak/api-contract"

const os = implement(ApiContract).$context<{ headers: Headers }>()

export { os }
