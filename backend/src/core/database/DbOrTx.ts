import { db } from "./db.js"

type Database = typeof db
type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0]

export type DbOrTx = Database | Transaction
