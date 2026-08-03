let issuedTestIpCount = 0

export function createTestIp() {
  issuedTestIpCount += 1
  return `10.${(issuedTestIpCount >> 16) & 255}.${(issuedTestIpCount >> 8) & 255}.${issuedTestIpCount & 255}`
}
