import { implement } from "@orpc/server"
import { ApiContract } from "@spurro/api-contract"

const os = implement(ApiContract).$context<{ headers: Headers }>()

export { os }
