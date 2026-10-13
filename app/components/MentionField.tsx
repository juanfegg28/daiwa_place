'use client'

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type Ref,
} from 'react'
import { useAppSession } from './AppShell'
import AutoGrowTextarea from './AutoGrowTextarea'
import UserAvatar from './UserAvatar'
import { SearchIcon, UsersIcon } from './icons'
import { displayName, findMentionPeople, findMentionTrigger, type MentionPerson, type MentionResults } from '../lib/mentions'

export type MentionFieldHandle = {
  /** Escribe una @ en el cursor y abre la lista de personas (para el botón "Etiquetar") */
  openPicker: () => void
  focus: () => void
}

type Props = {
  value: string
  onValueChange: (next: string) => void
  /** true = caja de varias líneas que crece sola; false = una sola línea (comentarios y respuestas) */
  multiline?: boolean
  rows?: number
  maxLength?: number
  placeholder?: string
  autoFocus?: boolean
  disabled?: boolean
  className?: string
  wrapperClassName?: string
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => void
  ref?: Ref<MentionFieldHandle>
}

type FieldEl = HTMLTextAreaElement | HTMLInputElement
type Trigger = { start: number; query: string }

/**
 * Campo de texto con etiquetas: al escribir "@" se abre una lista con tus amigos (los que te siguen y sigues)
 * y, mientras sigues escribiendo, se convierte en un buscador de personas. Funciona con teclado
 * (↑ ↓ Enter Tab Esc) y con el dedo.
 */
