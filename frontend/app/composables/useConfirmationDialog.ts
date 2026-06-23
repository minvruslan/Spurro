interface ConfirmationDialogOptions {
  title: string
  description?: string
  confirmButtonText?: string
  cancelButtonText?: string
  destructive?: boolean
}

interface ConfirmationDialogState extends ConfirmationDialogOptions {
  open: boolean
}

let resolve: ((value: boolean) => void) | null = null

export function useConfirmationDialog() {
  const state = useState<ConfirmationDialogState>("confirmation-dialog", () => ({
    open: false,
    title: "",
  }))

  function confirm(options: ConfirmationDialogOptions): Promise<boolean> {
    if (import.meta.server) return Promise.resolve(false)

    resolve?.(false)
    state.value = { ...options, open: true }

    return new Promise<boolean>((res) => {
      resolve = res
    })
  }

  function respond(value: boolean) {
    state.value.open = false
    resolve?.(value)
    resolve = null
  }

  return { state, confirm, respond }
}
