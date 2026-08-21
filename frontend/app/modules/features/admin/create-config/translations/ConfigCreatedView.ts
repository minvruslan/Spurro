export const messages = {
  ru: {
    title: "Конфигурация создана",
    warning: {
      shownOnce: "Файл конфигурации и ссылка показываются только один раз.",
      unrecoverable:
        "Сохраните их сейчас — после ухода со страницы получить их снова будет невозможно.",
    },
    fields: {
      name: { label: "Название" },
      link: { label: "Ссылка с конфигурацией" },
      file: { label: "Файл конфигурации", size: "{kilobytes} КБ" },
    },
    notifications: {
      copied: "Ссылка скопирована",
      copyError: "Не удалось скопировать ссылку.",
    },
    actions: {
      download: "Сохранить файл",
      copy: "Скопировать ссылку",
      done: "Готово",
    },
  },
  en: {
    title: "Configuration created",
    warning: {
      shownOnce: "The configuration file and the link are shown only once.",
      unrecoverable: "Save them now — they cannot be retrieved after you leave this page.",
    },
    fields: {
      name: { label: "Name" },
      link: { label: "Configuration link" },
      file: { label: "Configuration file", size: "{kilobytes} KB" },
    },
    notifications: {
      copied: "Link copied",
      copyError: "Could not copy the link.",
    },
    actions: {
      download: "Save file",
      copy: "Copy link",
      done: "Done",
    },
  },
}
