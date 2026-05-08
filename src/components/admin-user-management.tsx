'use client'

import { useCallback, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface User {
  id: string
  email: string | undefined
  created_at: string
  last_sign_in_at: string | null
  banned_until: string | null
  email_confirmed_at: string | null
}

export function AdminUserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitePassword, setInvitePassword] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const perPage = 50

  const load = useCallback(async (p: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/users?page=${p}&per_page=${perPage}`)
      const json = await res.json() as { users?: User[]; total?: number; error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Failed to load')
      setUsers(json.users ?? [])
      setTotal(json.total ?? 0)
      setPage(p)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load(1) }, [load])

  const handleBan = async (userId: string, ban: boolean) => {
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ban_duration: ban ? '876000h' : 'none' }),
    })
    void load(page)
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Permanently delete this user?')) return
    await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
    void load(page)
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviting(true)
    setInviteError(null)
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, password: invitePassword }),
    })
    const json = await res.json() as { error?: string }
    if (!res.ok) { setInviteError(json.error ?? 'Failed to create user'); setInviting(false); return }
    setInviteOpen(false)
    setInviteEmail('')
    setInvitePassword('')
    setInviting(false)
    void load(1)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Users</CardTitle>
          <CardDescription>{total} total</CardDescription>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button size="sm">Add user</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create user</DialogTitle>
              <DialogDescription>Create a new user with email and password.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-3">
              {inviteError && <p className="text-sm text-destructive">{inviteError}</p>}
              <div className="space-y-1">
                <Label htmlFor="inv-email">Email</Label>
                <Input id="inv-email" type="email" required value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="inv-pw">Password</Label>
                <Input id="inv-pw" type="password" required value={invitePassword} onChange={(e) => setInvitePassword(e.target.value)} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={inviting}>{inviting ? 'Creating…' : 'Create user'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-destructive mb-3">{error}</p>}
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Email</th>
                  <th className="pb-2 pr-3 font-medium">Status</th>
                  <th className="pb-2 pr-3 font-medium">Joined</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((u) => {
                  const banned = u.banned_until && new Date(u.banned_until) > new Date()
                  return (
                    <tr key={u.id}>
                      <td className="py-2 pr-3 text-xs">{u.email ?? '—'}</td>
                      <td className="py-2 pr-3">
                        {banned ? (
                          <Badge variant="destructive">banned</Badge>
                        ) : u.email_confirmed_at ? (
                          <Badge variant="secondary">active</Badge>
                        ) : (
                          <Badge variant="outline">unverified</Badge>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-xs text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-2 flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => handleBan(u.id, !banned)}
                        >
                          {banned ? 'Unban' : 'Ban'}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => handleDelete(u.id)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-3 flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => void load(page - 1)}>Previous</Button>
          <Button variant="outline" size="sm" disabled={users.length < perPage} onClick={() => void load(page + 1)}>Next</Button>
        </div>
      </CardContent>
    </Card>
  )
}
