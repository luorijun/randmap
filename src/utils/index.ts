/**
 * 将 BigInt 转换为 62 进制字符串 (0-9a-zA-Z)
 * @param num 要转换的 BigInt
 * @returns 62 进制字符串表示
 */
export function toBase62(num: bigint): string {
  if (num === 0n) return '0'
  if (num < 0n) throw new Error('Number must be non-negative')

  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let result = ''
  let n = num

  while (n > 0n) {
    result = chars[Number(n % 62n)] + result
    n = n / 62n
  }

  return result
}

/**
 * 将 62 进制字符串转换为 BigInt
 * @param str 62 进制字符串
 * @returns 对应的 BigInt
 */
export function fromBase62(str: string): bigint {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let result = 0n

  for (let i = 0; i < str.length; i++) {
    const index = chars.indexOf(str[i])
    if (index === -1) {
      throw new Error(`Invalid character '${str[i]}' in base62 string`)
    }
    result = result * 62n + BigInt(index)
  }

  return result
}
