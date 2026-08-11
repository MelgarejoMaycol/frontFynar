// Catálogo ISO 4217 vigente. Los nombres se resuelven localmente; no usa red.
const currencyCodes =
  `AED AFN ALL AMD AOA ARS AUD AWG AZN BAM BBD BDT BGN BHD BIF BMD BND BOB BOV BRL BSD BTN BWP BYN BZD CAD CDF CHE CHF CHW CLF CLP CNY COP COU CRC CUC CUP CVE CZK DJF DKK DOP DZD EGP ERN ETB EUR FJD FKP GBP GEL GHS GIP GMD GNF GTQ GYD HKD HNL HTG HUF IDR ILS INR IQD IRR ISK JMD JOD JPY KES KGS KHR KMF KPW KRW KWD KYD KZT LAK LBP LKR LRD LSL LYD MAD MDL MGA MKD MMK MNT MOP MRU MUR MVR MWK MXN MXV MYR MZN NAD NGN NIO NOK NPR NZD OMR PAB PEN PGK PHP PKR PLN PYG QAR RON RSD RUB RWF SAR SBD SCR SDG SEK SGD SHP SLE SLL SOS SRD SSP STN SVC SYP SZL THB TJS TMT TND TOP TRY TTD TWD TZS UAH UGX USD USN UYI UYU UYW UZS VED VES VND VUV WST XAF XAG XAU XBA XBB XBC XBD XCD XDR XOF XPD XPF XPT XSU XTS XUA XXX YER ZAR ZMW ZWL`.split(
    ' ',
  )

const overrides: Record<string, string> = {
  COP: 'Peso colombiano',
  USD: 'Dólar estadounidense',
  EUR: 'Euro',
  MXN: 'Peso mexicano',
  BRL: 'Real brasileño',
}
const displayNames =
  typeof Intl.DisplayNames === 'function'
    ? new Intl.DisplayNames(['es-CO'], { type: 'currency' })
    : null

export const currencies: readonly (readonly [string, string])[] = currencyCodes
  .map(
    (code) =>
      [code, overrides[code] ?? displayNames?.of(code) ?? code] as const,
  )
  .sort(([a], [b]) => a.localeCompare(b))

export const currencyLabel = (code: string) =>
  currencies.find(([value]) => value === code)?.[1] ?? code
