"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import toast from "react-hot-toast"
import Required from "./Required"

export function LoginForm({
  className,
  ...props
}) {

  const [isLoading, setIsLoading] = useState(false)
  const { handleSubmit, register, formState: { errors } } = useForm()
  const router = useRouter()
  const mdpRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/
  const emailRegex = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/

  const onSubmit = async (data) => {
    setIsLoading(true)
    const res = await signIn("credentials",{
      email: data.email,
      password: data.password,
      redirect: false
    })

    setIsLoading(false)
    if(res.ok) {
      toast.success("Connexion réussie !", {
        position: "top-center"
      })
      router.push("/dashboard")
      return;
    } 

    switch(res.error) {
      case "Compte suspendu":
        toast.error("Votre compte a été suspendu!", {
          position: "top-center"
        })
        break;
      case "Utilisateur introuvable":
        toast.error("Email ou mot de passe incorrect", {
          position: "top-center"
        })
        break;
      case "Mot de passe incorrect":
        toast.error("Email ou mot de passe incorrect", {
          position: "top-center"
        })
        break;
      default:
        toast.error("Erreur de connexion. Veuillez réessayer.", {
          position: "top-center"
        })
        break;
    }
  }

  return (
    (<div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Connexion</CardTitle>
          <CardDescription>
            Connectez-vous à votre compte.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="email">Email <Required/></Label>
                <Input 
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  {...register("email", {
                    required: true,
                    pattern: emailRegex
                  })}
                />
                {errors.email && <span className="
                  mt-2 text-sm text-red-500
                ">
                  Champ requis! Veuillez saisir un email valid
                </span>}
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Mot de passe <Required/></Label>
                  {/* <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline">
                    Forgot your password?
                  </a> */}
                </div>
                <Input 
                 id="password" 
                 type="password" 
                 required
                 {...register("password", {
                  required: true,
                  pattern: mdpRegex,
                  min: 8
                 })}
                />
                {errors.password && <span className="
                  mt-2 text-sm text-red-500
                ">
                  Champ requis! Minimum: 1 maj, 1 min, 1 chiffre, 1 spé, 8 car
                </span>}
              </div>
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading 
                  ? (
                    <>
                    <span className="w-4 h-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></span> connexion en cours...
                    </>
                  ) 
                  : "Se connecter"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>)
  );
}
