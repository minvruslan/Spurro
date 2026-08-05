import { randomUUID } from "node:crypto"
import { RemoteServer } from "@spurro/infrastructure"
import {
  Amneziawg2EndpointActualStateSchema,
  Amneziawg2EndpointDesiredStateSchema,
  EndpointDataSchema,
  ProtocolRegistry,
  ServerDataSchema,
  ServerDesiredStateSchema,
  type EndpointData,
  type ServerAccess,
  type ServerData,
} from "@spurro/infrastructure/types"
import type { JobsOptions } from "bullmq"
import { eq, sql } from "drizzle-orm"
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from "vitest"
import { db } from "@/core/database/index.js"
import { endpoint, server } from "@/core/database/schemas/index.js"
import { env } from "@/core/env/index.js"
import { workerLogger } from "@/core/logger/index.js"
import {
  PROVISION_SERVER_JOB_NAME,
  provisionServerQueue,
} from "@/core/queue/provision-server/index.js"
import { createProvisioningWorker } from "@/worker/createProvisioningWorker.js"
import {
  createFakeAmneziawg2Client,
  createTestIp,
  FAKE_SERVER_SSH_HOST_KEY,
  FakeAmneziawg2EndpointActualState,
  insertTestEndpoint,
  insertTestProtocol,
  insertTestServer,
} from "@tests/helpers/index.js"

const SCANNED_SSH_HOST_KEY = "ssh-ed25519 AAAAScannedHostKey"
const APPLICATION_SSH_PUBLIC_KEY = "ssh-ed25519 AAAAApplicationPublicKey"
const OPERATOR_SSH_PUBLIC_KEY = "ssh-ed25519 AAAAOperatorPublicKey"
const PREVIOUSLY_APPLIED_AT = "2026-01-01T00:00:00.000Z"
const UNREACHABLE_QUEUE_URL = "redis://localhost:1"
const ACTUAL_STATE_SSH_PORT = 22
const DEFAULT_SERVER_SSH = { type: "privateKey", username: "spurro", port: 13013 }
const DEFAULT_ENDPOINT_DNS = "1.1.1.1, 1.0.0.1"
const DEFAULT_SERVER_BASE_DIRECTORY = "/opt/spurro"

function createDefaultServerDesiredState() {
  return {
    ssh: DEFAULT_SERVER_SSH,
    baseDirectory: DEFAULT_SERVER_BASE_DIRECTORY,
  }
}

const { appliedAt: fakeEndpointAppliedAt, ...fakeEndpointDesiredState } =
  FakeAmneziawg2EndpointActualState

const provisionServerQueueInstance = provisionServerQueue()

type ProvisioningWorker = ReturnType<typeof createProvisioningWorker>
type ServerStatus = (typeof server.$inferSelect)["status"]
type RemoteServerPrototypeSpies = {
  [MethodName in keyof RemoteServer]: MockInstance<RemoteServer[MethodName]>
}

let remoteServerSpies: ReturnType<typeof mockRemoteServer>
const startedWorkers: ProvisioningWorker[] = []
const pendingStepResolvers: (() => void)[] = []

function mockRemoteServer() {
  const fakeAmneziawg2Client = createFakeAmneziawg2Client()

  const remoteServerPrototypeSpies = Object.fromEntries(
    Object.getOwnPropertyNames(RemoteServer.prototype)
      .filter((methodName) => methodName !== "constructor")
      .map((methodName) => {
        const spy = vi.spyOn(
          RemoteServer.prototype,
          methodName as keyof RemoteServer,
        ) as unknown as MockInstance
        spy.mockReturnValue(Promise.resolve(undefined))
        return [methodName, spy]
      }),
  ) as RemoteServerPrototypeSpies

  remoteServerPrototypeSpies.getProtocolClient.mockReturnValue(fakeAmneziawg2Client.client)

  return {
    ...remoteServerPrototypeSpies,
    scanSshHostKeys: vi
      .spyOn(RemoteServer, "scanSshHostKeys")
      .mockResolvedValue([SCANNED_SSH_HOST_KEY]),
    deriveSshPublicKey: vi
      .spyOn(RemoteServer, "deriveSshPublicKey")
      .mockResolvedValue(APPLICATION_SSH_PUBLIC_KEY),
    install: vi.spyOn(fakeAmneziawg2Client.client, "install").mockResolvedValue(undefined),
    createEndpointDesiredState: vi.spyOn(fakeAmneziawg2Client.client, "createEndpointDesiredState"),
  }
}

function getServerAccess(remoteServer: unknown) {
  return (remoteServer as { remoteCommandRunner: { serverAccess: ServerAccess } })
    .remoteCommandRunner.serverAccess
}

function countRemoteServerCalls() {
  return Object.fromEntries(
    Object.entries(remoteServerSpies).map(([methodName, spy]) => [
      methodName,
      spy.mock.calls.length,
    ]),
  )
}

function createZeroRemoteServerCallCounts() {
  return Object.fromEntries(Object.keys(remoteServerSpies).map((methodName) => [methodName, 0]))
}

function createPasswordAccessServerData(sshPassword: string): ServerData {
  return {
    actualState: {
      ssh: {
        type: "password",
        username: "spurro",
        password: sshPassword,
        port: ACTUAL_STATE_SSH_PORT,
      },
      appliedAt: PREVIOUSLY_APPLIED_AT,
    },
  }
}

function createKeyAccessServerData(overrides: Partial<ServerData> = {}): ServerData {
  return {
    facts: { sshHostKeys: [FAKE_SERVER_SSH_HOST_KEY] },
    actualState: {
      ssh: { type: "privateKey", username: "spurro", port: ACTUAL_STATE_SSH_PORT },
      baseDirectory: "/opt/spurro",
      appliedAt: PREVIOUSLY_APPLIED_AT,
    },
    ...overrides,
  }
}

