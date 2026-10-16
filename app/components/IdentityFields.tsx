'use client'

import { IDENTITIES, identityField } from '../lib/identities'

/** Selector de Identidad + el campo especial que desbloquea (Registro y Editar Perfil) */
export default function IdentityFields({
  identity,
  detail,
  onIdentityChange,
  onDetailChange,
  inputClass,
  labelClass,
}: {
  identity: string
  detail: string
  onIdentityChange: (v: string) => void
  onDetailChange: (v: string) => void
  inputClass: string
  labelClass: string
}) {
  const field = identityField(identity)
  return (
    <>
      <div>
        <label className={labelClass} htmlFor="identity">Identidad (opcional)</label>
        <select
          id="identity"
          value={identity}
          onChange={(e) => {
            onIdentityChange(e.target.value)
            onDetailChange('')
          }}
          className={inputClass}
        >
          <option value="">Sin especificar</option>
          {IDENTITIES.map((i) => (
            <option key={i} value={i}>{i}</option>
          ))}
        </select>
      </div>
      {field && (
        <div>
          <label className={labelClass} htmlFor="identity-detail">{field.label} (opcional)</label>
          {field.type === 'select' ? (
            <select id="identity-detail" value={detail} onChange={(e) => onDetailChange(e.target.value)} className={inputClass}>
              <option value="">Sin especificar</option>
              {field.options?.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          ) : (
            <input
              id="identity-detail"
              type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
              inputMode={field.type === 'number' ? 'numeric' : undefined}
              value={detail}
              onChange={(e) => onDetailChange(field.max ? e.target.value.slice(0, field.max) : e.target.value)}
              placeholder={field.placeholder}
              className={inputClass}
            />
          )}
        </div>
      )}
    </>
  )
}
