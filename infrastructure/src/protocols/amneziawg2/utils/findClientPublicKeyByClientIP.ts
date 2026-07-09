import type { RemoteCommandRunner } from "../../../remote-command-runner/RemoteCommandRunner.js"

export async function findClientPublicKeyByClientIP(
  remoteCommandRunner: RemoteCommandRunner,
  containerName: string,
  clientIP: string,
): Promise<string | undefined> {
  const output = await remoteCommandRunner.executeContainerScript(
    containerName,
    "list-allowed-ips.sh",
  )
  const target = `${clientIP}/32`
  for (const line of output.trim().split("\n")) {
    const parts = line.trim().split(/\s+/)
    const clientPublicKey = parts[0]
    if (clientPublicKey && parts.slice(1).includes(target)) return clientPublicKey
  }
  return undefined
}