export default function MentionField({
  value,
  onValueChange,
  multiline = false,
  rows = 3,
  maxLength,
  placeholder,
  autoFocus,
  disabled,
  className = '',
  wrapperClassName = '',
  onKeyDown,
  ref,
}: Props) {
  const { userId } = useAppSession()
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const pendingCaret = useRef<number | null>(null)
  const dismissedStart = useRef<number | null>(null)
  const triggerRef = useRef<Trigger | null>(null)

  const [trigger, setTrigger] = useState<Trigger | null>(null)
  const [results, setResults] = useState<MentionResults | null>(null)
  const [active, setActive] = useState(0)
  const [above, setAbove] = useState(false)

  const open = !!trigger && !!userId && !disabled
  const query = trigger?.query ?? ''

  const getEl = useCallback(
    () => wrapRef.current?.querySelector<FieldEl>('textarea, input') ?? null,
    []
  )

  const applyTrigger = useCallback((next: Trigger | null) => {
    const prev = triggerRef.current
    if (prev && next && prev.start === next.start && prev.query === next.query) return
    // al abrir la lista no se muestran los resultados de la vez anterior
    if (!prev && next) setResults(null)
    triggerRef.current = next
    setTrigger(next)
  }, [])

  const refreshTrigger = useCallback(
    (el: FieldEl | null) => {
      if (!el || el.selectionStart == null || el.selectionStart !== el.selectionEnd) {
        applyTrigger(null)
        return
      }
      const found = findMentionTrigger(el.value, el.selectionStart)
      if (!found || dismissedStart.current === found.start) {
        if (!found) dismissedStart.current = null
        applyTrigger(null)
        return
      }
      applyTrigger(found)
    },
    [applyTrigger]
  )

  // Busca a quién mostrar cada vez que cambia lo que se escribe después de la @
  useEffect(() => {
    if (!open || !userId) return
    let cancelled = false
    const timer = window.setTimeout(
      async () => {
        const found = await findMentionPeople(userId, query)
        if (cancelled) return
        setResults(found)
        setActive(0)
      },
      query ? 170 : 0
    )
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [open, query, userId])

  // La lista se abre hacia arriba si abajo no hay espacio (por ejemplo, con el teclado del celular abierto)
  useEffect(() => {
    if (!open) return
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect) return
    const vv = window.visualViewport
    const bottomEdge = vv ? vv.height + vv.offsetTop : window.innerHeight
    const spaceBelow = bottomEdge - rect.bottom
    const spaceAbove = rect.top - (vv?.offsetTop ?? 0)
    const next = spaceBelow < 270 && spaceAbove > spaceBelow
    setAbove((prev) => (prev === next ? prev : next))
  }, [open, trigger?.start])

  // Después de elegir a alguien (o de pulsar el botón @) se acomoda el cursor
  useLayoutEffect(() => {
    if (pendingCaret.current == null) return
    const el = getEl()
    const pos = pendingCaret.current
    pendingCaret.current = null
    if (!el) return
    el.focus()
    el.setSelectionRange(pos, pos)
    refreshTrigger(el)
  }, [value, getEl, refreshTrigger])

  const list: MentionPerson[] = useMemo(
    () => (results ? [...results.friends, ...results.others] : []),
    [results]
  )

  const choose = (p: MentionPerson) => {
    const el = getEl()
    if (!el || !trigger) return
    const caret = el.selectionStart ?? value.length
    const before = value.slice(0, trigger.start)
    let after = value.slice(caret)
    if (after.startsWith(' ')) after = after.slice(1) // evita dejar dos espacios seguidos
    const inserted = `@${p.username} `
    pendingCaret.current = before.length + inserted.length
    dismissedStart.current = null
    applyTrigger(null)
    onValueChange(before + inserted + after)
  }

  useImperativeHandle(
    ref,
    () => ({
      focus: () => getEl()?.focus(),
      openPicker: () => {
        const el = getEl()
        if (!el || disabled) return
        const pos = el.selectionStart ?? value.length
        const needsSpace = pos > 0 && !/\s/.test(value[pos - 1])
        const inserted = `${needsSpace ? ' ' : ''}@`
        pendingCaret.current = pos + inserted.length
        dismissedStart.current = null
        onValueChange(value.slice(0, pos) + inserted + value.slice(el.selectionEnd ?? pos))
      },
    }),
    [getEl, disabled, value, onValueChange]
  )

  const handleKeyDown = (e: KeyboardEvent<FieldEl>) => {
    if (open) {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        dismissedStart.current = trigger?.start ?? null
        applyTrigger(null)
        return
      }
      if (list.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setActive((i) => (i + 1) % list.length)
          return
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          setActive((i) => (i - 1 + list.length) % list.length)
          return
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault()
          choose(list[Math.min(active, list.length - 1)])
          return
        }
      }
    }
    onKeyDown?.(e)
  }

  const common = {
    value,
    placeholder,
    autoFocus,
    disabled,
    maxLength,
    onChange: (e: { target: FieldEl }) => {
      onValueChange(e.target.value)
      refreshTrigger(e.target)
    },
    onKeyDown: handleKeyDown,
    onSelect: (e: { currentTarget: FieldEl }) => refreshTrigger(e.currentTarget),
    // se cierra al salir del campo; el pequeño retraso evita que se cierre justo cuando tocas a una persona de la lista
    onBlur: () =>
      window.setTimeout(() => {
        if (document.activeElement !== getEl()) applyTrigger(null)
      }, 120),
  }

  const loading = results === null
  const hasFriends = (results?.friends.length ?? 0) > 0
  const hasOthers = (results?.others.length ?? 0) > 0

  const row = (p: MentionPerson, index: number) => (
    <button
      key={p.id}
      type="button"
      role="option"
      aria-selected={index === active}
      // mousedown (y no click) para que el campo no pierda el foco al elegir
      onMouseDown={(e) => {
        e.preventDefault()
        choose(p)
      }}
      onMouseEnter={() => setActive(index)}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
        index === active ? 'bg-garnet-600/15' : 'hover:bg-ink-600/60'
      }`}
    >
      <UserAvatar username={p.username} avatarUrl={p.avatar_url} size="w-8 h-8" textSize="text-xs" />
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block text-sm font-medium text-neutral-100 truncate">{displayName(p)}</span>
        <span className="block text-[11px] text-neutral-500 truncate">@{p.username}</span>
      </span>
    </button>
  )

  const friendCount = results?.friends.length ?? 0

  return (
    <div ref={wrapRef} className={`relative ${wrapperClassName}`}>
      {multiline ? (
        <AutoGrowTextarea {...common} rows={rows} className={className} />
      ) : (
        <input type="text" {...common} className={className} autoComplete="off" />
      )}

      {open && (
        <div
          role="listbox"
          aria-label="Personas a etiquetar"
          className={`mention-pop absolute left-0 right-0 z-40 min-w-[16.5rem] max-w-[calc(100vw-2rem)] surface-raised border border-ink-600 rounded-2xl overflow-hidden shadow-2xl ${
            above ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          {/* Barra de búsqueda: lo que escribes después de la @ */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-ink-600 bg-ink-800/60">
            <SearchIcon className="w-4 h-4 text-neutral-500 shrink-0" />
            <p className="text-xs min-w-0 truncate">
              {query ? (
                <>
                  <span className="text-garnet-400 font-semibold">@{query}</span>
                </>
              ) : (
                <span className="text-neutral-400">Etiqueta a alguien… escribe para buscar</span>
              )}
            </p>
            <span className="ml-auto hidden md:block text-[10px] text-neutral-600 border border-ink-600 rounded px-1.5 py-0.5">
              Esc
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto overscroll-contain py-1">
            {loading ? (
              <div className="px-3 py-2 space-y-3" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-2.5 animate-pulse">
                    <span className="w-8 h-8 rounded-full bg-ink-600" />
                    <span className="flex-1 space-y-1.5">
                      <span className="block h-2.5 w-24 rounded bg-ink-600" />
                      <span className="block h-2 w-16 rounded bg-ink-700" />
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {hasFriends && (
                  <>
                    <p className="flex items-center gap-1.5 px-3 pt-1.5 pb-1 text-[10px] uppercase tracking-wide text-neutral-500">
                      <UsersIcon className="w-3 h-3 text-garnet-400" />
                      Tus amigos
                    </p>
                    {results!.friends.map((p, i) => row(p, i))}
                  </>
                )}
                {hasOthers && (
                  <>
                    <p className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wide text-neutral-500">Más personas</p>
                    {results!.others.map((p, i) => row(p, friendCount + i))}
                  </>
                )}
                {!hasFriends && !hasOthers && (
                  <p className="px-3 py-4 text-xs text-neutral-500 text-center leading-relaxed">
                    {query
                      ? query.length < 2
                        ? 'Sigue escribiendo para buscar a más personas.'
                        : `No encontramos a nadie con «${query}».`
                      : 'Todavía no tienes amigos mutuos. Escribe un nombre para buscar a alguien.'}
                  </p>
                )}
              </>
            )}
          </div>

          <p className="hidden md:block px-3 py-1.5 border-t border-ink-600 text-[10px] text-neutral-600">
            ↑ ↓ para moverte · Enter para etiquetar
          </p>
        </div>
      )}
    </div>
  )
}
