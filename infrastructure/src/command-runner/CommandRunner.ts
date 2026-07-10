import { execa, type Options } from "execa"
import { CommandRunnerImage } from "./image/CommandRunnerImage.js"
import { assertCommandRunnerImageExists } from "./utils/index.js"

export class CommandRunner {
  private static imageVerified = false

  static async run(
    dockerFlags: string[],
    command: string[],
    options: Options = {},
  ): Promise<string> {
    if (!CommandRunner.imageVerified) {
      await assertCommandRunnerImageExists(CommandRunnerImage.name)
      CommandRunner.imageVerified = true
    }

    const { stdout } = await execa(
      "docker",
      ["run", "--rm", "--pull=never", ...dockerFlags, CommandRunnerImage.name, ...command],
      options,
    )

    if (typeof stdout === "string") return stdout
    if (options.stdout === "inherit") return ""

    throw new Error(`[command-runner] no stdout captured from: ${command.join(" ")}`)
  }
}
