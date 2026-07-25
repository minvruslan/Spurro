export type ServerState = {
  ssh: { username: string; password: string } | { hardenedAt: string }
  sshHostKeys?: string[]
}
