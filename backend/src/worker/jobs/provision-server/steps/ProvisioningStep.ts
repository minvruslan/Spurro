export type ProvisioningStep<Input, Output> = (
  serverId: string,
  input: Readonly<Input>,
) => Promise<Output>
