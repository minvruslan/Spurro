export const messages = {
  ru: {
    title: "Редактирование пользователя",
    fields: {
      name: { label: "Имя", placeholder: "Иван Иванов" },
      email: { label: "Email" },
      limits: { label: "Лимиты" },
    },
    deleteConfirmationDialog: {
      title: "Удалить пользователя?",
      description: "Пользователь «{name}» будет удалён без возможности восстановления.",
    },
    notifications: {
      updated: "Пользователь обновлён.",
      updateError: "Не удалось обновить пользователя.",
      deleted: "Пользователь удалён.",
      deleteError: "Не удалось удалить пользователя.",
      notFoundError: "Пользователь не найден.",
    },
    actions: {
      cancel: "Отмена",
      update: "Сохранить",
      delete: "Удалить",
    },
  },
  en: {
    title: "Edit user",
    fields: {
      name: { label: "Name", placeholder: "John Doe" },
      email: { label: "Email" },
      limits: { label: "Limits" },
    },
    deleteConfirmationDialog: {
      title: "Delete user?",
      description: "User “{name}” will be permanently deleted.",
    },
    notifications: {
      updated: "User updated.",
      updateError: "Could not update the user.",
      deleted: "User deleted.",
      deleteError: "Could not delete the user.",
      notFoundError: "User not found.",
    },
    actions: {
      cancel: "Cancel",
      update: "Save",
      delete: "Delete",
    },
  },
}
