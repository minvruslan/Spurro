import { db } from "./db.js"

export type DbOrTx = Parameters<Parameters<typeof db.transaction>[0]>[0]
