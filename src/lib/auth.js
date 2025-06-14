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
                const user = await User.findOne({ email })

                if(!user) {
                    throw new Error("Utilisateur introuvable");
                }

                const checkedPassword = await bcrypt.compare(password, user.password)
                if(!checkedPassword) {
                    throw new Error("Mot de passe incorrect");
                }

                return { //retourner les données qui seront stocker dans la session et le token
                    id: user._id.toString(),
                    name: `${user.prenom} ${user.nom}`, //name est ajouté automatiquement dans la session et le token
                    email: user.email, //email aussi est ajouté automatiquement dans la session et le token
                    role: user.role 
                }
            }
        })
    ],
    session: {
        strategy: "jwt",
        maxAge: 8 * 60 * 60,//expiration de la session après 8h
        updateAge: 0 //pour ne jamais rafraichir le token
    },
    callbacks: {
        async jwt({ token, user }) { //Ajouter des data au token id et role qui ne sont pas enregistré automatiquement dans le token
            if(user) {
                token.id = user.id
                token.role = user.role
            }
            return token
        },
        async session({ session, token }) { //Ajouter des data à la session id et role qui ne sont pas enregistré automatiquement dans le token
            if (session?.user) {
                session.user.id = token.id;
                session.user.role = token.role;
            }
            return session
        }
    },
    secret: process.env.NEXTAUTH_SECRET
}

export default authOptions