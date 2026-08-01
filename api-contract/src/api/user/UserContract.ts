import { oc, adminAccess } from "../orpc"
import { z } from "zod"
import { UserSchema } from "./UserSchema"
import { UpsertUserSchema } from "./UpsertUserSchema"

export const UserContract = oc.prefix("/users").router({
  getUsers: adminAccess.route({ method: "GET", path: "/" }).output(z.array(UserSchema)),
  getUser: adminAccess
    .route({ method: "GET", path: "/{id}" })
    .input(z.object({ id: z.string() }))
    .errors({
      NOT_FOUND: { message: "User not found" },
    })
    .output(UserSchema),
  createUser: adminAccess
    .route({ method: "POST", path: "/", successStatus: 201 })
    .input(UpsertUserSchema)
    .errors({
      EMAIL_TAKEN: { status: 409, message: "User with this email already exists" },
    })
    .output(UserSchema),
  updateUser: adminAccess
    .route({ method: "PUT", path: "/{id}" })
    .input(UpsertUserSchema.extend({ id: z.string() }))
    .errors({
      NOT_FOUND: { message: "User not found" },
    })
    .output(UserSchema),
  deleteUser: adminAccess
    .route({ method: "DELETE", path: "/{id}" })
    .input(z.object({ id: z.string() }))
    .errors({
      NOT_FOUND: { message: "User not found" },
      CONFIG_DELETE_FAILED: {
        status: 502,
        message:
          "Failed to delete user's VPN configs: some servers are unreachable — fix or delete those servers, then retry",
      },
      CONFIGS_APPEARED: {
        status: 409,
        message: "User received new configs during deletion — retry",
      },
    })
    .output(z.object({ id: z.string() })),
})
