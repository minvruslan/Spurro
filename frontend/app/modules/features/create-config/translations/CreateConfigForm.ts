export const messages = {
  ru: {
    title: "Создание конфигурации",
    fields: {
      name: { label: "Название", placeholder: "iPhone" },
      endpoint: {
        label: "Точка подключения",
        placeholder: "Выберите точку подключения",
        empty: "Нет доступных точек подключения",
      },
      deviceType: {
        label: "Устройство",
        placeholder: "Выберите устройство",
        empty: "Нет доступных устройств",
      },
    },
    notifications: {
      created: "Конфигурация успешно создана",
      createError: "Не удалось создать конфигурацию.",
    },
    actions: {
      cancel: "Отмена",
      create: "Создать",
    },
  },
  en: {
    title: "Create configuration",
    fields: {
      name: { label: "Name", placeholder: "iPhone" },
      endpoint: {
        label: "Endpoint",
        placeholder: "Select an endpoint",
        empty: "No endpoints available",
      },
      deviceType: {
        label: "Device",
        placeholder: "Select a device",
        empty: "No devices available",
      },
    },
    notifications: {
      created: "Configuration created successfully",
      createError: "Could not create the configuration.",
    },
    actions: {
      cancel: "Cancel",
      create: "Create",
    },
  },
}
