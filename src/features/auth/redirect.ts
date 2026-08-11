export function safeInternalRedirect(value: unknown) {
  return typeof value === 'string' &&
    value.startsWith('/app/') &&
    !value.startsWith('//')
    ? value
    : '/app'
}
