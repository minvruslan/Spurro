export const messages = {
  ru: {
    title: "Редактирование сервера",
    fields: {
      name: { label: "Название", placeholder: "Amsterdam" },
      country: { label: "Страна" },
      ip: { label: "IP-адрес" },
      domain: { label: "Доменное имя" },
      protocols: { label: "Протоколы" },
    },
    notifications: {
      updated: "Сервер обновлён",
      updateError: "Не удалось обновить сервер.",
      notFoundError: "Сервер не найден.",
    },
    actions: {
      cancel: "Отмена",
      update: "Сохранить",
    },
  },
  en: {
    title: "Edit server",
    fields: {
      name: { label: "Name", placeholder: "Amsterdam" },
      country: { label: "Country" },
      ip: { label: "IP address" },
      domain: { label: "Domain name" },
      protocols: { label: "Protocols" },
    },
    notifications: {
      updated: "Server updated",
      updateError: "Could not update the server.",
      notFoundError: "Server not found.",
    },
    actions: {
      cancel: "Cancel",
      update: "Save",
    },
  },
}
