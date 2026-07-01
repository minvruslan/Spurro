import { execa } from "execa"
import {
  DOCKER_CONTAINER_WITH_AMNEZIAWG,
  DOCKER_IMAGE_WITH_ANSIBLE,
  SSH_COMMAND_TIMEOUT_MS,
} from "../common/constants/index.js"

// Peer management for the AmneziaWG engine on a remote node. The main node is separate from it,
// so every command runs over SSH via the pinned docker image (ships openssh-client + sshpass).

interface NodeAccess {
  ip: string
  login: string
  password: string
}

interface PeerResult {
  ip: string
  publicKey: string
  privateKey: string
  configuration: string
}

const CONTAINER = DOCKER_CONTAINER_WITH_AMNEZIAWG.name
const STATE_DIR = DOCKER_CONTAINER_WITH_AMNEZIAWG.stateDir
const WG_IFACE = DOCKER_CONTAINER_WITH_AMNEZIAWG.interface
// Serializes live-interface + wg0.conf mutations across concurrent add/remove on the same node.
const CONFIGURATION_LOCK = `${STATE_DIR}/wg0.conf.lock`

export class AmneziawgClient {
  constructor(private readonly node: NodeAccess) {}

  // Adds a peer in one round-trip: an in-container script generates keys, reads the server
  // pubkey/psk/obfuscation, adds the peer live, persists it, and echoes back the config data.
  async addPeer(params: {
    ip: string
    endpoint: string
    name: string
    dns?: string
  }): Promise<PeerResult> {
    const { ip, endpoint, name, dns } = params

    // Shell-escape the user-supplied name; jq --arg handles JSON escaping.
    const shellName = name
      .slice(0, 64)
      .replace(/[\r\n]/g, " ")
      .replace(/'/g, "'\\''")

    const script = [
      "set -e",
      `IP='${ip}'`,
      `NAME='${shellName}'`,
      `PRIV=$(awg genkey)`,
      `PUB=$(printf '%s' "$PRIV" | awg pubkey)`,
      `SERVER_PUB=$(cat ${STATE_DIR}/server_public.key)`,
      `PSK=$(cat ${STATE_DIR}/psk.key)`,
      `OBF=$(cat ${STATE_DIR}/obf.env)`,
      // Hold the lock across the live-interface change and the wg0.conf append so a concurrent
      // add/remove can't interleave and corrupt the file or drop a peer.
      `exec 9>${CONFIGURATION_LOCK}`,
      `flock 9`,
      // PSK via stdin, not argv
      `printf '%s' "$PSK" | awg set ${WG_IFACE} peer "$PUB" preshared-key /dev/stdin allowed-ips "$IP/32"`,
      // persist so the peer survives container restarts
      `printf '\\n[Peer]\\nPublicKey = %s\\nPresharedKey = %s\\nAllowedIPs = %s/32\\n' "$PUB" "$PSK" "$IP" | tee -a ${STATE_DIR}/wg0.conf >/dev/null`,
      // best-effort mirror; must not fail provisioning
      `client-registry.sh add "$NAME" "$PUB" "$IP" || true`,
      `printf 'PRIV=%s\\nPUB=%s\\nSERVER_PUB=%s\\nPSK=%s\\nOBF_BEGIN\\n%s\\nOBF_END\\n' "$PRIV" "$PUB" "$SERVER_PUB" "$PSK" "$OBF"`,
    ].join("\n")

    const out = await this.runInContainer(script)

    const privateKey = AmneziawgClient.extractField(out, "PRIV")
    const publicKey = AmneziawgClient.extractField(out, "PUB")
    const serverPub = AmneziawgClient.extractField(out, "SERVER_PUB")
    const psk = AmneziawgClient.extractField(out, "PSK")
    const obf = AmneziawgClient.parseObfuscation(
      out.match(/OBF_BEGIN\n([\s\S]*?)\nOBF_END/)?.[1] ?? "",
    )

    const configuration = AmneziawgClient.buildUserConfiguration({
      privateKey,
      ip,
      serverPub,
      psk,
      endpoint,
      obf,
      dns,
    })

    return { ip, publicKey, privateKey, configuration }
  }

  /** Remove a client by public key: from the live interface and from wg0.conf. */
  async removePeer(publicKey: string): Promise<void> {
    // Drop the [Peer] stanza whose PublicKey matches, block-aware.
    const script = [
      "set -e",
      `KEY='${publicKey}'`,
      // Same lock as addPeer: serialize the live-interface removal and wg0.conf rewrite.
      `exec 9>${CONFIGURATION_LOCK}`,
      `flock 9`,
      `awg set ${WG_IFACE} peer "$KEY" remove`,
      `awk -v key="$KEY" '`,
      `  function flush() { if (buf != "") { if (!drop) printf "%s", buf; buf=""; drop=0 } }`,
      `  /^\\[Peer\\]/ { flush(); buf=$0 ORS; next }`,
      `  /^\\[Interface\\]/ { flush(); print; next }`,
      `  { if (buf != "") { buf = buf $0 ORS; if ($1=="PublicKey" && $3==key) drop=1 } else print }`,
      `  END { flush() }`,
      `' ${STATE_DIR}/wg0.conf > ${STATE_DIR}/wg0.conf.tmp`,
      `mv ${STATE_DIR}/wg0.conf.tmp ${STATE_DIR}/wg0.conf`,
      // best-effort
      `client-registry.sh remove "$KEY" || true`,
    ].join("\n")
    await this.runInContainer(script)
  }

  // Removes the peer holding `ip` as its allowed-ip. Cleans up an orphaned peer when provisioning
  // failed after the peer was added but before its public key was persisted: key unknown, IP known.
  async removePeerByClientIP(ip: string): Promise<void> {
    const out = await this.runInContainer(`awg show ${WG_IFACE} allowed-ips`)
    const target = `${ip}/32`
    for (const line of out.trim().split("\n")) {
      const parts = line.trim().split(/\s+/)
      const publicKey = parts[0]
      if (publicKey && parts.slice(1).includes(target)) {
        await this.removePeer(publicKey)
        return
      }
    }
  }

  static buildUserConfiguration(params: {
    privateKey: string
    ip: string
    serverPub: string
    psk: string
    endpoint: string
    obf: Record<string, string>
    dns?: string
  }): string {
    const { privateKey, ip, serverPub, psk, endpoint, obf, dns = "1.1.1.1, 1.0.0.1" } = params

    return [
      "[Interface]",
      `Address = ${ip}/32`,
      `DNS = ${dns}`,
      `PrivateKey = ${privateKey}`,
      `Jc = ${obf.Jc}`,
      `Jmin = ${obf.Jmin}`,
      `Jmax = ${obf.Jmax}`,
      `S1 = ${obf.S1}`,
      `S2 = ${obf.S2}`,
      `S3 = ${obf.S3}`,
      `S4 = ${obf.S4}`,
      `H1 = ${obf.H1}`,
      `H2 = ${obf.H2}`,
      `H3 = ${obf.H3}`,
      `H4 = ${obf.H4}`,
      ...["I1", "I2", "I3", "I4", "I5"].filter((k) => obf[k]).map((k) => `${k} = ${obf[k]}`),
      "",
      "[Peer]",
      `PublicKey = ${serverPub}`,
      `PresharedKey = ${psk}`,
      "AllowedIPs = 0.0.0.0/0, ::/0",
      `Endpoint = ${endpoint}`,
      "PersistentKeepalive = 25",
      "",
    ].join("\n")
  }

  // Run a raw command on the node over SSH.
  private async nodeExec(remoteCmd: string, input?: string): Promise<string> {
    const { stdout } = await execa(
      "docker",
      [
        "run",
        "--rm",
        "-i",
        "-e",
        "SSHPASS",
        DOCKER_IMAGE_WITH_ANSIBLE.name,
        "sshpass",
        "-e",
        "ssh",
        "-o",
        "StrictHostKeyChecking=no",
        "-o",
        "UserKnownHostsFile=/dev/null",
        "-o",
        "ConnectTimeout=15",
        `${this.node.login}@${this.node.ip}`,
        remoteCmd,
      ],
      { input, env: { SSHPASS: this.node.password }, timeout: SSH_COMMAND_TIMEOUT_MS },
    )
    return stdout
  }

  // Pipe a whole shell script into the container's `sh` over SSH, so bodies use bare commands.
  private runInContainer(script: string): Promise<string> {
    return this.nodeExec(`docker exec -i ${CONTAINER} sh`, script)
  }

  private static parseObfuscation(raw: string): Record<string, string> {
    const obf: Record<string, string> = {}
    for (const line of raw.trim().split("\n")) {
      const eq = line.indexOf("=")
      if (eq === -1) continue
      const key = line.slice(0, eq).trim()
      if (key) obf[key] = line.slice(eq + 1).trim()
    }
    return obf
  }

  private static extractField(out: string, key: string): string {
    return out.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1]?.trim() ?? ""
  }
}
