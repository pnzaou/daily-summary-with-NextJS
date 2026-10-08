"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import UserFormDialog from "./user-form-dialog"
import ResetPasswordDialog from "./reset-password-dialog"
import { ROLE_LABELS } from "@/lib/roles"

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleString("fr-FR", {
        day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
      })
    : "Jamais"

export default function UsersManager({ currentUserId }) {
  // reloadKey force un rechargement après une action ; la liste est en chargement
  // tant que la dernière réponse reçue ne correspond pas à la demande en cours
  const [reloadKey, setReloadKey] = useState(0)
  const [result, setResult] = useState({ key: null, users: [], assignableRoles: [], businesses: [] })
  const loading = result.key !== reloadKey
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("tous")
  const [statusFilter, setStatusFilter] = useState("tous")
  const [dialog, setDialog] = useState(null) // { type: "create" | "edit" | "password" | "toggle", user }
  const [toggling, setToggling] = useState(false)

  const reload = () => setReloadKey((k) => k + 1)
  const closeDialog = () => setDialog(null)
  const afterSave = () => {
    setDialog(null)
    reload()
  }

  useEffect(() => {
    let ignore = false
    Promise.all([axios.get("/api/users"), axios.get("/api/business")])
      .then(([users, businesses]) => {
        if (ignore) return
        setResult({
          key: reloadKey,
          users: users.data.data.users,
          assignableRoles: users.data.data.assignableRoles,
          businesses: businesses.data.data,
        })
      })
      .catch((error) => {
        console.error(error)
        if (ignore) return
        toast.error(error.response?.data?.message || "Impossible de charger les utilisateurs.")
        setResult((prev) => ({ ...prev, key: reloadKey }))
      })
    return () => { ignore = true }
  }, [reloadKey])

  const term = search.trim().toLowerCase()
  const users = result.users.filter((u) =>
    (roleFilter === "tous" || u.role === roleFilter)
    && (statusFilter === "tous" || (statusFilter === "actifs" ? u.actif : !u.actif))
    && (!term || `${u.prenom} ${u.nom} ${u.email}`.toLowerCase().includes(term)))

  const confirmToggle = async () => {
    const { user } = dialog
    setToggling(true)
    try {
      await axios.patch(`/api/users/${user._id}`, { actif: !user.actif })
      toast.success(user.actif ? "Compte désactivé." : "Compte réactivé.")
      afterSave()
    } catch (error) {
      toast.error(error.response?.data?.message || "Erreur lors de la mise à jour.")
    } finally {
      setToggling(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col">
          <label htmlFor="search" className="mb-1 text-sm font-medium">Rechercher</label>
          <Input id="search" className="w-64" placeholder="Nom, prénom ou email"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-col">
          <label htmlFor="roleFilter" className="mb-1 text-sm font-medium">Rôle</label>
          <select id="roleFilter" className="h-9 rounded-md border px-3"
            value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="tous">Tous</option>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label htmlFor="statusFilter" className="mb-1 text-sm font-medium">Statut</label>
          <select id="statusFilter" className="h-9 rounded-md border px-3"
            value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="tous">Tous</option>
            <option value="actifs">Actifs</option>
            <option value="desactives">Désactivés</option>
          </select>
        </div>
        {result.assignableRoles.length > 0 && (
          <Button className="ml-auto" onClick={() => setDialog({ type: "create" })}>
            Nouveau compte
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Nom", "Email", "Rôle", "Activités", "Statut", "Dernière connexion", "Actions"].map((h) => (
                <th key={h} className="px-4 py-2 text-left font-medium text-gray-700">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading && result.users.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-500">Chargement…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-500">Aucun compte.</td></tr>
            ) : (
              users.map((u) => {
                const isSelf = u._id === currentUserId
                return (
                  <tr key={u._id} className={u.actif ? "" : "bg-gray-50 text-gray-500"}>
                    <td className="px-4 py-2">{u.prenom} {u.nom}{isSelf && " (vous)"}</td>
                    <td className="px-4 py-2">{u.email}</td>
                    <td className="px-4 py-2">{ROLE_LABELS[u.role] ?? u.role}</td>
                    <td className="px-4 py-2">{u.businesses.map((b) => b.name).join(", ") || "—"}</td>
                    <td className="px-4 py-2">
                      {u.actif
                        ? <span className="text-green-700">Actif</span>
                        : <span className="text-red-600">Désactivé</span>}
                      {u.mustChangePassword && (
                        <span className="block text-xs text-amber-700">Mot de passe provisoire</span>
                      )}
                    </td>
                    <td className="px-4 py-2">{formatDate(u.lastLoginAt)}</td>
                    <td className="px-4 py-2">
                      {u.modifiable ? (
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => setDialog({ type: "edit", user: u })}>
                            Modifier
                          </Button>
                          {!isSelf && (
                            <Button size="sm" variant="outline" onClick={() => setDialog({ type: "password", user: u })}>
                              Mot de passe
                            </Button>
                          )}
                          {!isSelf && (
                            <Button size="sm" variant={u.actif ? "destructive" : "outline"}
                              onClick={() => setDialog({ type: "toggle", user: u })}>
                              {u.actif ? "Désactiver" : "Réactiver"}
                            </Button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Lecture seule</span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {(dialog?.type === "create" || dialog?.type === "edit") && (
        <UserFormDialog
          user={dialog.user}
          assignableRoles={result.assignableRoles}
          businesses={result.businesses}
          isSelf={dialog.user?._id === currentUserId}
          onClose={closeDialog}
          onSaved={afterSave}
        />
      )}

      {dialog?.type === "password" && (
        <ResetPasswordDialog user={dialog.user} onClose={closeDialog} onSaved={afterSave} />
      )}

      {dialog?.type === "toggle" && (
        <Dialog open onOpenChange={(open) => !open && closeDialog()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {dialog.user.actif ? "Désactiver" : "Réactiver"} le compte de {dialog.user.prenom} {dialog.user.nom} ?
              </DialogTitle>
              <DialogDescription>
                {dialog.user.actif
                  ? "La personne est déconnectée immédiatement et ne peut plus se connecter. Ses rapports sont conservés."
                  : "La personne pourra de nouveau se connecter."}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>Annuler</Button>
              <Button variant={dialog.user.actif ? "destructive" : "default"} disabled={toggling} onClick={confirmToggle}>
                {dialog.user.actif ? "Désactiver" : "Réactiver"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
