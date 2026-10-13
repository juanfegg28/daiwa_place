'use client'

import { useState, type ChangeEvent, type ReactNode } from 'react'
import { EyeIcon, EyeOffIcon, LockIcon } from '../icons'
import AuthField, { type FieldTone } from './AuthField'

/** Contraseña con candado que se ilumina y ojito para ver lo que escribes. */
export default function PasswordField({
  id = 'password',
  label = 'Contraseña',
  value,
  onChange,
  autoComplete,
  placeholder,
  required,
  hint,
  tone,
  autoFocus,
}: {
  id?: string
  label?: string
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  autoComplete?: string
  placeholder?: string
  required?: boolean
  hint?: ReactNode
  tone?: FieldTone
  autoFocus?: boolean
}) {
  const [show, setShow] = useState(false)
  return (
    <AuthField
      id={id}
      label={label}
      icon={<LockIcon className="h-[18px] w-[18px]" />}
      type={show ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      autoComplete={autoComplete}
      placeholder={placeholder}
      required={required}
      hint={hint}
      tone={tone}
      autoFocus={autoFocus}
      right={
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition hover:text-neutral-200 active:scale-95"
        >
          {show ? <EyeOffIcon className="h-[18px] w-[18px]" /> : <EyeIcon className="h-[18px] w-[18px]" />}
        </button>
      }
    />
  )
}
