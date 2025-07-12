import dbConnection from "@/lib/db"
import DailyReport from "@/models/DailyReport.Model"
import { withAuth } from "@/utils/withAuth"
import mongoose from "mongoose"
import { NextResponse } from "next/server"
import Business from "@/models/Business.Model"

export const GET = withAuth(async (req, {params}) => {
    try {
        await dbConnection()
        const { id } = await params

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({
                message: "Veuillez former un ID valide!",
                success: false,
                error: true
            }, { status: 400 })
        }

        const dailyReport = await DailyReport.findById(id)
            .populate("business", "_id name")
            .lean()

        if (!dailyReport) {
            return NextResponse.json({
                message: "Rapport non trouvé!",
                success: false,
                error: true
            }, { status: 404 })
        }

        return NextResponse.json({
            message: "Rapport récupéré avec succès!",
            success: true,
            error: false,
            data: {
                _id: dailyReport._id,
                sales: dailyReport.sales,
                business: dailyReport.business,
                revenueCash: dailyReport.revenueCash,
                revenueOrangeMoney: dailyReport.revenueOrangeMoney,
                revenueWave: dailyReport.revenueWave,
                debts: dailyReport.debts,
                reglementDebts: dailyReport.reglementDebts,
                sortieCaisse: dailyReport.sortieCaisse,
                versementTataDiara: dailyReport.versementTataDiara,
                date: dailyReport.date
            }
        })

    } catch (error) {
        console.error("Erreur lors de la récupération du rapport: ", error)
        return NextResponse.json({
            message: "Erreur! Veuillez réessayer.",
            success: false,
            error: true
        }, { status: 500 })
    }
})