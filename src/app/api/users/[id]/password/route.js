import dbConnection from "@/lib/db"
import User from "@/models/User.model"
import { withRoles } from "@/utils/withRoles"
import mongoose from "mongoose"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { canManage, passwordError } from "@/lib/user-rules"

const fail = (message, status) =>
    NextResponse.json({ message, success: false, error: true }, { status })

// Réinitialisation par l'admin ou le comptable : mot de passe provisoire, à changer à la prochaine connexion
export const POST = withRoles(["admin", "comptable"], async (req, { params }, session) => {
    try {
        await dbConnection()
        const { id } = await params
        if (!mongoose.Types.ObjectId.isValid(id)) return fail("Identifiant invalide.", 400)

        const target = await User.findById(id)
        if (!target) return fail("Utilisateur introuvable.", 404)

        if (!canManage(session.user.role, target.role)) {
            return fail("Vous ne pouvez pas réinitialiser le mot de passe de ce compte.", 403)
        }
        if (String(target._id) === session.user.id) {
            return fail("Pour votre propre mot de passe, utilisez « Mon compte ».", 400)
        }

        const { password } = await req.json()
        const error = passwordError(password)
        if (error) return fail(error, 400)

        const salt = await bcrypt.genSalt(10)
        target.password = await bcrypt.hash(password, salt)
        target.mustChangePassword = true
        await target.save()

        return NextResponse.json({
            message: "Mot de passe réinitialisé. Il devra être changé à la prochaine connexion.",
            success: true,
            error: false
        }, { status: 200 })
    } catch (error) {
        console.error("Erreur lors de la réinitialisation du mot de passe: ", error)
        return fail("Erreur! Veuillez réessayer.", 500)
    }
})
