import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Pencil, RefreshCw, Repeat2, Sparkles, X } from 'lucide-react'
import { Button, Dialog, Input, Textarea } from '@/components/ui'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useAccounts } from '@/features/accounts/hooks/accounts.hooks'
import { useCategories } from '@/features/categories/hooks/categories.hooks'
import { usePermission } from '@/features/workspace'
import { recurringDetectionApi } from './recurring-detection.api'
import type {
  ConfirmRecurringSuggestionInput,
  RecurringDetectionCandidate,
  RecurringDetectionFrequency,
  RecurringSuggestion,
} from './recurring-detection.api'
import styles from './recurring-suggestions.module.css'

const frequencyLabels: Record<RecurringDetectionFrequency, string> = {
  WEEKLY: 'Semanal',
  BIWEEKLY: 'Quincenal',
  MONTHLY: 'Mensual',
  BIMONTHLY: 'Bimestral',
  QUARTERLY: 'Trimestral',
  YEARLY: 'Anual',
}

const money = (value: number, currency: string) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value)

const dateLabel = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Sin fecha estimada'
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

const dateOnly = (value: string) => value.slice(0, 10)

const confidenceLabel = (value: number) => {
  const percent = Math.round(value * 100)
  if (percent >= 90) return `${percent}% · muy alta`
  if (percent >= 75) return `${percent}% · alta`
  return `${percent}% · suficiente`
}

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'No fue posible completar la operación.'

interface EditState {
  suggestion: RecurringSuggestion
  name: string
  description: string
  expectedAmount: string
  amountType: 'FIXED' | 'VARIABLE'
  frequency: RecurringDetectionFrequency
  startsOn: string
  paymentAccountId: string
  categoryId: string
  remindersEnabled: boolean
}

const editStateFrom = (suggestion: RecurringSuggestion): EditState => ({
  suggestion,
  name: suggestion.candidate.displayLabel,
  description: `Detectado automáticamente a partir de ${suggestion.candidate.evidenceCount} movimientos similares.`,
  expectedAmount: suggestion.candidate.typicalAmount.toFixed(2),
  amountType: suggestion.candidate.amountType,
  frequency: suggestion.candidate.frequency,
  startsOn: dateOnly(suggestion.candidate.nextExpectedAt),
  paymentAccountId: suggestion.candidate.accountId ?? '',
  categoryId: suggestion.candidate.categoryId ?? '',
  remindersEnabled: true,
})

function Evidence({ candidate, currency }: { candidate: RecurringDetectionCandidate; currency: string }) {
  return (
    <div className={styles.evidence}>
      <span><strong>{candidate.evidenceCount}</strong> movimientos similares</span>
      <span><strong>{frequencyLabels[candidate.frequency]}</strong> aproximadamente</span>
      <span><strong>{confidenceLabel(candidate.confidence)}</strong> de confianza</span>
      <span>
        Próximo estimado: <strong>{dateLabel(candidate.nextExpectedAt)}</strong>
      </span>
      {candidate.amountType === 'VARIABLE' ? (
        <span>
          Rango observado: <strong>{money(candidate.minAmount, currency)} – {money(candidate.maxAmount, currency)}</strong>
        </span>
      ) : null}
    </div>
  )
}

