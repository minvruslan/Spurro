import { RemoteServer, type ProtocolClient } from "@spurro/infrastructure"
import {
  Amneziawg2EndpointActualStateSchema,
  type Amneziawg2ConfigData,
} from "@spurro/infrastructure/types"
import { vi } from "vitest"

const FAKE_SERVER_SSH_HOST_KEY = "ssh-ed25519 AAAATestServerHostKey"

function createAmneziawg2Client(): ProtocolClient {
  return new RemoteServer({
    ip: "192.0.2.1",
    port: 22,
    username: "spurro",
    privateKey: "fake-ssh-private-key",
    sshHostKeys: [FAKE_SERVER_SSH_HOST_KEY],
  }).getProtocolClient("amneziawg2")
}

const FakeAmneziawg2EndpointActualState = Amneziawg2EndpointActualStateSchema.parse({
  ...createAmneziawg2Client().createEndpointDesiredState(51820),
  appliedAt: "2026-01-01T00:00:00.000Z",
})

const FakeAmneziawg2CreateAccessResult = {
  configData: {
    protocolCode: "amneziawg2",
    ip: `${FakeAmneziawg2EndpointActualState.subnetPrefix}.2`,
    publicKey: "fake-public-key",
    presharedKey: "fake-preshared-key",
  } satisfies Amneziawg2ConfigData,
  clientConfiguration: "fake-client-configuration",
}

function createFakeAmneziawg2Client() {
  const client = createAmneziawg2Client()

  return {
    client,
    allocateClientIdentifier: vi.spyOn(client, "allocateClientIdentifier"),
    createInitialConfigData: vi.spyOn(client, "createInitialConfigData"),
    createAccess: vi
      .spyOn(client, "createAccess")
      .mockImplementation(async (_server, _endpointActualState, clientIdentifier) => ({
        configData: { ...FakeAmneziawg2CreateAccessResult.configData, ip: clientIdentifier },
        clientConfiguration: FakeAmneziawg2CreateAccessResult.clientConfiguration,
      })),
    deleteAccessByClientIdentifier: vi
      .spyOn(client, "deleteAccessByClientIdentifier")
      .mockResolvedValue(undefined),
    deleteAccesses: vi.spyOn(client, "deleteAccesses").mockResolvedValue(undefined),
  }
}

export {
  createFakeAmneziawg2Client,
  FakeAmneziawg2CreateAccessResult,
  FakeAmneziawg2EndpointActualState,
  FAKE_SERVER_SSH_HOST_KEY,
}
