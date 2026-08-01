import { oc as contractBuilder } from "@orpc/contract"
import type { ApiMeta } from "./ApiMeta"

export const oc = contractBuilder.$meta<ApiMeta>({ access: "admin" })
