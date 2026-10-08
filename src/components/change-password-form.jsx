"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import axios from "axios"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Required from "./Required"
import { PASSWORD_REGEX, PASSWORD_RULE_MESSAGE } from "@/lib/password-rule"

export default function ChangePasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { register, handleSubmit, reset, getValues, formState: { errors } } = useForm()

  const onSubmit = async ({ currentPassword, newPassword }) => {
    setIsLoading(true)
    try {
      const rep = await axios.post("/api/me/password", { currentPassword, newPassword })
      toast.success(rep.data.message || "Mot de passe modifié.")
      reset()
      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      toast.error(error.response?.data?.message || "Erreur lors du changement de mot de passe.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="currentPassword">
          Mot de passe actuel <Required />
        </Label>
        <Input id="currentPassword" type="password" autoComplete="current-password"
          {...register("currentPassword", { required: true })} />
        {errors.currentPassword && (
          <span className="text-sm text-red-500">Champ requis.</span>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="newPassword">
          Nouveau mot de passe <Required />
        </Label>
        <Input id="newPassword" type="password" autoComplete="new-password"
          {...register("newPassword", { required: true, pattern: PASSWORD_REGEX })} />
        <span className={errors.newPassword ? "text-sm text-red-500" : "text-xs text-gray-500"}>
          {PASSWORD_RULE_MESSAGE}
        </span>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="confirmPassword">
          Confirmer le nouveau mot de passe <Required />
        </Label>
        <Input id="confirmPassword" type="password" autoComplete="new-password"
          {...register("confirmPassword", {
            required: true,
            validate: (value) => value === getValues("newPassword"),
          })} />
        {errors.confirmPassword && (
          <span className="text-sm text-red-500">Les deux mots de passe ne correspondent pas.</span>
        )}
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Enregistrement..." : "Changer le mot de passe"}
      </Button>
    </form>
  )
}
