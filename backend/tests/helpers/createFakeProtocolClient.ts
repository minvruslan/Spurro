import { RemoteServer, type ProtocolClient } from "@spurro/infrastructure"
import {
  Amneziawg2ClientIdentifierSchema,
  type Amneziawg2ConfigData,
} from "@spurro/infrastructure/types"
import { vi } from "vitest"

const FAKE_SERVER_SSH_HOST_KEY = "ssh-ed25519 AAAATestServerHostKey"

const FakeProtocolClientData = {
  clientIdentifier: "10.8.1.2",
  publicKey: "fake-public-key",
  presharedKey: "fake-preshared-key",
  clientConfiguration: "fake-client-configuration",
  configData: {
    protocolCode: "amneziawg2",
    ip: "10.8.1.2",
    publicKey: "fake-public-key",
    presharedKey: "fake-preshared-key",
  } satisfies Amneziawg2ConfigData,
}

function createFakeProtocolClient() {
  const client: ProtocolClient = new RemoteServer({
    ip: "192.0.2.1",
    port: 22,
    username: "spurro",
    privateKey: "fake-ssh-private-key",
    sshHostKeys: [FAKE_SERVER_SSH_HOST_KEY],
  }).getProtocolClient("amneziawg2")

  return {
    client,
    allocateClientIdentifier: vi
      .spyOn(client, "allocateClientIdentifier")
      .mockReturnValue(
        Amneziawg2ClientIdentifierSchema.parse(FakeProtocolClientData.clientIdentifier),
      ),
    createInitialConfigData: vi
      .spyOn(client, "createInitialConfigData")
      .mockImplementation((clientIdentifier) => ({
        protocolCode: "amneziawg2",
        ip: clientIdentifier,
      })),
    createAccess: vi.spyOn(client, "createAccess").mockResolvedValue({
      configData: { ...FakeProtocolClientData.configData },
      clientConfiguration: FakeProtocolClientData.clientConfiguration,
    }),
    deleteAccessByClientIdentifier: vi
      .spyOn(client, "deleteAccessByClientIdentifier")
      .mockResolvedValue(undefined),
    deleteAccesses: vi.spyOn(client, "deleteAccesses").mockResolvedValue(undefined),
  }
}

export { createFakeProtocolClient, FakeProtocolClientData, FAKE_SERVER_SSH_HOST_KEY }
