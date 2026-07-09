import { execa } from "execa"

export async function assertRemoteCommandRunnerImageExists(imageName: string): Promise<void> {
  try {
    await execa("docker", ["image", "inspect", imageName])
  } catch (error) {
    throw new Error(
      `[remote-command-runner] docker image "${imageName}" is unavailable — build it with "pnpm build:remote-command-runner-image"`,
      { cause: error },
    )
  }
}
