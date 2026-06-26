export const messages = {
  ru: {
    title: "Редактирование конфигурации",
    fields: {
      name: { label: "Название", placeholder: "iPhone" },
      endpoint: { label: "Точка подключения" },
      deviceType: { label: "Устройство", placeholder: "Выберите устройство" },
    },
    deleteConfirmationDialog: {
      title: "Удалить конфигурацию?",
      description: "Конфигурация «{name}» будет удалена без возможности восстановления.",
    },
    notifications: {
      updated: "Конфигурация обновлена",
      updateError: "Не удалось обновить конфигурацию.",
      deleted: "Конфигурация удалена.",
      deleteError: "Не удалось удалить конфигурацию.",
      notFoundError: "Конфигурация не найдена.",
    },
    actions: {
      cancel: "Отмена",
      update: "Сохранить",
      delete: "Удалить",
    },
  },
  en: {
    title: "Edit configuration",
    fields: {
      name: { label: "Name", placeholder: "iPhone" },
      endpoint: { label: "Endpoint" },
      deviceType: { label: "Device", placeholder: "Select a device" },
    },
    deleteConfirmationDialog: {
      title: "Delete configuration?",
      description: "Configuration “{name}” will be permanently deleted.",
    },
    notifications: {
      updated: "Configuration updated",
      updateError: "Could not update the configuration.",
      deleted: "Configuration deleted.",
      deleteError: "Could not delete the configuration.",
      notFoundError: "Configuration not found.",
    },
    actions: {
      cancel: "Cancel",
      update: "Save",
      delete: "Delete",
    },
  },
}
