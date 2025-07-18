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

export const PUT = withAuth(async (req, {params}) => {
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

        const body = await req.json()
        const {
            sales,
            revenueCash,
            revenueOrangeMoney,
            revenueWave,
            debts,
            reglementDebts,
            sortieCaisse,
            versementTataDiara,
            date
        } = body

        const report = await DailyReport.findById(id);
        if (!report) {
            return NextResponse.json(
                {
                message: "Rapport introuvable.",
                success: false,
                error: true,
                },
                { status: 404 }
            );
        }

        if(body.hasOwnProperty("sales")) report.sales = sales
        if(body.hasOwnProperty("debts")) report.debts = debts
        if(body.hasOwnProperty("reglementDebts")) report.reglementDebts = reglementDebts
        if(body.hasOwnProperty("sortieCaisse")) report.sortieCaisse = sortieCaisse 

        if(body.hasOwnProperty("revenueCash") && typeof revenueCash === "number") report.revenueCash = revenueCash
        if(body.hasOwnProperty("revenueOrangeMoney") && typeof revenueOrangeMoney === "number") report.revenueOrangeMoney = revenueOrangeMoney
        if(body.hasOwnProperty("revenueWave") && typeof revenueWave === "number") report.revenueWave = revenueWave
        if(body.hasOwnProperty("versementTataDiara") && typeof versementTataDiara === "number") report.versementTataDiara = versementTataDiara

        if(date) report.date = new Date(date)

        const updatedReport = await report.save()
        return NextResponse.json({
            message: "Rapport mis à jour avec succès!",
            success: true,
            error: false,
            data: updatedReport
        }, { status: 200 })

    } catch (error) {
        console.error("Erreur lors de la modification du rapport: ", error)
        return NextResponse.json({
            message: "Erreur! Veuillez réessayer.",
            success: false,
            error: true
        }, { status: 500 })
    }
})