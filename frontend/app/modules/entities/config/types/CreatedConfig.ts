import type { Config } from "@vancloak/api-contract"

export type CreatedConfig = Config & {
  clientConfiguration: string
  clientConfigurationLink: string
}
