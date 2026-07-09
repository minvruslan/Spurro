export function parseObfuscation(raw: string): Record<string, string> {
  const obfuscation: Record<string, string> = {}
  for (const line of raw.trim().split("\n")) {
    const separatorIndex = line.indexOf("=")
    if (separatorIndex === -1) continue
    const key = line.slice(0, separatorIndex).trim()
    if (key) obfuscation[key] = line.slice(separatorIndex + 1).trim()
  }
  return obfuscation
}
