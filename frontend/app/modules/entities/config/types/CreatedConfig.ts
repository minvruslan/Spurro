import type { Config } from "@spurro/api-contract"

export type CreatedConfig = Config & {
  clientConfiguration: string
  clientConfigurationLink: string
}
