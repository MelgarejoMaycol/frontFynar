let clearPrivateCache: () => void = () => undefined
export const registerPrivateCacheCleaner = (cleaner: () => void) => {
  clearPrivateCache = cleaner
  return () => {
    clearPrivateCache = () => undefined
  }
}
export const invalidateClientSession = () => clearPrivateCache()
