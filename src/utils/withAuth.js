import { getServerSession } from "next-auth"
import authOptions from "@/lib/auth"
import { NextResponse } from "next/server"

export const withAuth = (handler) => {
    return async (...args) => {
        const [req, context] = args

        const session = await getServerSession(authOptions)


        if(!session) {
            return NextResponse.json(
                {
                    message: "Accès refusé !",
                    success: false,
                    error: true
                },
                { status: 401 }
            )
        }

        if(args.length === 1) {
            return handler(req, session)
        } else {
            return handler(req, context, session)
        }
    }
}