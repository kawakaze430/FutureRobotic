/** Fail-closed destinations for user/provider supplied Markdown links. */
export function safeMarkdownUrl(value: string): string {
  if (typeof value !== 'string' || !value || value.length > 2048 ||
      value.trim() !== value || /[\u0000-\u001f\u007f\\]/u.test(value)) return '';
  if (value.startsWith('#')) return /^#[^<>]*$/u.test(value) ? value : '';
  if (value.startsWith('/') && !value.startsWith('//')) {
    return !/[<>]/u.test(value) ? value : '';
  }
  if (/^https?:\/\//iu.test(value)) {
    try {
      const parsed = new URL(value);
      if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname ||
          parsed.username || parsed.password || /[<>]/u.test(value)) return '';
      return value;
    } catch { return ''; }
  }
  if (/^mailto:/iu.test(value)) {
    // Do not allow headers, fragments or multi-recipient injection via model text.
    const address = value.slice(7);
    return /^[a-z0-9.!#$%&'*+/=?^_{\x60|}~-]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,63}$/iu.test(address)
      ? value : '';
  }
  return '';
}
