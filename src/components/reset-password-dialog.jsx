"use client"

import { useState } from "react"
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
import { PASSWORD_REGEX, PASSWORD_RULE_MESSAGE, generatePassword } from "@/lib/password-rule"

// Réinitialisation par l'admin ou le comptable : mot de passe provisoire à communiquer à la personne
export default function ResetPasswordDialog({ user, onClose, onSaved }) {
  const [password, setPassword] = useState(() => generatePassword())
  const [isSaving, setIsSaving] = useState(false)
  const valid = PASSWORD_REGEX.test(password)

  const onSubmit = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    try {
      const rep = await axios.post(`/api/users/${user._id}/password`, { password })
      toast.success(rep.data.message)
      onSaved()
    } catch (error) {
      toast.error(error.response?.data?.message || "Erreur lors de la réinitialisation.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
          <DialogDescription>
            {user.prenom} {user.nom} devra choisir un nouveau mot de passe à sa prochaine connexion.
            Communiquez-lui ce mot de passe provisoire.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <Label htmlFor="tempPassword">Mot de passe provisoire</Label>
          <div className="flex gap-2">
            <Input id="tempPassword" className="font-mono" value={password}
              onChange={(e) => setPassword(e.target.value)} />
            <Button type="button" variant="outline" onClick={() => setPassword(generatePassword())}>
              Générer
            </Button>
          </div>
          <span className={valid ? "text-xs text-gray-500" : "text-sm text-red-500"}>{PASSWORD_RULE_MESSAGE}</span>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={!valid || isSaving}>
              {isSaving ? "Enregistrement..." : "Réinitialiser"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
