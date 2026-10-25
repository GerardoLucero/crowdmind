/** Untrusted text goes between tags; strip look-alike tags so it cannot close them early. */
export function fence(tag: 'scenario' | 'response', value: string, max: number): string {
  const safe = value.slice(0, max).replace(/<\/?(scenario|response)\s*>/gi, '')
  return `<${tag}>\n${safe}\n</${tag}>`
}

/** Short free-text fields (custom profile) become plain prompt text: no tags or quotes. */
export function plain(value: string, max: number): string {
  return value.replace(/[<>"`]/g, '').replace(/\s+/g, ' ').trim().slice(0, max)
}
