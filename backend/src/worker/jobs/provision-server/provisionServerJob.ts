import { SUPPORTED_PROTOCOLS } from "@spurro/shared"
import type { ProtocolClient } from "@spurro/infrastructure"
import { RemoteServer } from "@spurro/infrastructure"
import type {
  EndpointData,
  EndpointDesiredState,
  ServerAccess,
  ServerDesiredState,
} from "@spurro/infrastructure/types"
import { env } from "@/core/env/index.js"
import type { ProvisionServerJob } from "@/core/queue/provision-server/index.js"
import { findServer } from "./queries/findServer.js"
import { findActiveEndpoints } from "./queries/findActiveEndpoints.js"
import { updateServerData } from "./queries/updateServerData.js"
import { updateEndpointData } from "./queries/updateEndpointData.js"
import { updateServerStatus } from "./queries/updateServerStatus.js"
import { provisioningFailure } from "./utils/provisioningFailure.js"
import { parseServerDesiredState } from "./utils/parseServerDesiredState.js"
import { createServerDesiredState } from "./utils/createServerDesiredState.js"
import { planEndpointDeployment } from "./utils/planEndpointDeployment.js"

type EndpointDeployment = {
  client: ProtocolClient
  endpointId: string
  endpointData: EndpointData
  endpointDesiredState: EndpointDesiredState
}

export async function provisionServerJob(job: ProvisionServerJob) {
  const { serverId } = job

  const server = await findServer(serverId)
  if (!server) throw provisioningFailure(serverId, "server_not_found")
  if (!server.data) throw provisioningFailure(serverId, "invalid_server_data")

  let serverData = server.data

  const parsedDesiredState = parseServerDesiredState(serverData)
  if (parsedDesiredState.status === "invalid") {
    throw provisioningFailure(serverId, "invalid_server_desired_state", {
      error: parsedDesiredState.error,
    })
  }

  let desiredState: ServerDesiredState
  if (parsedDesiredState.status === "found") {
    desiredState = parsedDesiredState.desiredState
  } else {
    desiredState = createServerDesiredState()
    serverData = { ...serverData, desiredState }
    await updateServerData(serverId, serverData)
  }

  if (!serverData.facts?.sshHostKeys?.length) {
    const actualSSH = serverData.actualState.ssh
    if (actualSSH.type === "privateKey") {
      throw provisioningFailure(serverId, "hardened_without_ssh_host_keys")
    }
    const sshHostKeys = await RemoteServer.scanSSHHostKeys(server.ip, actualSSH.port)
    serverData = { ...serverData, facts: { ...serverData.facts, sshHostKeys } }
    await updateServerData(serverId, serverData)
  }

  const actualStateAccess = RemoteServer.buildServerAccessFromActualState(
    { ip: server.ip, data: serverData },
    env.APP_SSH_PRIVATE_KEY,
  )
  if (!actualStateAccess) throw provisioningFailure(serverId, "hardened_without_ssh_host_keys")

  const desiredStateAccess = RemoteServer.buildServerAccessFromDesiredState(
    { ip: server.ip, data: serverData },
    env.APP_SSH_PRIVATE_KEY,
  )
  if (!desiredStateAccess) throw provisioningFailure(serverId, "no_desired_state_access")

  let workingAccess: ServerAccess
  if ("privateKey" in actualStateAccess) {
    workingAccess = actualStateAccess
  } else {
    try {
      await new RemoteServer(desiredStateAccess).assertConnectivity()
      workingAccess = desiredStateAccess
    } catch {
      workingAccess = actualStateAccess
    }
  }

  const workingRemoteServer = new RemoteServer(workingAccess)
  await workingRemoteServer.installDocker()
  await workingRemoteServer.createServiceUser(desiredState.ssh.username, desiredState.baseDirectory)

  const authorizedKeys = [await RemoteServer.deriveSSHPublicKey(env.APP_SSH_PRIVATE_KEY)]
  if (env.OPERATOR_SSH_PUBLIC_KEY) authorizedKeys.push(env.OPERATOR_SSH_PUBLIC_KEY)
  await workingRemoteServer.installServiceUserAuthorizedKeys(
    desiredState.ssh.username,
    authorizedKeys,
  )

  if ("privateKey" in workingAccess) {
    await workingRemoteServer.hardenSSHAccess(desiredState.ssh.port)
  } else {
    const preHardenAccess = { ...desiredStateAccess, port: workingAccess.port }
    const preHardenServer = new RemoteServer(preHardenAccess)
    await preHardenServer.assertConnectivity()
    await preHardenServer.assertPrivilegeEscalation()
    await preHardenServer.hardenSSHAccess(desiredState.ssh.port)
  }

  const hardenedRemoteServer = new RemoteServer(desiredStateAccess)
  await hardenedRemoteServer.assertConnectivity()

  serverData = {
    ...serverData,
    actualState: { ...desiredState, appliedAt: new Date().toISOString() },
  }
  await updateServerData(serverId, serverData)

  const endpoints = await findActiveEndpoints(serverId)
  const seenProtocolCodes = new Set<string>()
  const deployments: EndpointDeployment[] = []

  for (const endpoint of endpoints) {
    const planEndpointDeploymentResult = planEndpointDeployment(endpoint, seenProtocolCodes)
    if (!planEndpointDeploymentResult.ok) {
      throw provisioningFailure(serverId, planEndpointDeploymentResult.errorCode, {
        endpointId: endpoint.endpointId,
        protocolCode: endpoint.protocolCode,
        error: planEndpointDeploymentResult.error,
      })
    }
    seenProtocolCodes.add(planEndpointDeploymentResult.protocolCode)

    const protocolClient = hardenedRemoteServer.getProtocolClient(
      planEndpointDeploymentResult.protocolCode,
    )
    let endpointData = planEndpointDeploymentResult.endpointData
    let endpointDesiredState = planEndpointDeploymentResult.endpointDesiredState
    if (!endpointDesiredState) {
      endpointDesiredState = protocolClient.createEndpointDesiredState(endpoint.port)
      endpointData = { ...endpointData, desiredState: endpointDesiredState }
      await updateEndpointData(endpoint.endpointId, endpointData)
    }

    deployments.push({
      client: protocolClient,
      endpointId: endpoint.endpointId,
      endpointData,
      endpointDesiredState,
    })
  }

  for (const { client, endpointId, endpointData, endpointDesiredState } of deployments) {
    await hardenedRemoteServer.allowFirewallPort(
      endpointDesiredState.port,
      SUPPORTED_PROTOCOLS[client.protocolCode].transportProtocol,
    )
    await client.install({ desiredState }, endpointDesiredState)
    await updateEndpointData(endpointId, {
      ...endpointData,
      actualState: { ...endpointDesiredState, appliedAt: new Date().toISOString() },
    })
  }

  await updateServerStatus(serverId, "active")
}
