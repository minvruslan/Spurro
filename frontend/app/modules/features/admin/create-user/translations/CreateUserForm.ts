export const messages = {
  ru: {
    title: "Создание пользователя",
    fields: {
      name: { label: "Имя", placeholder: "Иван Иванов" },
      email: { label: "Email", placeholder: "user{'@'}example.com" },
      limits: { label: "Лимиты" },
    },
    notifications: {
      created: "Пользователь создан",
      createError: "Не удалось создать пользователя.",
    },
    actions: {
      cancel: "Отмена",
      create: "Создать",
    },
  },
  en: {
    title: "Create user",
    fields: {
      name: { label: "Name", placeholder: "John Doe" },
      email: { label: "Email", placeholder: "user{'@'}example.com" },
      limits: { label: "Limits" },
    },
    notifications: {
      created: "User created",
      createError: "Could not create the user.",
    },
    actions: {
      cancel: "Cancel",
      create: "Create",
    },
  },
}
