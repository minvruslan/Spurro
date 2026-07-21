export function extractField(out: string, key: string): string {
  return out.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1]?.trim() ?? ""
}
