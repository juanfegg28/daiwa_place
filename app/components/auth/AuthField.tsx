'use client'

import type { ChangeEvent, ReactNode } from 'react'
import { CheckIcon } from '../icons'

export type FieldTone = 'neutral' | 'good' | 'warn'
export type FieldStatus = 'idle' | 'checking' | 'good'

const TONE_TEXT: Record<FieldTone, string> = {
  neutral: 'text-neutral-500',
  good: 'text-emerald-300',
  warn: 'text-amber-300',
}
const TONE_BORDER: Record<FieldTone, string> = {
  neutral: 'border-white/10',
  good: 'border-emerald-400/40',
  warn: 'border-amber-300/40',
}

/** Marco común de los campos: etiqueta, caja con ícono que se ilumina al escribir, y pista de abajo. */
export function FieldShell({
  id,
  label,
  icon,
  filled,
  tone = 'neutral',
  status = 'idle',
  hint,
  right,
  top = false,
  children,
}: {
  id: string
  label: string
  icon: ReactNode
  filled: boolean
  tone?: FieldTone
  status?: FieldStatus
  hint?: ReactNode
  right?: ReactNode
  /** El ícono va arriba (para cuadros de texto grandes) */
  top?: boolean
  children: ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-neutral-400">
        {label}
      </label>
      <div
        className={`group relative flex rounded-2xl border bg-ink-950/50 transition-all duration-200 ${TONE_BORDER[tone]} ${
          top ? 'items-start' : 'items-center'
        } focus-within:border-garnet-500/70 focus-within:bg-ink-950/70 focus-within:ring-4 focus-within:ring-garnet-500/10`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute left-4 flex h-5 w-5 items-center justify-center transition-colors duration-200 group-focus-within:text-garnet-400 ${
            top ? 'top-3.5' : ''
          } ${filled ? 'text-garnet-400' : 'text-neutral-500'}`}
        >
          {icon}
        </span>
        {children}
        {(right || status !== 'idle') && (
          <span className={`absolute right-3 flex items-center gap-1.5 ${top ? 'top-3' : ''}`}>
            {status === 'checking' && (
              <span
                role="status"
                aria-label="Comprobando"
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/15 border-t-garnet-400"
              />
            )}
            {status === 'good' && (
              <span aria-hidden="true" className="auth-pop flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                <CheckIcon className="h-3.5 w-3.5" />
              </span>
            )}
            {right}
          </span>
        )}
      </div>
      {hint && (
        <p
          id={`${id}-hint`}
          aria-live="polite"
          className={`mt-1.5 px-1 text-xs leading-relaxed transition-colors duration-200 ${TONE_TEXT[tone]}`}
        >
          {hint}
        </p>
      )}
    </div>
  )
}

const INPUT_CLASS =
  'w-full rounded-2xl bg-transparent py-3.5 pl-12 pr-12 text-[15px] text-neutral-50 placeholder:text-neutral-600 focus:outline-none disabled:opacity-60'

export default function AuthField({
  id,
  label,
  icon,
  value,
  onChange,
  type = 'text',
  placeholder,
  autoComplete,
  inputMode,
  maxLength,
  required,
  disabled,
  autoFocus,
  name,
  status,
  hint,
  tone,
  right,
}: {
  id: string
  label: string
  icon: ReactNode
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  type?: string
  placeholder?: string
  autoComplete?: string
  inputMode?: 'text' | 'numeric' | 'email' | 'search'
  maxLength?: number
  required?: boolean
  disabled?: boolean
  autoFocus?: boolean
  name?: string
  status?: FieldStatus
  hint?: ReactNode
  tone?: FieldTone
  right?: ReactNode
}) {
  return (
    <FieldShell id={id} label={label} icon={icon} filled={value.length > 0} tone={tone} status={status} hint={hint} right={right}>
      <input
        id={id}
        name={name ?? id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        required={required}
        disabled={disabled}
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={INPUT_CLASS}
      />
    </FieldShell>
  )
}

export function AuthTextarea({
  id,
  label,
  icon,
  value,
  onChange,
  placeholder,
  maxLength,
  rows = 3,
  hint,
}: {
  id: string
  label: string
  icon: ReactNode
  value: string
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  maxLength?: number
  rows?: number
  hint?: ReactNode
}) {
  return (
    <FieldShell id={id} label={label} icon={icon} filled={value.length > 0} hint={hint} top>
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        className={`${INPUT_CLASS} resize-none pt-3.5`}
      />
    </FieldShell>
  )
}

export function AuthSelect({
  id,
  label,
  icon,
  value,
  onChange,
  children,
}: {
  id: string
  label: string
  icon: ReactNode
  value: string
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void
  children: ReactNode
}) {
  return (
    <FieldShell id={id} label={label} icon={icon} filled={value.length > 0}>
      <select id={id} value={value} onChange={onChange} className={`${INPUT_CLASS} appearance-none`}>
        {children}
      </select>
    </FieldShell>
  )
}
