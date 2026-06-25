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
    deleteConfirmationDialog: {
      title: "Удалить сервер?",
      description: "Сервер «{name}» будет удалён без возможности восстановления.",
    },
    notifications: {
      updated: "Сервер обновлён",
      updateError: "Не удалось обновить сервер.",
      deleted: "Сервер удалён.",
      deleteError: "Не удалось удалить сервер.",
      notFoundError: "Сервер не найден.",
    },
    actions: {
      cancel: "Отмена",
      update: "Сохранить",
      delete: "Удалить",
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
    deleteConfirmationDialog: {
      title: "Delete server?",
      description: "Server “{name}” will be permanently deleted.",
    },
    notifications: {
      updated: "Server updated",
      updateError: "Could not update the server.",
      deleted: "Server deleted.",
      deleteError: "Could not delete the server.",
      notFoundError: "Server not found.",
    },
    actions: {
      cancel: "Cancel",
      update: "Save",
      delete: "Delete",
    },
  },
}
