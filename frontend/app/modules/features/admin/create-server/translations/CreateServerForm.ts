export const messages = {
  ru: {
    title: "Создание сервера",
    fields: {
      name: { label: "Название", placeholder: "Amsterdam" },
      country: { label: "Страна" },
      ip: { label: "IP-адрес", placeholder: "203.0.113.10" },
      domain: { label: "Доменное имя", placeholder: "ams1.spurro.net" },
      username: { label: "Имя пользователя", placeholder: "root" },
      password: { label: "Пароль" },
      protocols: { label: "Протоколы" },
    },
    notifications: {
      created: "Сервер успешно создан",
      createError: "Не удалось создать сервер.",
    },
    actions: {
      cancel: "Отмена",
      create: "Создать",
    },
  },
  en: {
    title: "Create server",
    fields: {
      name: { label: "Name", placeholder: "Amsterdam" },
      country: { label: "Country" },
      ip: { label: "IP address", placeholder: "203.0.113.10" },
      domain: { label: "Domain name", placeholder: "ams1.spurro.net" },
      username: { label: "Username", placeholder: "root" },
      password: { label: "Password" },
      protocols: { label: "Protocols" },
    },
    notifications: {
      created: "Server created successfully",
      createError: "Could not create the server.",
    },
    actions: {
      cancel: "Cancel",
      create: "Create",
    },
  },
}
