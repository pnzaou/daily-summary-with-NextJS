import authOptions from "@/lib/auth"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"

export const withAuthAndRole = (handler) => {
    return async (...args) => {
        const [req, context] = args

        const session = await getServerSession(authOptions)

        console.log(session)

        if(!session || session.user.role !== "admin") {
            return NextResponse.json(
                {
                    message: "Accès refusé !",
                    success: false,
                    error: true
            },{ status: 401 })
        }

        if(args.length === 1) {
            return handler(req, session)
        } else {
            return handler(req, context, session)
        }
    }
}