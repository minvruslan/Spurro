import type { AnyContractProcedure, InferContractRouterErrorMap } from "@orpc/contract"
import { ORPCError } from "@orpc/server"
import { ApiContract } from "@vancloak/api-contract"
import { expect } from "vitest"

type ContractErrorCode<T> = T extends AnyContractProcedure
  ? keyof InferContractRouterErrorMap<T>
  : { [K in keyof T]: ContractErrorCode<T[K]> }[keyof T]

type TransportErrorCode = "BAD_REQUEST" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND"

export async function expectOrpcError(
  operation: Promise<unknown>,
  errorCode: ContractErrorCode<typeof ApiContract> | TransportErrorCode,
) {
  await expect(operation).rejects.toSatisfy(
    (error) => error instanceof ORPCError && error.code === errorCode,
  )
}
