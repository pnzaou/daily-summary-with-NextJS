import RapportCompta from "@/models/RapportCompta.Model"
import { withAuthAndRole } from "@/utils/withAuthAndRole"
import mongoose from "mongoose"
import { NextResponse } from "next/server"

export const GET = withAuthAndRole(async (req, {params}) => {
    try {
        const { id } = await params

        if(!id || !mongoose.Types.ObjectId.isValid(id)){
            return NextResponse.json({
                error: true,
                success: false,
                message: "Veuillez renseigner un id valide"
            }, { status: 400 })
        }

        const rapport = await RapportCompta
            .findById(id)
            .populate({
                path: "caissePrincipale.entrees.business",
                select: "name"
            })
            .lean()

        return NextResponse.json({
            error: false,
            success: true,
            data: rapport
        },{ status: 200 })

    } catch (error) {

        console.log("Erreur lors de la récupération des détails du rapport comptable", error)
        return NextResponse.json({
            error: true,
            success: false,
            message: "Erreur veuillez réessayer."
        }, { status: 500 })
    }
})