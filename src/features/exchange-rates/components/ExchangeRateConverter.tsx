import { useMemo, useState, type FormEvent } from 'react'
import { ArrowDownUp, Clock3, RefreshCw } from 'lucide-react'
import { Button, MoneyInput, Select } from '@/components/ui'
import {
  useConvertCurrency,
  useExchangeCurrencies,
} from '../hooks/exchange-rates.hooks'
import type { ExchangeCurrency } from '../types/exchange-rates.types'
import styles from './exchange-rates.module.css'

const money = (value: string, currency: string, minorUnits = 2) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: minorUnits,
    maximumFractionDigits: minorUnits,
  }).format(Number(value))

const rateNumber = (value: string) =>
  new Intl.NumberFormat('es-CO', {
    maximumSignificantDigits: 8,
  }).format(Number(value))

const optionLabel = (currency: ExchangeCurrency) =>
  `${currency.code} · ${currency.name}`

export function ExchangeRateConverter({
  defaultFrom = 'COP',
}: {
  defaultFrom?: string
}) {
  const currencies = useExchangeCurrencies()
  const convert = useConvertCurrency()
  const [amount, setAmount] = useState('')
  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(defaultFrom === 'USD' ? 'EUR' : 'USD')

  const currencyMap = useMemo(
    () =>
      new Map(
        (currencies.data?.currencies ?? []).map((currency) => [
          currency.code,
          currency,
        ]),
      ),
    [currencies.data?.currencies],
  )

  const available = currencies.data?.currencies ?? []
  const effectiveFrom = currencyMap.has(from)
    ? from
    : (currencies.data?.defaultBase ?? available[0]?.code ?? defaultFrom)
  const effectiveTo =
    currencyMap.has(to) && to !== effectiveFrom
      ? to
      : (available.find((currency) => currency.code !== effectiveFrom)?.code ??
        effectiveFrom)

  const swap = () => {
    setFrom(effectiveTo)
    setTo(effectiveFrom)
    convert.reset()
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!amount || Number(amount) < 0) return
    convert.mutate({ from: effectiveFrom, to: effectiveTo, amount })
  }

  const result = convert.data
  const targetCurrency = currencyMap.get(result?.to ?? effectiveTo)
  const inverseRate =
    result && Number(result.rate) > 0 ? 1 / Number(result.rate) : null

  return (
    <form className={styles.converter} onSubmit={submit}>
      <div className={styles.intro}>
        <span>Conversión de referencia</span>
        <p>
          Compara monedas con tasas oficiales agregadas por Frankfurter. Fynar
          calcula el resultado sin modificar tus saldos.
        </p>
      </div>

      <label className={styles.amountField}>
        <span>Monto</span>
        <MoneyInput
          value={amount}
          currency={effectiveFrom}
          placeholder="1.000.000"
          aria-label="Monto a convertir"
          onValueChange={(value) => {
            setAmount(value)
            convert.reset()
          }}
        />
      </label>

      <div className={styles.currencyRow}>
        <label>
          <span>De</span>
          <Select
            aria-label="Moneda de origen"
            value={effectiveFrom}
            disabled={currencies.isPending}
            onChange={(event) => {
              setFrom(event.target.value)
              convert.reset()
            }}
          >
            {(currencies.data?.currencies ?? []).map((currency) => (
              <option key={currency.code} value={currency.code}>
                {optionLabel(currency)}
              </option>
            ))}
          </Select>
        </label>

        <button
          className={styles.swap}
          type="button"
          aria-label="Intercambiar monedas"
          onClick={swap}
          disabled={currencies.isPending}
        >
          <ArrowDownUp size={19} aria-hidden="true" />
        </button>

        <label>
          <span>A</span>
          <Select
            aria-label="Moneda de destino"
            value={effectiveTo}
            disabled={currencies.isPending}
            onChange={(event) => {
              setTo(event.target.value)
              convert.reset()
            }}
          >
            {(currencies.data?.currencies ?? []).map((currency) => (
              <option key={currency.code} value={currency.code}>
                {optionLabel(currency)}
              </option>
            ))}
          </Select>
        </label>
      </div>

      {currencies.isError && (
        <p className={styles.error} role="alert">
          No pudimos cargar las monedas disponibles.
        </p>
      )}

      <Button
        variant="info"
        type="submit"
        size="large"
        loading={convert.isPending}
        disabled={
          currencies.isPending ||
          currencies.isError ||
          !amount ||
          Number(amount) < 0
        }
      >
        Convertir ahora
      </Button>

      {convert.isError && (
        <div className={styles.errorCard} role="alert">
          <strong>No pudimos convertir el monto</strong>
          <span>
            {convert.error instanceof Error
              ? convert.error.message
              : 'Intenta nuevamente en unos minutos.'}
          </span>
        </div>
      )}

      {result && (
        <section className={styles.result} aria-live="polite">
          <div className={styles.resultTop}>
            <span>Resultado aproximado</span>
            <small>
              {result.cacheStatus === 'STALE'
                ? 'Usando última tasa disponible'
                : 'Tasa disponible'}
            </small>
          </div>

          <strong className={styles.resultAmount}>
            {money(
              result.convertedAmount,
              result.to,
              targetCurrency?.minorUnits ?? 2,
            )}
          </strong>

          <div className={styles.rateDetails}>
            <span>
              1 {result.from} = {rateNumber(result.rate)} {result.to}
            </span>
            {inverseRate !== null && (
              <span>
                1 {result.to} ≈ {rateNumber(String(inverseRate))} {result.from}
              </span>
            )}
          </div>

          <div className={styles.meta}>
            <Clock3 size={15} aria-hidden="true" />
            <span>
              Referencia del {result.date} · proveedor {result.provider}
            </span>
          </div>

          <p className={styles.disclaimer}>{result.disclaimer}</p>
        </section>
      )}

      {!result && !convert.isPending && (
        <div className={styles.tip}>
          <RefreshCw size={17} aria-hidden="true" />
          <span>
            Las tasas se cachean para reducir llamadas externas y Fynar usa la
            última tasa válida si el proveedor presenta una caída temporal.
          </span>
        </div>
      )}
    </form>
  )
}
