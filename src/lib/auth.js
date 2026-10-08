import Credentials from "next-auth/providers/credentials";
import dbConnection from "./db";
import User from "@/models/User.model";
import bcrypt from "bcryptjs"

const authOptions = {
    providers: [ //Liste des providers (c'est dans ce tableau que l'on peut lister nos providers, google, github,... )
        Credentials({ //authentification personnalisée (Credentials)
            type: "credentials",
            name: "credentials",
            id: "credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) { //fonction pour gerer l'auth (Uniquement utilisé avec Credentials)
                await dbConnection()

                const {email, password} = credentials
                const user = await User.findOne({ email: String(email || "").trim().toLowerCase() })

                if(!user) {
                    throw new Error("Utilisateur introuvable");
                }

                const checkedPassword = await bcrypt.compare(password, user.password)
                if(!checkedPassword) {
                    throw new Error("Mot de passe incorrect");
                }

                // vérifié après le mot de passe : l'état du compte n'est révélé qu'à son titulaire
                if(user.actif === false) {
                    throw new Error("Compte suspendu");
                }

                await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } })

                return { //retourner les données qui seront stocker dans la session et le token
                    id: user._id.toString(),
                    name: `${user.prenom} ${user.nom}`, //name est ajouté automatiquement dans la session et le token
                    email: user.email, //email aussi est ajouté automatiquement dans la session et le token
                    role: user.role,
                    mustChangePassword: user.mustChangePassword === true
                }
            }
        })
    ],
    session: {
        strategy: "jwt",
        maxAge: 1 * 60 * 60,//expiration de la session après 1h
        updateAge: 0 //pour ne jamais rafraichir le token
    },
    callbacks: {
        async jwt({ token, user }) { //Ajouter des data au token id et role qui ne sont pas enregistré automatiquement dans le token
            if(user) {
                token.id = user.id
                token.role = user.role
                token.mustChangePassword = user.mustChangePassword
                return token
            }

            // À chaque vérification de session, le compte est relu : une désactivation ou un
            // changement de rôle s'applique tout de suite, sans attendre l'expiration du jeton.
            // Lever une erreur ici fait annuler la session par next-auth.
            await dbConnection()
            const current = await User.findById(token.id)
                .select("nom prenom email role actif mustChangePassword")
                .lean()
            if(!current || current.actif === false) {
                throw new Error("Compte supprimé ou désactivé : session annulée")
            }
            token.name = `${current.prenom} ${current.nom}`
            token.email = current.email
            token.role = current.role
            token.mustChangePassword = current.mustChangePassword === true
            return token
        },
        async session({ session, token }) { //Ajouter des data à la session id et role qui ne sont pas enregistré automatiquement dans le token
            if (session?.user) {
                session.user.id = token.id;
                session.user.role = token.role;
                session.user.mustChangePassword = token.mustChangePassword === true;
            }
            return session
        }
    },
    secret: process.env.NEXTAUTH_SECRET
}

export default authOptions