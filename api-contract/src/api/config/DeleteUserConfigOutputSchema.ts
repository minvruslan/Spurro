import { z } from "zod"

export const DeleteUserConfigOutputSchema = z.object({ id: z.uuid() })