function insertPasswordAccessServer(
  sshPassword: string,
  overrides: Partial<typeof server.$inferInsert> = {},
) {
  return insertTestServer({
    ip: createTestIp(),
    status: "provisioning",
    data: createPasswordAccessServerData(sshPassword),
    ...overrides,
  })
}

function insertKeyAccessServer(overrides: Partial<typeof server.$inferInsert> = {}) {
  return insertTestServer({
    ip: createTestIp(),
    status: "provisioning",
    data: createKeyAccessServerData(),
    ...overrides,
  })
}

function insertInvalidDataServer() {
  return insertKeyAccessServer({ data: null })
}

function createDeferredStep() {
  let resolveStep!: () => void
  const stepPromise = new Promise<void>((resolve) => {
    resolveStep = resolve
  })
  pendingStepResolvers.push(resolveStep)
  return { stepPromise, resolveStep }
}

async function startProvisioningWorker() {
  const provisioningWorker = createProvisioningWorker()
  startedWorkers.push(provisioningWorker)
  await provisioningWorker.waitUntilReady()
  return provisioningWorker
}

function enqueueProvisionServerJob(serverId: string, options: JobsOptions = {}) {
  return provisionServerQueueInstance.add(
    PROVISION_SERVER_JOB_NAME,
    { serverId },
    { jobId: serverId, ...options },
  )
}

function waitForJobCompletion(provisioningWorker: ProvisioningWorker, serverId: string) {
  return new Promise<void>((resolve) => {
    provisioningWorker.on("completed", (completedJob) => {
      if (completedJob.id === serverId) resolve()
    })
  })
}

function waitForJobFailure(
  provisioningWorker: ProvisioningWorker,
  serverId: string,
  expectedFailureCount = 1,
) {
  let observedFailureCount = 0
  return new Promise<void>((resolve) => {
    provisioningWorker.on("failed", (failedJob) => {
      if (failedJob?.id !== serverId) return
      observedFailureCount += 1
      if (observedFailureCount === expectedFailureCount) resolve()
    })
  })
}

async function runSucceedingProvisioningJob(serverId: string, options: JobsOptions = {}) {
  const provisioningWorker = await startProvisioningWorker()
  const jobCompletion = waitForJobCompletion(provisioningWorker, serverId)
  await enqueueProvisionServerJob(serverId, options)
  await jobCompletion
}

async function runFailingProvisioningJob(
  serverId: string,
  options: JobsOptions = {},
  expectedFailureCount = 1,
) {
  const provisioningWorker = await startProvisioningWorker()
  const jobFailure = waitForJobFailure(provisioningWorker, serverId, expectedFailureCount)
  await enqueueProvisionServerJob(serverId, options)
  await jobFailure
}

async function runTerminallyFailingProvisioningJob(serverId: string, errorCode: string) {
  await runFailingProvisioningJob(serverId)
  await expectServerStatusToBecome(serverId, "failed")
  await expectJobFailureReason(serverId, errorCode)
}

async function findServerRow(serverId: string) {
  const [serverRow] = await db.select().from(server).where(eq(server.id, serverId))
  return serverRow
}

async function findEndpointRow(endpointId: string) {
  const [endpointRow] = await db.select().from(endpoint).where(eq(endpoint.id, endpointId))
  return endpointRow
}

async function findEndpointDesiredState(endpointId: string) {
  const endpointRow = await findEndpointRow(endpointId)
  const endpointData = EndpointDataSchema.parse(endpointRow.data)
  return Amneziawg2EndpointDesiredStateSchema.parse(endpointData.desiredState)
}

async function expectServerStatusToBecome(serverId: string, expectedStatus: ServerStatus) {
  await expect
    .poll(async () => (await findServerRow(serverId)).status, { timeout: 10000 })
    .toBe(expectedStatus)
}

async function expectJobFailureReason(serverId: string, expectedReason: string) {
  const failedJob = await provisionServerQueueInstance.getJob(serverId)
  expect(failedJob?.failedReason).toContain(expectedReason)
}

function createProvisioningErrorReason(serverId: string, errorCode: string) {
  return `Server ${serverId} provisioning failed: ${errorCode}.`
}

async function readRawColumnText(tableName: "server" | "endpoint", rowId: string) {
  const rawRows = await db.execute<{ data: string }>(
    sql`select data::text as data from ${sql.identifier(tableName)} where id = ${rowId}::uuid`,
  )
  return rawRows[0]?.data
}

function readLoggedMessages(loggerErrorSpy: { mock: { calls: unknown[][] } }) {
  return loggerErrorSpy.mock.calls.map((loggerCall) => loggerCall[loggerCall.length - 1])
}

function findCallIndexOfLastInvocationBefore(
  invocationCallOrders: number[],
  boundaryCallOrder: number,
) {
  const invocationCallOrdersBefore = invocationCallOrders.filter(
    (callOrder) => callOrder < boundaryCallOrder,
  )
  const lastCallOrderBefore = invocationCallOrdersBefore[invocationCallOrdersBefore.length - 1]
  return invocationCallOrders.indexOf(lastCallOrderBefore)
}

