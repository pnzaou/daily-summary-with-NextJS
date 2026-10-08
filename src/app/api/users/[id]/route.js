import dbConnection from "@/lib/db"
import User from "@/models/User.model"
import Business from "@/models/Business.Model"
import { withRoles } from "@/utils/withRoles"
import mongoose from "mongoose"
import { NextResponse } from "next/server"
import { canManage, parseUserInput, publicUser } from "@/lib/user-rules"

const fail = (message, status) =>
    NextResponse.json({ message, success: false, error: true }, { status })

// Modification d'un compte : identité, rôle, activités, activation / désactivation
export const PATCH = withRoles(["admin", "comptable"], async (req, { params }, session) => {
    try {
        await dbConnection()
        const { id } = await params
        if (!mongoose.Types.ObjectId.isValid(id)) return fail("Identifiant invalide.", 400)

        const target = await User.findById(id)
        if (!target) return fail("Utilisateur introuvable.", 404)

        const actorRole = session.user.role
        if (!canManage(actorRole, target.role)) {
            return fail("Vous ne pouvez pas modifier ce compte.", 403)
        }

        const { error, values } = parseUserInput(await req.json(), { creating: false })
        if (error) return fail(error, 400)

        const isSelf = String(target._id) === session.user.id
        if (values.role !== undefined && values.role !== target.role) {
            if (isSelf) return fail("Vous ne pouvez pas changer votre propre rôle.", 400)
            if (!canManage(actorRole, values.role)) return fail("Vous ne pouvez pas attribuer ce rôle.", 403)
        }
        if (values.actif === false && isSelf) {
            return fail("Vous ne pouvez pas désactiver votre propre compte.", 400)
        }
        if (values.email && values.email !== target.email
            && await User.exists({ email: values.email, _id: { $ne: target._id } })) {
            return fail("Cet email est déjà utilisé.", 409)
        }
        if (values.businesses?.length
            && await Business.countDocuments({ _id: { $in: values.businesses } }) !== values.businesses.length) {
            return fail("Activité introuvable.", 400)
        }

        Object.assign(target, values)
        await target.save()

        const user = await User.findById(id).select("-password").populate("businesses", "name").lean()
        return NextResponse.json({
            message: "Compte mis à jour.",
            success: true,
            error: false,
            data: publicUser(user, actorRole)
        }, { status: 200 })
    } catch (error) {
        if (error?.code === 11000) return fail("Cet email est déjà utilisé.", 409)
        console.error("Erreur lors de la modification de l'utilisateur: ", error)
        return fail("Erreur! Veuillez réessayer.", 500)
    }
})
