import type { User } from "@spurro/shared"
// TODO: вернуть для реального запроса, когда уберём мок.
// import { UserSchema } from "@spurro/shared"
// import { z } from "zod"
// import { useApi } from "@/modules/shared/services"

// const ResponseSchema = z.object({ data: z.array(UserSchema) })

// TODO: ВРЕМЕННО — мок для отладки UI. Вернуть реальный запрос ниже.
const MOCK_USERS: User[] = [
  {
    id: "1",
    name: "Akim Karimov",
    email: "akim@email.com",
    role: "user",
    banned: false,
    banReason: null,
    createdAt: "2026-06-01T10:00:00.000Z",
  },
  {
    id: "2",
    name: "Andrew Petrov",
    email: "andrew@email.com",
    role: "user",
    banned: false,
    banReason: null,
    createdAt: "2026-06-02T10:00:00.000Z",
  },
  {
    id: "3",
    name: "Maria Sokolova",
    email: "maria@email.com",
    role: "admin",
    banned: false,
    banReason: null,
    createdAt: "2026-06-03T10:00:00.000Z",
  },
  {
    id: "4",
    name: "Мария Соколова с очень длинным именем",
    email: "maria.sokolova.with.a.very.long.address@example-company.com",
    role: "user",
    banned: false,
    banReason: null,
    createdAt: "2026-06-04T10:00:00.000Z",
  },
]

export async function getUsers(): Promise<User[]> {
  // TODO: ВРЕМЕННО — мок + задержка для отладки UI/анимации. Вернуть реальный запрос ниже.
  await new Promise((resolve) => setTimeout(resolve, 300))
  return MOCK_USERS

  // const api = useApi()
  // const response = await api("/api/users")
  // return ResponseSchema.parse(response).data
}
