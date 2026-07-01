import { AMNEZIAWG_SERVER_ADDRESS } from "@spurro/shared"
import { runAnsiblePlaybook } from "@spurro/infrastructure"
import type { ProvisionServerJob } from "@/core/queue/provision-server/index.js"
import { findServer } from "./queries/findServer.js"
import { updateServerStatus } from "./queries/updateServerStatus.js"

export async function provisionServerJob(job: ProvisionServerJob) {
  const { serverId } = job

  const data = await findServer(serverId)
  if (!data) {
    throw new Error(`[provision] server ${serverId} not found or has no active AmneziaWG endpoint`)
  }

  const ssh = data.data?.ssh
  if (!ssh) {
    throw new Error(`[provision] server ${serverId} has no SSH credentials`)
  }

  await runAnsiblePlaybook({
    ip: data.ip,
    login: ssh.login,
    extraVars: {
      ansible_password: ssh.password,
      amneziawg_port: data.amneziawgPort,
      amneziawg_address: AMNEZIAWG_SERVER_ADDRESS,
    },
  })

  await updateServerStatus(serverId, "active")
}
