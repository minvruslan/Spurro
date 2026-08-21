export const messages = {
  ru: {
    title: "Одна конфигурация — одно устройство",
    description:
      "Конфигурация — это личный ключ, по которому приложение подключает ваше устройство к VPN-серверу. Сейчас мы его создадим, а потом покажем, как добавить в приложение.",
    warningBanner: {
      title: "Не делитесь конфигурацией",
      description:
        "Если использовать одну конфигурацию на нескольких устройствах одновременно, то VPN не будет нормально работать ни на одном из них.",
    },
    createAction: "Создать конфигурацию",
    footnote: "Конфигурацию можно будет удалить и создать новую в любой момент.",
    notifications: { createError: "Не удалось создать конфигурацию." },
  },
  en: {
    title: "One configuration, one device",
    description:
      "A configuration is your personal key that the app uses to connect your device to the VPN server. We’ll create it now and then show you how to add it to the app.",
    warningBanner: {
      title: "Don’t share the configuration",
      description:
        "If the same configuration is used on several devices at once, the VPN won’t work properly on any of them.",
    },
    createAction: "Create configuration",
    footnote: "You can delete the configuration and create a new one at any time.",
    notifications: { createError: "Could not create the configuration." },
  },
}
