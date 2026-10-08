import dbConnection from "@/lib/db"
import User from "@/models/User.model"
import Business from "@/models/Business.Model"
import { withRoles } from "@/utils/withRoles"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { canManage, manageableRoles, parseUserInput, publicUser } from "@/lib/user-rules"

const fail = (message, status) =>
    NextResponse.json({ message, success: false, error: true }, { status })

// Liste de tous les comptes (le comptable voit tout, mais ne peut gérer que les gérants)
export const GET = withRoles(["admin", "comptable"], async (req, context, session) => {
    try {
        await dbConnection()
        const users = await User.find({})
            .select("-password")
            .populate("businesses", "name")
            .sort({ role: 1, nom: 1, prenom: 1 })
            .lean()

        return NextResponse.json({
            success: true,
            error: false,
            data: {
                users: users.map((u) => publicUser(u, session.user.role)),
                assignableRoles: manageableRoles(session.user.role),
            }
        }, { status: 200 })
    } catch (error) {
        console.error("Erreur lors de la récupération des utilisateurs: ", error)
        return fail("Erreur! Veuillez réessayer.", 500)
    }
})

// Création d'un compte avec un mot de passe provisoire, à changer à la première connexion
export const POST = withRoles(["admin", "comptable"], async (req, context, session) => {
    try {
        await dbConnection()
        const { error, values } = parseUserInput(await req.json(), { creating: true })
        if (error) return fail(error, 400)

        if (!canManage(session.user.role, values.role)) {
            return fail("Vous ne pouvez pas créer un compte avec ce rôle.", 403)
        }
        const businesses = values.businesses || []
        if (businesses.length && await Business.countDocuments({ _id: { $in: businesses } }) !== businesses.length) {
            return fail("Activité introuvable.", 400)
        }
        if (await User.exists({ email: values.email })) {
            return fail("Cet email est déjà utilisé.", 409)
        }

        const salt = await bcrypt.genSalt(10)
        const created = await User.create({
            ...values,
            businesses,
            password: await bcrypt.hash(values.password, salt),
            actif: true,
            mustChangePassword: true,
        })

        const user = await User.findById(created._id).select("-password").populate("businesses", "name").lean()
        return NextResponse.json({
            message: "Compte créé. Le mot de passe devra être changé à la première connexion.",
            success: true,
            error: false,
            data: publicUser(user, session.user.role)
        }, { status: 201 })
    } catch (error) {
        if (error?.code === 11000) return fail("Cet email est déjà utilisé.", 409)
        console.error("Erreur lors de la création de l'utilisateur: ", error)
        return fail("Erreur! Veuillez réessayer.", 500)
    }
})