export function RecurringSuggestionsPanel({
  workspaceId,
  currency,
}: {
  workspaceId: string
  currency: string
}) {
  const canWrite = usePermission('debts.write')
  const queryClient = useQueryClient()
  const [months, setMonths] = useState(12)
  const [editing, setEditing] = useState<EditState | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const accounts = useAccounts(workspaceId, Boolean(editing), false, 'all', false)
  const categories = useCategories(workspaceId, Boolean(editing))
  const suggestions = useQuery({
    queryKey: ['liabilities', workspaceId, 'recurring-detection', months],
    queryFn: async ({ signal }) =>
      (await recurringDetectionApi.suggestions(workspaceId, months, signal)).data,
    enabled: Boolean(workspaceId),
    staleTime: 60_000,
  })

  const refreshAfterMutation = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ['liabilities', workspaceId, 'recurring-detection'],
      }),
      queryClient.invalidateQueries({
        queryKey: ['liabilities', workspaceId, 'obligations'],
      }),
      queryClient.invalidateQueries({ queryKey: ['liabilities', workspaceId, 'summary'] }),
      queryClient.invalidateQueries({ queryKey: ['liabilities', workspaceId, 'upcoming'] }),
    ])
  }

  const dismiss = useMutation({
    mutationFn: (id: string) => recurringDetectionApi.dismiss(workspaceId, id),
    onSuccess: refreshAfterMutation,
  })
  const confirm = useMutation({
    mutationFn: ({ id, input }: { id: string; input: ConfirmRecurringSuggestionInput }) =>
      recurringDetectionApi.confirm(workspaceId, id, input),
    onSuccess: async () => {
      setEditing(null)
      setConfirmingId(null)
      await refreshAfterMutation()
    },
  })
  const run = useMutation({
    mutationFn: () => recurringDetectionApi.run(workspaceId, months),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['liabilities', workspaceId, 'recurring-detection'],
      })
    },
  })

  const expenseCategories = useMemo(
    () => categories.data?.filter((category) => category.type === 'EXPENSE') ?? [],
    [categories.data],
  )

  const confirmDirect = (suggestion: RecurringSuggestion) => {
    setConfirmingId(suggestion.id)
    confirm.mutate({ id: suggestion.id, input: { months } })
  }

  const submitEdited = () => {
    if (!editing) return
    confirm.mutate({
      id: editing.suggestion.id,
      input: {
        months,
        name: editing.name.trim(),
        description: editing.description.trim() || null,
        expectedAmount: editing.expectedAmount,
        amountType: editing.amountType,
        frequency: editing.frequency,
        startsOn: editing.startsOn,
        paymentAccountId: editing.paymentAccountId || null,
        categoryId: editing.categoryId || null,
        remindersEnabled: editing.remindersEnabled,
      },
    })
  }

  if (suggestions.isError) {
    return (
      <section className={styles.panel} aria-label="Sugerencias de pagos recurrentes">
        <ErrorState
          title="No pudimos revisar tus pagos recurrentes"
          message={errorMessage(suggestions.error)}
          onRetry={() => void suggestions.refetch()}
        />
      </section>
    )
  }

  const items = suggestions.data?.suggestions ?? []

  return (
    <section className={styles.panel} aria-label="Sugerencias de pagos recurrentes">
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <span className={styles.icon}><Sparkles size={18} aria-hidden="true" /></span>
          <div>
            <h2>Pagos que Fynar reconoció</h2>
            <p>
              Revisamos tus movimientos y solo sugerimos patrones con evidencia suficiente. Nada se crea sin tu confirmación.
            </p>
          </div>
        </div>
        <div className={styles.actions}>
          <label>
            <span>Historial</span>
            <select value={months} onChange={(event) => setMonths(Number(event.target.value))}>
              <option value={6}>6 meses</option>
              <option value={12}>12 meses</option>
              <option value={18}>18 meses</option>
              <option value={24}>24 meses</option>
            </select>
          </label>
          <Button
            variant="secondary"
            onClick={() => run.mutate()}
            disabled={run.isPending || suggestions.isPending}
          >
            <RefreshCw size={16} aria-hidden="true" />
            {run.isPending ? 'Analizando…' : 'Analizar ahora'}
          </Button>
        </div>
      </div>

      {suggestions.isPending ? (
        <div className={styles.loading}>Analizando movimientos recientes…</div>
      ) : items.length === 0 ? (
        <div className={styles.empty}>
          <Repeat2 size={22} aria-hidden="true" />
          <div>
            <strong>No hay nuevos patrones por revisar.</strong>
            <span>Cuando detectemos uno confiable aparecerá aquí antes de convertirse en pago recurrente.</span>
          </div>
        </div>
      ) : (
        <div className={styles.list}>
          {items.map((suggestion) => {
            const candidate = suggestion.candidate
            return (
              <article key={suggestion.id} className={styles.card}>
                <div className={styles.cardMain}>
                  <div className={styles.cardTitle}>
                    <span className={styles.repeatIcon}><Repeat2 size={18} aria-hidden="true" /></span>
                    <div>
                      <h3>{candidate.displayLabel}</h3>
                      <p>
                        {candidate.amountType === 'VARIABLE' ? 'Monto variable típico' : 'Monto habitual'}:{' '}
                        <strong>{money(candidate.typicalAmount, currency)}</strong>
                      </p>
                    </div>
                  </div>
                  <Evidence candidate={candidate} currency={currency} />
                </div>
                {canWrite ? (
                  <div className={styles.cardActions}>
                    <Button
                      variant="secondary"
                      onClick={() => dismiss.mutate(suggestion.id)}
                      disabled={dismiss.isPending || confirm.isPending}
                    >
                      <X size={15} aria-hidden="true" /> Descartar
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setEditing(editStateFrom(suggestion))}
                      disabled={dismiss.isPending || confirm.isPending}
                    >
                      <Pencil size={15} aria-hidden="true" /> Revisar
                    </Button>
                    <Button
                      onClick={() => confirmDirect(suggestion)}
                      disabled={dismiss.isPending || confirm.isPending}
                    >
                      <Check size={15} aria-hidden="true" />
                      {confirm.isPending && confirmingId === suggestion.id ? 'Confirmando…' : 'Confirmar'}
                    </Button>
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>
      )}

      {(dismiss.error || confirm.error || run.error) ? (
        <p className={styles.error} role="alert">
          {errorMessage(dismiss.error ?? confirm.error ?? run.error)}
        </p>
      ) : null}

      <Dialog
        open={Boolean(editing)}
        title="Revisar pago recurrente detectado"
        size="wide"
        onClose={() => !confirm.isPending && setEditing(null)}
      >
        {editing ? (
          <div className={styles.form}>
            <div className={styles.formIntro}>
              <strong>La detección es una sugerencia.</strong>
              <span>Puedes corregir los datos antes de crear la obligación.</span>
            </div>
            <label>
              <span>Nombre</span>
              <Input
                value={editing.name}
                onChange={(event) => setEditing({ ...editing, name: event.target.value })}
              />
            </label>
            <label>
              <span>Descripción</span>
              <Textarea
                value={editing.description}
                onChange={(event) => setEditing({ ...editing, description: event.target.value })}
                rows={3}
              />
            </label>
            <div className={styles.formGrid}>
              <label>
                <span>Monto esperado</span>
                <Input
                  inputMode="decimal"
                  value={editing.expectedAmount}
                  onChange={(event) => setEditing({ ...editing, expectedAmount: event.target.value })}
                />
              </label>
              <label>
                <span>Tipo de monto</span>
                <select
                  value={editing.amountType}
                  onChange={(event) => setEditing({ ...editing, amountType: event.target.value as EditState['amountType'] })}
                >
                  <option value="FIXED">Fijo</option>
                  <option value="VARIABLE">Variable</option>
                </select>
              </label>
              <label>
                <span>Frecuencia</span>
                <select
                  value={editing.frequency}
                  onChange={(event) => setEditing({ ...editing, frequency: event.target.value as RecurringDetectionFrequency })}
                >
                  {Object.entries(frequencyLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Próxima fecha</span>
                <Input
                  type="date"
                  value={editing.startsOn}
                  onChange={(event) => setEditing({ ...editing, startsOn: event.target.value })}
                />
              </label>
              <label>
                <span>Cuenta pagadora</span>
                <select
                  value={editing.paymentAccountId}
                  onChange={(event) => setEditing({ ...editing, paymentAccountId: event.target.value })}
                >
                  <option value="">Sin cuenta definida</option>
                  {accounts.data?.filter((account) => account.isActive).map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} · {account.currency}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Categoría</span>
                <select
                  value={editing.categoryId}
                  onChange={(event) => setEditing({ ...editing, categoryId: event.target.value })}
                >
                  <option value="">Sin categoría definida</option>
                  {expenseCategories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className={styles.checkLabel}>
              <input
                type="checkbox"
                checked={editing.remindersEnabled}
                onChange={(event) => setEditing({ ...editing, remindersEnabled: event.target.checked })}
              />
              <span>Activar recordatorios para este pago</span>
            </label>
            <Evidence candidate={editing.suggestion.candidate} currency={currency} />
            {confirm.error ? <p className={styles.error}>{errorMessage(confirm.error)}</p> : null}
            <div className={styles.dialogActions}>
              <Button variant="secondary" onClick={() => setEditing(null)} disabled={confirm.isPending}>
                Cancelar
              </Button>
              <Button
                onClick={submitEdited}
                disabled={
                  confirm.isPending ||
                  !editing.name.trim() ||
                  !/^\d{1,16}(?:\.\d{1,2})?$/.test(editing.expectedAmount) ||
                  !editing.startsOn
                }
              >
                <Check size={15} aria-hidden="true" />
                {confirm.isPending ? 'Creando…' : 'Confirmar y crear'}
              </Button>
            </div>
          </div>
        ) : null}
      </Dialog>
    </section>
  )
}
