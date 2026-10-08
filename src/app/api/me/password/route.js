import dbConnection from "@/lib/db"
import User from "@/models/User.model"
import { withAuth } from "@/utils/withAuth"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { passwordError } from "@/lib/user-rules"

const fail = (message, status) =>
    NextResponse.json({ message, success: false, error: true }, { status })

// Changement de son propre mot de passe (tous les rôles) ; lève l'obligation de changement
export const POST = withAuth(async (req, context, session) => {
    try {
        await dbConnection()
        const user = await User.findById(session.user.id)
        if (!user) return fail("Utilisateur introuvable.", 404)

        const { currentPassword, newPassword } = await req.json()
        if (typeof currentPassword !== "string" || !(await bcrypt.compare(currentPassword, user.password))) {
            return fail("Mot de passe actuel incorrect.", 400)
        }
        const error = passwordError(newPassword)
        if (error) return fail(error, 400)
        if (newPassword === currentPassword) {
            return fail("Le nouveau mot de passe doit être différent de l'actuel.", 400)
        }

        const salt = await bcrypt.genSalt(10)
        user.password = await bcrypt.hash(newPassword, salt)
        user.mustChangePassword = false
        await user.save()

        return NextResponse.json({
            message: "Mot de passe modifié.",
            success: true,
            error: false
        }, { status: 200 })
    } catch (error) {
        console.error("Erreur lors du changement de mot de passe: ", error)
        return fail("Erreur! Veuillez réessayer.", 500)
    }
})
