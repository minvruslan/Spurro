import { execa } from "execa"

export async function assertCommandRunnerImageExists(imageName: string): Promise<void> {
  try {
    await execa("docker", ["image", "inspect", imageName])
  } catch (error) {
    throw new Error(
      `[command-runner] docker image "${imageName}" is unavailable — build it with "pnpm build:command-runner-image"`,
      { cause: error },
    )
  }
}
