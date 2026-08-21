import type { WizardStepOrder } from "./WizardStepOrder"

export type WizardStep = (typeof WizardStepOrder)[number]
