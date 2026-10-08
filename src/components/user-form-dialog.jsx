"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import axios from "axios"
import toast from "react-hot-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Required from "./Required"
import { PASSWORD_REGEX, PASSWORD_RULE_MESSAGE, generatePassword } from "@/lib/password-rule"
import { ROLE_LABELS } from "@/lib/roles"

// Création (user absent) ou modification d'un compte
export default function UserFormDialog({ user, assignableRoles, businesses, isSelf, onClose, onSaved }) {
  const creating = !user
  const [isSaving, setIsSaving] = useState(false)
  const [selectedBusinesses, setSelectedBusinesses] = useState(
    () => new Set(creating ? [] : user.businesses.map((b) => b._id))
  )
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: creating
      ? { prenom: "", nom: "", email: "", password: generatePassword(), role: assignableRoles[0] }
      : { prenom: user.prenom, nom: user.nom, email: user.email, role: user.role },
  })

  const toggleBusiness = (id) => {
    setSelectedBusinesses((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const onSubmit = async (values) => {
    setIsSaving(true)
    try {
      const payload = { ...values, businesses: [...selectedBusinesses] }
      if (isSelf) delete payload.role
      const rep = creating
        ? await axios.post("/api/users", payload)
        : await axios.patch(`/api/users/${user._id}`, payload)
      toast.success(rep.data.message)
      onSaved()
    } catch (error) {
      toast.error(error.response?.data?.message || "Erreur lors de l'enregistrement.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{creating ? "Nouveau compte" : `Modifier ${user.prenom} ${user.nom}`}</DialogTitle>
          <DialogDescription>
            {creating
              ? "La personne devra choisir son propre mot de passe à sa première connexion."
              : "Les changements de rôle et d'activités s'appliquent immédiatement."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="prenom">Prénom <Required /></Label>
              <Input id="prenom" {...register("prenom", { required: true })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nom">Nom <Required /></Label>
              <Input id="nom" {...register("nom", { required: true })} />
            </div>
          </div>
          {(errors.prenom || errors.nom) && (
            <span className="text-sm text-red-500">Le prénom et le nom sont obligatoires.</span>
          )}

          <div className="grid gap-2">
            <Label htmlFor="email">Email <Required /></Label>
            <Input id="email" type="email" {...register("email", { required: true })} />
          </div>

          {creating && (
            <div className="grid gap-2">
              <Label htmlFor="password">Mot de passe provisoire <Required /></Label>
              <div className="flex gap-2">
                <Input id="password" className="font-mono"
                  {...register("password", { required: true, pattern: PASSWORD_REGEX })} />
                <Button type="button" variant="outline" onClick={() => setValue("password", generatePassword())}>
                  Générer
                </Button>
              </div>
              <span className={errors.password ? "text-sm text-red-500" : "text-xs text-gray-500"}>
                {PASSWORD_RULE_MESSAGE} À communiquer à la personne.
              </span>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="role">Rôle <Required /></Label>
            {isSelf ? (
              <p className="text-sm text-gray-600">{ROLE_LABELS[user.role]} (vous ne pouvez pas changer votre propre rôle)</p>
            ) : (
              <select id="role" className="h-9 rounded-md border px-3" {...register("role", { required: true })}>
                {assignableRoles.map((role) => (
                  <option key={role} value={role}>{ROLE_LABELS[role] ?? role}</option>
                ))}
              </select>
            )}
          </div>

          <fieldset className="grid gap-2">
            <legend className="mb-1 text-sm font-medium">Activités rattachées</legend>
            {businesses.length === 0 && <p className="text-sm text-gray-500">Aucune activité.</p>}
            <div className="grid max-h-48 grid-cols-2 gap-1 overflow-y-auto">
              {businesses.map((b) => (
                <label key={b._id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={selectedBusinesses.has(b._id)} onChange={() => toggleBusiness(b._id)} />
                  {b.name}
                </label>
              ))}
            </div>
          </fieldset>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Enregistrement..." : creating ? "Créer le compte" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
