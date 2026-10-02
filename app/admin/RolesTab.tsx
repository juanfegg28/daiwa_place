'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAppSession } from '../components/AppShell'
import ConfirmDialog from '../components/ConfirmDialog'
import { PERMISSION_KEYS, PERMISSION_INFO, levelLabel, hasAny } from '../lib/permissions'
import { TrashIcon, EditIcon, SearchIcon } from '../components/icons'
import type { RoleRow, UserSearchResult } from './types'

const EMPTY_PERMS: Record<string, boolean> = Object.fromEntries(PERMISSION_KEYS.map((k) => [k, false]))
const LEVELS = [1, 2, 3] as const

export default function RolesTab() {
  const { isSupreme, permissions, userId } = useAppSession()
  const canAssign = isSupreme || hasAny(permissions, ['assign_badges'])

  const [roles, setRoles] = useState<RoleRow[]>([])
  const [loading, setLoading] = useState(true)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState('#c81b3e')
  const [perms, setPerms] = useState<Record<string, boolean>>({ ...EMPTY_PERMS })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [confirmDeleteRole, setConfirmDeleteRole] = useState<RoleRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserSearchResult[]>([])
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null)
  const [selectedUserRoles, setSelectedUserRoles] = useState<string[]>([])
  const [assigning, setAssigning] = useState<string | null>(null)

  const loadRoles = async () => {
    const { data } = await supabase
      .from('roles')
      .select('id, name, badge_color, permissions')
      .order('created_at', { ascending: true })
    setRoles((data as RoleRow[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    function run() {
      loadRoles()
    }
    run()
  }, [])

  const resetForm = () => {
    setEditingId(null)
    setName('')
    setColor('#c81b3e')
    setPerms({ ...EMPTY_PERMS })
    setFormError('')
  }

  const startEdit = (r: RoleRow) => {
    setEditingId(r.id)
    setName(r.name)
    setColor(r.badge_color)
    setPerms({ ...EMPTY_PERMS, ...r.permissions })
    setFormError('')
  }

  const saveRole = async () => {
    if (!name.trim()) {
      setFormError('Ponle un nombre al rol')
      return
    }
    setSaving(true)
    setFormError('')
    if (editingId) {
      const { error } = await supabase
        .from('roles')
        .update({ name: name.trim(), badge_color: color, permissions: perms })
        .eq('id', editingId)
      if (error) {
        setFormError(error.message)
        setSaving(false)
        return
      }
    } else {
      const { error } = await supabase
        .from('roles')
        .insert({ name: name.trim(), badge_color: color, permissions: perms, created_by: userId })
      if (error) {
        setFormError(error.message)
        setSaving(false)
        return
      }
    }
    setSaving(false)
    resetForm()
    loadRoles()
  }

  const deleteRole = async () => {
    if (!confirmDeleteRole) return
    setDeleting(true)
    await supabase.from('roles').delete().eq('id', confirmDeleteRole.id)
    setDeleting(false)
    if (editingId === confirmDeleteRole.id) resetForm()
    setConfirmDeleteRole(null)
    loadRoles()
  }

  useEffect(() => {
    const q = query.trim()
    if (!q) {
      function clear() {
        setResults([])
      }
      clear()
      return
    }
    const timer = window.setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, id_student')
        .or(`id_student.ilike.%${q}%,username.ilike.%${q}%`)
        .limit(8)
      setResults((data as UserSearchResult[]) ?? [])
    }, 300)
    return () => window.clearTimeout(timer)
  }, [query])

  const pickUser = async (u: UserSearchResult) => {
    setSelectedUser(u)
    setQuery('')
    setResults([])
    const { data } = await supabase.from('user_roles').select('role_id').eq('user_id', u.id)
    setSelectedUserRoles(((data as { role_id: string }[]) ?? []).map((r) => r.role_id))
  }

  const toggleUserRole = async (roleId: string) => {
    if (!selectedUser) return
    setAssigning(roleId)
    const has = selectedUserRoles.includes(roleId)
    if (has) {
      await supabase.from('user_roles').delete().eq('user_id', selectedUser.id).eq('role_id', roleId)
      setSelectedUserRoles((prev) => prev.filter((r) => r !== roleId))
    } else {
      await supabase.from('user_roles').insert({ user_id: selectedUser.id, role_id: roleId, assigned_by: userId })
      setSelectedUserRoles((prev) => [...prev, roleId])
    }
    setAssigning(null)
  }

  return (
    <div className="space-y-6">
      {canAssign && (
        <section className="surface-card rounded-2xl p-5">
          <h2 className="text-base font-semibold text-neutral-50 mb-1">Asignar roles</h2>
          <p className="text-sm text-neutral-500 mb-4">Busca a un estudiante y marca los roles que quieras darle.</p>

          <div className="relative mb-3 max-w-sm">
            <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Busca por nombre o @usuario..."
              className="w-full bg-ink-900 border border-ink-700 rounded-full pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-garnet-600"
            />
            {results.length > 0 && (
              <div className="absolute z-10 mt-1 w-full surface-raised rounded-xl overflow-hidden border border-ink-600">
                {results.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => pickUser(u)}
                    className="w-full text-left px-3 py-2 text-sm text-neutral-200 hover:bg-ink-700 transition"
                  >
                    {u.id_student || u.username} <span className="text-neutral-500">@{u.username}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedUser && (
            <div className="border border-ink-700 rounded-xl p-3">
              <p className="text-sm font-medium text-neutral-100 mb-2">
                {selectedUser.id_student || selectedUser.username}{' '}
                <span className="text-neutral-500 font-normal">@{selectedUser.username}</span>
              </p>
              {roles.length === 0 ? (
                <p className="text-xs text-neutral-500">Todavía no se ha creado ningún rol.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {roles.map((r) => {
                    const active = selectedUserRoles.includes(r.id)
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => toggleUserRole(r.id)}
                        disabled={assigning === r.id}
                        className="flex items-center gap-1.5 text-xs rounded-full px-3 py-1.5 border transition disabled:opacity-60"
                        style={
                          active
                            ? { backgroundColor: r.badge_color, borderColor: r.badge_color, color: 'white' }
                            : { borderColor: '#333339' }
                        }
                      >
                        {r.name}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {isSupreme && (
        <section className="surface-card rounded-2xl p-5">
          <h2 className="text-base font-semibold text-neutral-50 mb-1">Taller de Roles</h2>
          <p className="text-sm text-neutral-500 mb-4">
            Crea un rol, ponle nombre, color de insignia y marca los permisos que va a tener.
          </p>

          <div className="space-y-4 mb-5 max-w-md">
            <div className="flex gap-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del rol (ej. Moderador)"
                className="flex-1 bg-ink-900 border border-ink-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-garnet-600"
              />
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                aria-label="Color de la insignia del rol"
                className="w-10 h-10 rounded-lg border border-ink-700 bg-transparent cursor-pointer shrink-0"
              />
            </div>

            {LEVELS.map((level) => (
              <div key={level}>
                <p className="text-xs font-medium text-neutral-400 mb-1.5">{levelLabel(level)}</p>
                <div className="space-y-1.5">
                  {PERMISSION_KEYS.filter((k) => PERMISSION_INFO[k].level === level).map((k) => (
                    <label key={k} className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!perms[k]}
                        onChange={(e) => setPerms((p) => ({ ...p, [k]: e.target.checked }))}
                        className="mt-0.5 accent-garnet-500"
                      />
                      <span>
                        <span className="block text-sm text-neutral-200">{PERMISSION_INFO[k].label}</span>
                        <span className="block text-xs text-neutral-500">{PERMISSION_INFO[k].description}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            {formError && <p className="text-sm text-garnet-400">{formError}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={saveRole}
                disabled={saving}
                className="bg-garnet-600 hover:bg-garnet-500 disabled:opacity-60 text-white text-sm font-medium rounded-full px-5 py-2 transition"
              >
                {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear rol'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-sm border border-ink-600 text-neutral-300 rounded-full px-5 py-2 hover:bg-ink-800 transition"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <p className="text-neutral-500 text-sm">Cargando roles...</p>
          ) : roles.length === 0 ? (
            <p className="text-neutral-500 text-sm">Todavía no has creado ningún rol.</p>
          ) : (
            <div className="space-y-1.5 pt-3 border-t border-ink-800">
              {roles.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 py-1.5">
                  <span className="inline-flex items-center gap-2 text-sm text-neutral-200">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: r.badge_color }} />
                    {r.name}
                  </span>
                  <span className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEdit(r)}
                      className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-100 hover:bg-ink-700 transition"
                      aria-label="Editar rol"
                    >
                      <EditIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteRole(r)}
                      className="p-1.5 rounded-full text-neutral-400 hover:text-garnet-400 hover:bg-ink-700 transition"
                      aria-label="Eliminar rol"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <ConfirmDialog
        open={!!confirmDeleteRole}
        title={`¿Eliminar el rol "${confirmDeleteRole?.name ?? ''}"?`}
        message="Se le quita este rol a todos los que lo tengan asignado. No se puede deshacer."
        busy={deleting}
        onConfirm={deleteRole}
        onCancel={() => setConfirmDeleteRole(null)}
      />
    </div>
  )
}
