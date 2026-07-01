import { AMNEZIAWG_PROTOCOL_CODE } from "@spurro/shared"
import { AmneziawgClient } from "@spurro/infrastructure"
import { db } from "@/core/database/index.js"
import { deleteUserConfig } from "../queries/deleteUserConfig.js"
import { findServerAccess } from "../queries/findServerAccess.js"
import { findUserConfig } from "../queries/findUserConfig.js"
import type { AmneziawgPeerConfig } from "../types/AmneziawgPeerConfig.js"

type DeleteConfigResult = { ok: true } | { ok: false; reason: "not_found" }

export async function deleteUserConfigService(
  userId: string,
  configId: string,
): Promise<DeleteConfigResult> {
  const [config] = await findUserConfig(db, userId, configId)
  if (!config) return { ok: false, reason: "not_found" }

  const [row] = await deleteUserConfig(db, userId, configId)
  if (!row) return { ok: false, reason: "not_found" }

  const peer = config.data as Partial<AmneziawgPeerConfig> | null
  if (config.protocolTypeCode === AMNEZIAWG_PROTOCOL_CODE && peer?.publicKey) {
    const access = await findServerAccess(db, config.serverId)
    const ssh = access?.data?.ssh
    if (ssh) {
      try {
        const client = new AmneziawgClient({
          ip: access.ip,
          login: ssh.login,
          password: ssh.password,
        })
        await client.removePeer(peer.publicKey)
      } catch (error) {
        console.error("[config] peer revoke failed; peer left on node", error)
      }
    }
  }

  return { ok: true }
}
