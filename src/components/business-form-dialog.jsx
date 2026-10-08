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
import { BUSINESS_TYPES, BUSINESS_TYPE_LABELS } from "@/lib/business-types"

// Création (business absent) ou modification d'une activité
export default function BusinessFormDialog({ business, onClose, onSaved }) {
  const creating = !business
  const [isSaving, setIsSaving] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { name: business?.name ?? "", type: business?.type ?? "" },
  })

  const onSubmit = async ({ name, type }) => {
    setIsSaving(true)
    try {
      const payload = { type: type || null }
      if (!business?.protectedName) payload.name = name
      const rep = creating
        ? await axios.post("/api/business", payload)
        : await axios.patch(`/api/business/${business._id}`, payload)
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{creating ? "Nouvelle activité" : `Modifier ${business.name}`}</DialogTitle>
          <DialogDescription>
            Le type détermine la section du tableau de bord où les rapports de l&apos;activité sont comptés.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nom <Required /></Label>
            <Input id="name" disabled={business?.protectedName}
              {...register("name", { required: !business?.protectedName })} />
            {business?.protectedName && (
              <span className="text-xs text-gray-500">
                Le tableau de bord retrouve cette activité par son nom : elle ne peut pas être renommée.
              </span>
            )}
            {errors.name && <span className="text-sm text-red-500">Le nom est obligatoire.</span>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="type">Type</Label>
            <select id="type" className="h-9 rounded-md border px-3" {...register("type")}>
              <option value="">Aucun (hors sections du tableau de bord)</option>
              {BUSINESS_TYPES.map((type) => (
                <option key={type} value={type}>{BUSINESS_TYPE_LABELS[type]}</option>
              ))}
            </select>
            {!creating && business.reportsCount > 0 && (
              <span className="text-xs text-amber-700">
                Changer le type déplace ses {business.reportsCount} rapport(s) vers une autre section du tableau de bord.
              </span>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Enregistrement..." : creating ? "Créer l'activité" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
