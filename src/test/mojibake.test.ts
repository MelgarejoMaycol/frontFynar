import { describe, expect, it } from 'vitest'

const suspicious = /(?:Ã|Â|â€|â€¦|�)/u
const sources = import.meta.glob('../**/*.{ts,tsx,css,json}', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

describe('codificación de textos visibles', () => {
  it('no contiene patrones comunes de mojibake en src', () => {
    const affected = Object.entries(sources)
      .filter(([path, content]) =>
        !path.endsWith('/mojibake.test.ts') && suspicious.test(content),
      )
      .map(([path]) => path)
    expect(affected).toEqual([])
  })
})
