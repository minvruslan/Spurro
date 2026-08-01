import type { ContractRouterClient } from "@orpc/contract"
import type { JsonifiedClient } from "@orpc/openapi-client"
import type { ApiContract } from "./ApiContract"

export type ApiClient = JsonifiedClient<ContractRouterClient<typeof ApiContract>>
