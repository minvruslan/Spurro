type NotificationType = "success" | "error"

interface NotificationState {
  type: NotificationType
  message: string
  open: boolean
}

interface NotificationOptions {
  keepOnNavigation?: boolean
  timeout?: number
}

const NOTIFICATION_DEFAULT_TIMEOUT = 5000
const NOTIFICATION_STATE_KEY = "notification-banner"

export function useNotificationBanner() {
  const notification = useState<NotificationState>(NOTIFICATION_STATE_KEY, () => ({
    type: "success",
    message: "",
    open: false,
  }))

  const autoDismissTimer = useState<ReturnType<typeof setTimeout> | null>(
    `${NOTIFICATION_STATE_KEY}:timer`,
    () => null,
  )

  const keepOnNavigation = useState(`${NOTIFICATION_STATE_KEY}:keep`, () => false)

  const clearAutoDismiss = () => {
    if (autoDismissTimer.value) {
      clearTimeout(autoDismissTimer.value)
      autoDismissTimer.value = null
    }
  }

  const dismiss = () => {
    clearAutoDismiss()
    notification.value.open = false
  }

  const show = (type: NotificationType, message: string, options?: NotificationOptions) => {
    clearAutoDismiss()
    notification.value = { type, message, open: true }
    keepOnNavigation.value = options?.keepOnNavigation ?? type === "success"
    if (import.meta.client) {
      autoDismissTimer.value = setTimeout(dismiss, options?.timeout ?? NOTIFICATION_DEFAULT_TIMEOUT)
    }
  }

  const showSuccess = (message: string, options?: NotificationOptions) =>
    show("success", message, options)
  const showError = (message: string, options?: NotificationOptions) =>
    show("error", message, options)

  if (import.meta.client) {
    const installed = useState(`${NOTIFICATION_STATE_KEY}:installed`, () => false)

    if (!installed.value) {
      installed.value = true
      useRouter().afterEach(() => {
        if (!notification.value.open) return
        if (keepOnNavigation.value) {
          keepOnNavigation.value = false
          return
        }
        dismiss()
      })
    }
  }

  return {
    notification: readonly(notification),
    showSuccess,
    showError,
    dismiss,
  }
}