describe("createProvisioningWorker", () => {
  beforeEach(async () => {
    await provisionServerQueueInstance.obliterate({ force: true })
    remoteServerSpies = mockRemoteServer()
  })

  afterEach(async () => {
    for (const resolvePendingStep of pendingStepResolvers) resolvePendingStep()
    pendingStepResolvers.length = 0
    await Promise.all(startedWorkers.map((startedWorker) => startedWorker.close()))
    startedWorkers.length = 0
  })

  afterAll(async () => {
    await provisionServerQueueInstance.obliterate({ force: true })
    await provisionServerQueueInstance.close()
  })

  describe("happy path", () => {
    it("moves a provisioning server to active and persists actualState with appliedAt", async () => {
      const provisionedServer = await insertPasswordAccessServer(`password-${randomUUID()}`)
      const provisioningStartedAt = Date.now()

      await runSucceedingProvisioningJob(provisionedServer.id)

      const serverRow = await findServerRow(provisionedServer.id)
      expect(serverRow.status).toBe("active")
      const serverData = ServerDataSchema.parse(serverRow.data)
      const desiredState = ServerDesiredStateSchema.parse(serverData.desiredState)
      expect(serverData.actualState).toEqual({
        ...desiredState,
        appliedAt: serverData.actualState.appliedAt,
      })
      expect(new Date(serverData.actualState.appliedAt).getTime()).toBeGreaterThanOrEqual(
        provisioningStartedAt,
      )
    })

    it("builds a default desiredState and stores it in server data when it is missing", async () => {
      const provisionedServer = await insertPasswordAccessServer(`password-${randomUUID()}`)
      expect(provisionedServer.data?.desiredState).toBeUndefined()

      await runSucceedingProvisioningJob(provisionedServer.id)

      const serverRow = await findServerRow(provisionedServer.id)
      const serverData = ServerDataSchema.parse(serverRow.data)
      expect(serverData.desiredState).toEqual(createDefaultServerDesiredState())
      expect(remoteServerSpies.createServiceUser).toHaveBeenCalledWith(
        DEFAULT_SERVER_SSH.username,
        DEFAULT_SERVER_BASE_DIRECTORY,
      )
      expect(remoteServerSpies.installServiceUserAuthorizedKeys).toHaveBeenCalledWith(
        DEFAULT_SERVER_SSH.username,
        [APPLICATION_SSH_PUBLIC_KEY],
      )
    })

    it("prefers the domain name over the ip for the endpoint desiredState host", async () => {
      const domainName = `node-${randomUUID()}.spurro.test`
      const provisionedServer = await insertPasswordAccessServer(`password-${randomUUID()}`, {
        domainName,
      })
      const provisionedProtocol = await insertTestProtocol()
      const provisionedEndpoint = await insertTestEndpoint({
        serverId: provisionedServer.id,
        protocolId: provisionedProtocol.id,
        data: {},
      })

      await runSucceedingProvisioningJob(provisionedServer.id)

      const endpointDesiredState = await findEndpointDesiredState(provisionedEndpoint.id)
      expect(endpointDesiredState.host).toBe(domainName)
    })

    it("installs the operator public key next to the application key when the environment provides one", async () => {
      const originalOperatorSshPublicKey = env.OPERATOR_SSH_PUBLIC_KEY
      env.OPERATOR_SSH_PUBLIC_KEY = OPERATOR_SSH_PUBLIC_KEY
      const provisionedServer = await insertPasswordAccessServer(`password-${randomUUID()}`)

      try {
        await runSucceedingProvisioningJob(provisionedServer.id)
      } finally {
        env.OPERATOR_SSH_PUBLIC_KEY = originalOperatorSshPublicKey
      }

      expect(remoteServerSpies.installServiceUserAuthorizedKeys).toHaveBeenCalledWith(
        DEFAULT_SERVER_SSH.username,
        [APPLICATION_SSH_PUBLIC_KEY, OPERATOR_SSH_PUBLIC_KEY],
      )
    })

    it("scans ssh host keys and stores them in server data facts when they are missing", async () => {
      const provisionedServer = await insertPasswordAccessServer(`password-${randomUUID()}`)
      expect(provisionedServer.data?.facts).toBeUndefined()

      await runSucceedingProvisioningJob(provisionedServer.id)

      expect(remoteServerSpies.scanSshHostKeys).toHaveBeenCalledTimes(1)
      expect(remoteServerSpies.scanSshHostKeys).toHaveBeenCalledWith(
        provisionedServer.ip,
        ACTUAL_STATE_SSH_PORT,
      )
      const serverRow = await findServerRow(provisionedServer.id)
      const serverData = ServerDataSchema.parse(serverRow.data)
      expect(serverData.facts?.sshHostKeys).toEqual([SCANNED_SSH_HOST_KEY])
    })

    it("fills desiredState and actualState in the endpoint data", async () => {
      const provisionedServer = await insertPasswordAccessServer(`password-${randomUUID()}`)
      const provisionedProtocol = await insertTestProtocol()
      const provisionedEndpoint = await insertTestEndpoint({
        serverId: provisionedServer.id,
        protocolId: provisionedProtocol.id,
        port: 51820,
        data: {},
      })

      await runSucceedingProvisioningJob(provisionedServer.id)

      const provisionedEndpointRow = await findEndpointRow(provisionedEndpoint.id)
      const provisionedEndpointData = EndpointDataSchema.parse(provisionedEndpointRow.data)
      const endpointDesiredState = Amneziawg2EndpointDesiredStateSchema.parse(
        provisionedEndpointData.desiredState,
      )
      const endpointActualState = Amneziawg2EndpointActualStateSchema.parse(
        provisionedEndpointData.actualState,
      )
      expect(endpointDesiredState.port).toBe(provisionedEndpoint.port)
      expect(endpointDesiredState.host).toBe(provisionedServer.ip)
      expect(endpointDesiredState.dns).toBe(DEFAULT_ENDPOINT_DNS)
      expect(endpointActualState).toEqual({
        ...endpointDesiredState,
        appliedAt: endpointActualState.appliedAt,
      })
    })

    it("allows the firewall port with the endpoint port and transport and installs the protocol client", async () => {
      const provisionedServer = await insertPasswordAccessServer(`password-${randomUUID()}`)
      const provisionedProtocol = await insertTestProtocol()
      const provisionedEndpoint = await insertTestEndpoint({
        serverId: provisionedServer.id,
        protocolId: provisionedProtocol.id,
        port: 51822,
        data: {},
      })

      await runSucceedingProvisioningJob(provisionedServer.id)

      expect(remoteServerSpies.allowFirewallPort).toHaveBeenCalledWith(
        provisionedEndpoint.port,
        ProtocolRegistry.amneziawg2.transportProtocol,
      )
      expect(remoteServerSpies.getProtocolClient).toHaveBeenCalledWith(provisionedProtocol.code)
      expect(remoteServerSpies.install).toHaveBeenCalledTimes(1)
      expect(remoteServerSpies.install).toHaveBeenCalledWith(
        { desiredState: createDefaultServerDesiredState() },
        await findEndpointDesiredState(provisionedEndpoint.id),
      )
    })

    it("stores server data and endpoint data secrets as ciphertext unreadable through raw sql", async () => {
      const sshPassword = `password-${randomUUID()}`
      const provisionedServer = await insertPasswordAccessServer(sshPassword)
      const provisionedProtocol = await insertTestProtocol()
      const provisionedEndpoint = await insertTestEndpoint({
        serverId: provisionedServer.id,
        protocolId: provisionedProtocol.id,
        data: {},
      })

      await runSucceedingProvisioningJob(provisionedServer.id)

      const endpointDesiredState = await findEndpointDesiredState(provisionedEndpoint.id)
      const rawServerData = await readRawColumnText("server", provisionedServer.id)
      const rawEndpointData = await readRawColumnText("endpoint", provisionedEndpoint.id)
      expect(rawServerData?.startsWith("v1:")).toBe(true)
      expect(rawServerData).not.toContain("actualState")
      expect(rawServerData).not.toContain(sshPassword)
      expect(rawEndpointData?.startsWith("v1:")).toBe(true)
      expect(rawEndpointData).not.toContain("desiredState")
      expect(rawEndpointData).not.toContain(endpointDesiredState.serverPrivateKey)
    })

    it("completes the bullmq job and leaves the queue empty", async () => {
      const provisionedServer = await insertPasswordAccessServer(`password-${randomUUID()}`)

      await runSucceedingProvisioningJob(provisionedServer.id)

      expect(await provisionServerQueueInstance.getJob(provisionedServer.id)).toBeUndefined()
      expect(await provisionServerQueueInstance.getJobs()).toHaveLength(0)
    })
  })

  describe("failures", () => {
    it("moves the server to failed without retries when the job throws a ProvisioningError", async () => {
      const provisionedServer = await insertInvalidDataServer()

      await runFailingProvisioningJob(provisionedServer.id, { attempts: 3 })

      await expectServerStatusToBecome(provisionedServer.id, "failed")
      await expectJobFailureReason(
        provisionedServer.id,
        createProvisioningErrorReason(provisionedServer.id, "invalid_server_data"),
      )
      const provisionServerJob = await provisionServerQueueInstance.getJob(provisionedServer.id)
      expect(provisionServerJob?.attemptsMade).toBe(1)
    }, 20000)

    it("keeps the server out of failed while retry attempts remain after an ssh step failure", async () => {
      const provisionedServer = await insertPasswordAccessServer(`password-${randomUUID()}`, {
        status: "active",
      })
      const controlServer = await insertInvalidDataServer()
      remoteServerSpies.installDocker.mockRejectedValue(new Error("Docker install failure"))
      const provisioningWorker = await startProvisioningWorker()
      const provisionedJobFailure = waitForJobFailure(provisioningWorker, provisionedServer.id)
      const controlJobFailure = waitForJobFailure(provisioningWorker, controlServer.id)

      await enqueueProvisionServerJob(provisionedServer.id, {
        attempts: 3,
        backoff: { type: "fixed", delay: 60000 },
      })
      await provisionedJobFailure
      await enqueueProvisionServerJob(controlServer.id)
      await controlJobFailure
      await expectServerStatusToBecome(controlServer.id, "failed")

      const provisionServerJob = await provisionServerQueueInstance.getJob(provisionedServer.id)
      expect(await provisionServerJob?.getState()).toBe("delayed")
      expect(provisionServerJob?.attemptsMade).toBe(1)
      expect((await findServerRow(provisionedServer.id)).status).toBe("provisioning")
    }, 20000)

    it("moves the server to failed after the ssh step fails on all three attempts", async () => {
      const provisionedServer = await insertPasswordAccessServer(`password-${randomUUID()}`)
      remoteServerSpies.installDocker.mockRejectedValue(new Error("Docker install failure"))

      await runFailingProvisioningJob(
        provisionedServer.id,
        { attempts: 3, backoff: { type: "fixed", delay: 10 } },
        3,
      )

      await expectServerStatusToBecome(provisionedServer.id, "failed")
      await expectJobFailureReason(provisionedServer.id, "Docker install failure")
      expect(remoteServerSpies.installDocker).toHaveBeenCalledTimes(3)
      const provisionServerJob = await provisionServerQueueInstance.getJob(provisionedServer.id)
      expect(provisionServerJob?.attemptsMade).toBe(3)
    }, 20000)

    it("moves the server to active when the job succeeds on the last attempt", async () => {
      const provisionedServer = await insertPasswordAccessServer(`password-${randomUUID()}`)
      remoteServerSpies.installDocker
        .mockRejectedValueOnce(new Error("Docker install failure"))
        .mockRejectedValueOnce(new Error("Docker install failure"))

      await runSucceedingProvisioningJob(provisionedServer.id, {
        attempts: 3,
        backoff: { type: "fixed", delay: 10 },
      })

      expect((await findServerRow(provisionedServer.id)).status).toBe("active")
      expect(remoteServerSpies.installDocker).toHaveBeenCalledTimes(3)
    }, 20000)

    it("moves the server to failed on the first ssh failure when the job carries no attempts option", async () => {
      const provisionedServer = await insertPasswordAccessServer(`password-${randomUUID()}`)
      remoteServerSpies.installDocker.mockRejectedValue(new Error("Docker install failure"))

      await runFailingProvisioningJob(provisionedServer.id, { attempts: undefined })

      await expectServerStatusToBecome(provisionedServer.id, "failed")
      expect(remoteServerSpies.installDocker).toHaveBeenCalledTimes(1)
    }, 20000)

    it("keeps processing the next server after one job fails", async () => {
      const failingServer = await insertInvalidDataServer()
      const succeedingServer = await insertPasswordAccessServer(`password-${randomUUID()}`)
      const provisioningWorker = await startProvisioningWorker()
      const failingJobFailure = waitForJobFailure(provisioningWorker, failingServer.id)
      const succeedingJobCompletion = waitForJobCompletion(provisioningWorker, succeedingServer.id)

      await enqueueProvisionServerJob(failingServer.id)
      await failingJobFailure

      await enqueueProvisionServerJob(succeedingServer.id)
      await succeedingJobCompletion

      await expectServerStatusToBecome(failingServer.id, "failed")
      expect((await findServerRow(succeedingServer.id)).status).toBe("active")
    }, 20000)
  })

  describe("idempotency and re-runs", () => {
    it("skips the ssh host key scan when re-running a server with a stored actualState and key access", async () => {
      const provisionedServer = await insertKeyAccessServer()
      const storedSshHostKeys = provisionedServer.data?.facts?.sshHostKeys

      await runSucceedingProvisioningJob(provisionedServer.id)

      expect(remoteServerSpies.scanSshHostKeys).not.toHaveBeenCalled()
      const serverRow = await findServerRow(provisionedServer.id)
      const serverData = ServerDataSchema.parse(serverRow.data)
      expect(serverData.facts?.sshHostKeys).toEqual(storedSshHostKeys)
    })

    it("verifies connectivity and privilege escalation of the target access before hardening when the server uses password access", async () => {
      const provisionedServer = await insertPasswordAccessServer(`password-${randomUUID()}`)
      remoteServerSpies.assertConnectivity.mockImplementation(async () => {
        if (remoteServerSpies.installServiceUserAuthorizedKeys.mock.calls.length === 0) {
          throw new Error("Key access is not installed on the server yet")
        }
      })

      await runSucceedingProvisioningJob(provisionedServer.id)

      const [hardeningCallOrder] = remoteServerSpies.hardenSshAccess.mock.invocationCallOrder
      const [hardeningInstance] = remoteServerSpies.hardenSshAccess.mock.instances
      expect(hardeningInstance).toBe(remoteServerSpies.assertPrivilegeEscalation.mock.instances[0])
      expect(hardeningInstance).not.toBe(remoteServerSpies.installDocker.mock.instances[0])
      expect(remoteServerSpies.assertPrivilegeEscalation.mock.invocationCallOrder[0]).toBeLessThan(
        hardeningCallOrder,
      )
      const connectivityCallIndexBeforeHardening = findCallIndexOfLastInvocationBefore(
        remoteServerSpies.assertConnectivity.mock.invocationCallOrder,
        hardeningCallOrder,
      )
      expect(connectivityCallIndexBeforeHardening).toBeGreaterThanOrEqual(0)
      expect(
        remoteServerSpies.assertConnectivity.mock.instances[connectivityCallIndexBeforeHardening],
      ).toBe(hardeningInstance)
      expect(getServerAccess(hardeningInstance)).toMatchObject({
        port: ACTUAL_STATE_SSH_PORT,
        username: DEFAULT_SERVER_SSH.username,
        privateKey: env.APP_SSH_PRIVATE_KEY,
      })
    })

    it("hardens through the desired state access when the key access already works on a password server", async () => {
      const provisionedServer = await insertPasswordAccessServer(`password-${randomUUID()}`)

      await runSucceedingProvisioningJob(provisionedServer.id)

      const [hardeningInstance] = remoteServerSpies.hardenSshAccess.mock.instances
      expect(getServerAccess(hardeningInstance)).toMatchObject({
        port: DEFAULT_SERVER_SSH.port,
        username: DEFAULT_SERVER_SSH.username,
        privateKey: env.APP_SSH_PRIVATE_KEY,
      })
    })

    it("verifies connectivity and privilege escalation before hardening when the server already uses key access", async () => {
      const provisionedServer = await insertKeyAccessServer()

      await runSucceedingProvisioningJob(provisionedServer.id)

      expect(remoteServerSpies.hardenSshAccess).toHaveBeenCalledTimes(1)
      expect(remoteServerSpies.hardenSshAccess).toHaveBeenCalledWith(DEFAULT_SERVER_SSH.port)
      const [hardeningCallOrder] = remoteServerSpies.hardenSshAccess.mock.invocationCallOrder
      const [hardeningInstance] = remoteServerSpies.hardenSshAccess.mock.instances
      const privilegeEscalationCallIndexBeforeHardening = findCallIndexOfLastInvocationBefore(
        remoteServerSpies.assertPrivilegeEscalation.mock.invocationCallOrder,
        hardeningCallOrder,
      )
      expect(privilegeEscalationCallIndexBeforeHardening).toBeGreaterThanOrEqual(0)
      expect(
        remoteServerSpies.assertPrivilegeEscalation.mock.instances[
          privilegeEscalationCallIndexBeforeHardening
        ],
      ).toBe(hardeningInstance)
      const connectivityCallIndexBeforeHardening = findCallIndexOfLastInvocationBefore(
        remoteServerSpies.assertConnectivity.mock.invocationCallOrder,
        hardeningCallOrder,
      )
      expect(connectivityCallIndexBeforeHardening).toBeGreaterThanOrEqual(0)
      expect(
        remoteServerSpies.assertConnectivity.mock.instances[connectivityCallIndexBeforeHardening],
      ).toBe(hardeningInstance)
      expect(getServerAccess(hardeningInstance)).toMatchObject({
        port: ACTUAL_STATE_SSH_PORT,
        username: DEFAULT_SERVER_SSH.username,
        privateKey: env.APP_SSH_PRIVATE_KEY,
      })
    })

    it("verifies connectivity of a new target access after hardening before reporting the server active", async () => {
      const provisionedServer = await insertKeyAccessServer()

      await runSucceedingProvisioningJob(provisionedServer.id)

      const [hardeningCallOrder] = remoteServerSpies.hardenSshAccess.mock.invocationCallOrder
      const connectivityCallOrders = remoteServerSpies.assertConnectivity.mock.invocationCallOrder
      expect(connectivityCallOrders.at(-1)).toBeGreaterThan(hardeningCallOrder)
      expect(remoteServerSpies.assertConnectivity.mock.instances.at(-1)).not.toBe(
        remoteServerSpies.installDocker.mock.instances[0],
      )
    })

    it("deduplicates a second queue add with the same job id while the job is unfinished", async () => {
      const provisionedServer = await insertPasswordAccessServer(`password-${randomUUID()}`)
      const heldDockerInstall = createDeferredStep()
      remoteServerSpies.installDocker.mockReturnValueOnce(heldDockerInstall.stepPromise)
      const provisioningWorker = await startProvisioningWorker()
      const jobCompletion = waitForJobCompletion(provisioningWorker, provisionedServer.id)

      await enqueueProvisionServerJob(provisionedServer.id)
      await vi.waitFor(() => expect(remoteServerSpies.installDocker).toHaveBeenCalledTimes(1), {
        timeout: 10000,
      })

      await enqueueProvisionServerJob(provisionedServer.id)

      expect(
        await provisionServerQueueInstance.getJobCountByTypes("active", "wait", "delayed"),
      ).toBe(1)
      heldDockerInstall.resolveStep()
      await jobCompletion
      expect(remoteServerSpies.installDocker).toHaveBeenCalledTimes(1)
      expect(await provisionServerQueueInstance.getJobs()).toHaveLength(0)
    }, 20000)

    it("shows the provisioning status while the job re-runs on an active server", async () => {
      const provisionedServer = await insertKeyAccessServer({ status: "active" })
      const heldDockerInstall = createDeferredStep()
      remoteServerSpies.installDocker.mockReturnValueOnce(heldDockerInstall.stepPromise)
      const provisioningWorker = await startProvisioningWorker()
      const jobCompletion = waitForJobCompletion(provisioningWorker, provisionedServer.id)

      await enqueueProvisionServerJob(provisionedServer.id)
      await vi.waitFor(() => expect(remoteServerSpies.installDocker).toHaveBeenCalledTimes(1), {
        timeout: 10000,
      })

      expect((await findServerRow(provisionedServer.id)).status).toBe("provisioning")
      heldDockerInstall.resolveStep()
      await jobCompletion
      expect((await findServerRow(provisionedServer.id)).status).toBe("active")
    }, 20000)

    it("re-runs the ssh steps and refreshes actualState appliedAt when the job re-runs on an active server", async () => {
      const provisionedServer = await insertKeyAccessServer({ status: "active" })
      const provisioningStartedAt = Date.now()

      await runSucceedingProvisioningJob(provisionedServer.id)

      expect(remoteServerSpies.installDocker).toHaveBeenCalledTimes(1)
      expect(remoteServerSpies.hardenSshAccess).toHaveBeenCalledTimes(1)
      const serverRow = await findServerRow(provisionedServer.id)
      const serverData = ServerDataSchema.parse(serverRow.data)
      expect(serverData.actualState.appliedAt).not.toBe(PREVIOUSLY_APPLIED_AT)
      expect(new Date(serverData.actualState.appliedAt).getTime()).toBeGreaterThanOrEqual(
        provisioningStartedAt,
      )
    })

    it("does not regenerate the endpoint desiredState when the job re-runs on an active server", async () => {
      const provisionedServer = await insertKeyAccessServer({ status: "active" })
      const provisionedProtocol = await insertTestProtocol()
      const provisionedEndpoint = await insertTestEndpoint({
        serverId: provisionedServer.id,
        protocolId: provisionedProtocol.id,
        port: fakeEndpointDesiredState.port,
        data: {
          desiredState: fakeEndpointDesiredState,
          actualState: { ...fakeEndpointDesiredState, appliedAt: fakeEndpointAppliedAt },
        },
      })

      await runSucceedingProvisioningJob(provisionedServer.id)

      expect(remoteServerSpies.createEndpointDesiredState).not.toHaveBeenCalled()
      const endpointRow = await findEndpointRow(provisionedEndpoint.id)
      const endpointData = EndpointDataSchema.parse(endpointRow.data)
      expect(endpointData.desiredState).toEqual(fakeEndpointDesiredState)
    })

    it("re-running after a deploy failure reuses the stored endpoint desiredState", async () => {
      const provisionedServer = await insertPasswordAccessServer(`password-${randomUUID()}`)
      const provisionedProtocol = await insertTestProtocol()
      const provisionedEndpoint = await insertTestEndpoint({
        serverId: provisionedServer.id,
        protocolId: provisionedProtocol.id,
        data: {},
      })
      remoteServerSpies.allowFirewallPort.mockRejectedValueOnce(new Error("Firewall failure"))
      const provisioningWorker = await startProvisioningWorker()
      const firstJobFailure = waitForJobFailure(provisioningWorker, provisionedServer.id)

      await enqueueProvisionServerJob(provisionedServer.id, { attempts: 1 })
      await firstJobFailure
      await expectServerStatusToBecome(provisionedServer.id, "failed")
      const endpointDesiredStateAfterFailure = await findEndpointDesiredState(
        provisionedEndpoint.id,
      )
      const failedJob = await provisionServerQueueInstance.getJob(provisionedServer.id)
      await failedJob?.remove()
      remoteServerSpies.createEndpointDesiredState.mockClear()
      const secondJobCompletion = waitForJobCompletion(provisioningWorker, provisionedServer.id)

      await enqueueProvisionServerJob(provisionedServer.id)
      await secondJobCompletion

      expect(remoteServerSpies.createEndpointDesiredState).not.toHaveBeenCalled()
      expect(await findEndpointDesiredState(provisionedEndpoint.id)).toEqual(
        endpointDesiredStateAfterFailure,
      )
      expect((await findServerRow(provisionedServer.id)).status).toBe("active")
    }, 20000)

    it("moves a failed server to active when a retry succeeds", async () => {
      const provisionedServer = await insertKeyAccessServer({ status: "failed" })

      await runSucceedingProvisioningJob(provisionedServer.id)

      expect((await findServerRow(provisionedServer.id)).status).toBe("active")
    })
  })

  describe("data-state edges", () => {
    it("fails terminally without database changes when the server id does not exist", async () => {
      await insertKeyAccessServer()
      const serverRowsBeforeJob = await db.select().from(server)
      const missingServerId = randomUUID()

      await runFailingProvisioningJob(missingServerId, { attempts: 3 })

      await expectJobFailureReason(
        missingServerId,
        createProvisioningErrorReason(missingServerId, "server_not_found"),
      )
      const provisionServerJob = await provisionServerQueueInstance.getJob(missingServerId)
      expect(provisionServerJob?.attemptsMade).toBe(1)
      expect(await db.select().from(server)).toEqual(serverRowsBeforeJob)
    })

    it("moves the server to failed when its stored data is invalid", async () => {
      const provisionedServer = await insertKeyAccessServer({
        data: { actualState: { ssh: { type: "password", username: "spurro" } } } as ServerData,
      })

      await runTerminallyFailingProvisioningJob(provisionedServer.id, "invalid_server_data")

      expect(countRemoteServerCalls()).toEqual(createZeroRemoteServerCallCounts())
    }, 20000)

    it("moves the server to failed when its stored desiredState is invalid", async () => {
      const provisionedServer = await insertKeyAccessServer({
        data: createKeyAccessServerData({ desiredState: {} }),
      })

      await runTerminallyFailingProvisioningJob(
        provisionedServer.id,
        "invalid_server_desired_state",
      )

      expect(countRemoteServerCalls()).toEqual(createZeroRemoteServerCallCounts())
    }, 20000)

    it("moves the server to failed when its desiredState cannot yield a key access", async () => {
      const provisionedServer = await insertKeyAccessServer({
        data: createKeyAccessServerData({
          desiredState: {
            ssh: { type: "password", username: "spurro", password: "desired-password", port: 22 },
            baseDirectory: "/opt/spurro",
          },
        }),
      })

      await runTerminallyFailingProvisioningJob(provisionedServer.id, "no_desired_state_access")

      expect(remoteServerSpies.installDocker).not.toHaveBeenCalled()
    }, 20000)

    it("moves the server to failed when a hardened server has no stored ssh host keys", async () => {
      const provisionedServer = await insertKeyAccessServer({
        data: createKeyAccessServerData({ facts: { sshHostKeys: [] } }),
      })

      await runTerminallyFailingProvisioningJob(
        provisionedServer.id,
        "hardened_without_ssh_host_keys",
      )

      expect(countRemoteServerCalls()).toEqual(createZeroRemoteServerCallCounts())
    }, 20000)

    it("moves the server to failed when an endpoint desired state is invalid", async () => {
      const provisionedServer = await insertKeyAccessServer()
      const provisionedProtocol = await insertTestProtocol()
      const provisionedEndpoint = await insertTestEndpoint({
        serverId: provisionedServer.id,
        protocolId: provisionedProtocol.id,
        data: { desiredState: { protocolCode: "amneziawg2", port: -1 } },
      })

      await runTerminallyFailingProvisioningJob(
        provisionedServer.id,
        "invalid_endpoint_desired_state",
      )

      const endpointRow = await findEndpointRow(provisionedEndpoint.id)
      expect(endpointRow.data).toEqual(provisionedEndpoint.data)
    }, 20000)

    it("moves the server to failed when an endpoint data column holds no object", async () => {
      const provisionedServer = await insertKeyAccessServer()
      const provisionedProtocol = await insertTestProtocol()
      const provisionedEndpoint = await insertTestEndpoint({
        serverId: provisionedServer.id,
        protocolId: provisionedProtocol.id,
        data: "garbage" as unknown as EndpointData,
      })

      await runTerminallyFailingProvisioningJob(provisionedServer.id, "invalid_endpoint_data")

      const endpointRow = await findEndpointRow(provisionedEndpoint.id)
      expect(endpointRow.data).toEqual(provisionedEndpoint.data)
    }, 20000)

    it("keeps a sibling server and its endpoints unchanged while the target server is provisioned", async () => {
      const provisionedProtocol = await insertTestProtocol()
      const siblingServer = await insertKeyAccessServer({ status: "active" })
      const siblingEndpoint = await insertTestEndpoint({
        serverId: siblingServer.id,
        protocolId: provisionedProtocol.id,
      })
      const provisionedServer = await insertPasswordAccessServer(`password-${randomUUID()}`)
      await insertTestEndpoint({
        serverId: provisionedServer.id,
        protocolId: provisionedProtocol.id,
        data: {},
      })

      await runSucceedingProvisioningJob(provisionedServer.id)

      expect(await findServerRow(siblingServer.id)).toEqual(siblingServer)
      expect(await findEndpointRow(siblingEndpoint.id)).toEqual(siblingEndpoint)
    })
  })

  describe("concurrency", () => {
    it("keeps statuses and ssh calls separated when two servers are processed in parallel with mixed outcomes", async () => {
      const provisionedProtocol = await insertTestProtocol()
      const succeedingServer = await insertPasswordAccessServer(`password-${randomUUID()}`)
      const succeedingEndpoint = await insertTestEndpoint({
        serverId: succeedingServer.id,
        protocolId: provisionedProtocol.id,
        port: 51820,
        data: {},
      })
      const failingServer = await insertPasswordAccessServer(`password-${randomUUID()}`)
      const failingEndpoint = await insertTestEndpoint({
        serverId: failingServer.id,
        protocolId: provisionedProtocol.id,
        port: 51999,
        data: {},
      })
      remoteServerSpies.allowFirewallPort.mockImplementation(async (port) => {
        if (port === failingEndpoint.port) throw new Error("Firewall failure")
      })
      const heldDockerInstalls = [createDeferredStep(), createDeferredStep()]
      remoteServerSpies.installDocker
        .mockReturnValueOnce(heldDockerInstalls[0].stepPromise)
        .mockReturnValueOnce(heldDockerInstalls[1].stepPromise)
      const provisioningWorker = await startProvisioningWorker()
      const succeedingJobCompletion = waitForJobCompletion(provisioningWorker, succeedingServer.id)
      const failingJobFailure = waitForJobFailure(provisioningWorker, failingServer.id)

      await Promise.all([
        enqueueProvisionServerJob(succeedingServer.id),
        enqueueProvisionServerJob(failingServer.id, { attempts: 1 }),
      ])
      await vi.waitFor(
        async () => expect(await provisionServerQueueInstance.getJobCountByTypes("active")).toBe(2),
        { timeout: 10000 },
      )
      for (const heldDockerInstall of heldDockerInstalls) heldDockerInstall.resolveStep()
      await Promise.all([succeedingJobCompletion, failingJobFailure])

      await expectServerStatusToBecome(failingServer.id, "failed")
      expect((await findServerRow(succeedingServer.id)).status).toBe("active")
      expect(remoteServerSpies.allowFirewallPort).toHaveBeenCalledWith(
        succeedingEndpoint.port,
        ProtocolRegistry.amneziawg2.transportProtocol,
      )
      expect(remoteServerSpies.allowFirewallPort).toHaveBeenCalledWith(
        failingEndpoint.port,
        ProtocolRegistry.amneziawg2.transportProtocol,
      )
      const succeedingEndpointData = EndpointDataSchema.parse(
        (await findEndpointRow(succeedingEndpoint.id)).data,
      )
      expect(
        Amneziawg2EndpointActualStateSchema.parse(succeedingEndpointData.actualState).port,
      ).toBe(succeedingEndpoint.port)
      const failingEndpointData = EndpointDataSchema.parse(
        (await findEndpointRow(failingEndpoint.id)).data,
      )
      expect(
        Amneziawg2EndpointDesiredStateSchema.parse(failingEndpointData.desiredState).port,
      ).toBe(failingEndpoint.port)
      expect(failingEndpointData.actualState).toBeUndefined()
    }, 20000)
  })

  describe("technical", () => {
    it("logs a worker error and stays alive when the queue connection is unreachable", async () => {
      const originalQueueUrl = process.env.QUEUE_URL
      process.env.QUEUE_URL = UNREACHABLE_QUEUE_URL
      vi.resetModules()

      try {
        const { workerLogger: disconnectedWorkerLogger } = await import("@/core/logger/index.js")
        const disconnectedWorkerLoggerErrorSpy = vi
          .spyOn(disconnectedWorkerLogger, "error")
          .mockImplementation(() => undefined)
        const { createProvisioningWorker: createDisconnectedProvisioningWorker } =
          await import("@/worker/createProvisioningWorker.js")
        const disconnectedWorker = createDisconnectedProvisioningWorker()

        try {
          await vi.waitFor(
            () =>
              expect(readLoggedMessages(disconnectedWorkerLoggerErrorSpy)).toContain(
                "Worker error.",
              ),
            { timeout: 10000 },
          )
        } finally {
          await disconnectedWorker.close(true)
        }
      } finally {
        process.env.QUEUE_URL = originalQueueUrl
        vi.resetModules()
      }
    }, 20000)

    it("ignores a failed event that arrives without a job", async () => {
      const untouchedServer = await insertKeyAccessServer({ status: "active" })
      const provisionedServer = await insertPasswordAccessServer(`password-${randomUUID()}`)
      const provisioningWorker = await startProvisioningWorker()
      const jobCompletion = waitForJobCompletion(provisioningWorker, provisionedServer.id)

      provisioningWorker.emit("failed", undefined, new Error("Queue failure"), "active")
      await enqueueProvisionServerJob(provisionedServer.id)
      await jobCompletion

      expect(await findServerRow(untouchedServer.id)).toEqual(untouchedServer)
      expect((await findServerRow(provisionedServer.id)).status).toBe("active")
    })

    it("logs the failed status update and keeps processing when the job payload carries an unusable server id", async () => {
      const workerLoggerErrorSpy = vi
        .spyOn(workerLogger, "error")
        .mockImplementation(() => undefined)
      const unusableServerId = "not-a-uuid"
      const provisionedServer = await insertPasswordAccessServer(`password-${randomUUID()}`)
      const provisioningWorker = await startProvisioningWorker()
      const unusableJobFailure = waitForJobFailure(provisioningWorker, unusableServerId)
      const provisionedJobCompletion = waitForJobCompletion(
        provisioningWorker,
        provisionedServer.id,
      )

      await enqueueProvisionServerJob(unusableServerId, { attempts: 1 })
      await unusableJobFailure
      await vi.waitFor(
        () =>
          expect(readLoggedMessages(workerLoggerErrorSpy)).toContain(
            "Failed to mark server as failed.",
          ),
        { timeout: 10000 },
      )
      await enqueueProvisionServerJob(provisionedServer.id)
      await provisionedJobCompletion

      expect((await findServerRow(provisionedServer.id)).status).toBe("active")
    }, 20000)
  })
})
