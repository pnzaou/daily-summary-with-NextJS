import authOptions from "@/lib/auth"
import dbConnection from "@/lib/db"
import DailyReport from "@/models/DailyReport.Model"
import { withAuth } from "@/utils/withAuth"
import { withAuthAndRole } from "@/utils/withAuthAndRole"
import mongoose from "mongoose"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"

export const POST = withAuth(async (req) => {
    try {
        await dbConnection()

        const session = await getServerSession(authOptions)
        const {id} = session?.user

        if(!id || !mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({
                message: "Utilisateur non trouvé!",
                success: false,
                error: true
            },{ status: 401 })
        }

        const { business, revenueCash, revenueOrangeMoney, revenueWave, debts, reglementDebts, sales, sortieCaisse, versementTataDiara } = await req.json()

        if (!business || !mongoose.Types.ObjectId.isValid(business)) {
            return NextResponse.json(
              { message: "Veuillez selectionner une activiter.", success: false, error: true },
              { status: 400 }
            );
          }

        const newReport = await DailyReport.create({
            business,
            gerant: id,
            revenueCash: Number(revenueCash) || 0,
            revenueOrangeMoney: Number(revenueOrangeMoney) || 0,
            revenueWave: Number(revenueWave) || 0,
            debts: Array.isArray(debts) ? debts.map(d => ({
                description: d.description,
                total: Number(d.total)
            })) : [],
            reglementDebts: Array.isArray(reglementDebts) ? reglementDebts.map(d => ({
                description: d.description,
                total: Number(d.total)
            })) : [],
            sales: Array.isArray(sales) ? sales.map(s => s.description) : [],
            sortieCaisse: Number(sortieCaisse) || 0,
            versementTataDiara: Number(versementTataDiara) || 0,
        })

        return NextResponse.json({
            message: "Rapport créé avec succès!",
            success: true,
            error: false,
            data: newReport
        }, { status: 201 })

    } catch (error) {
        console.error("Erreur lors de la création du rapport: ", error)
        return NextResponse.json({
            message: "Erreur! Veuillez réessayer.",
            success: false,
            error: true
        }, { status: 500 })
    }
})

export const GET = withAuthAndRole(async (req) => {
    try {
        await dbConnection()

        const now = new Date()
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const startOfYear = new Date(now.getFullYear(), 0, 1)

        const dailyReport = await DailyReport
            .find({ date: { $gte: startOfDay } })
            .populate("business", "name")
            .select("business revenueCash revenueOrangeMoney revenueWave debts date")
            .lean()

        const aggregateTotals = async (startDate) => {
            const res = await DailyReport.aggregate([
                { $match: { date: { $gte: startDate } } },
                {
                    $group: {
                        _id: null,
                        totalCash: { $sum: "$revenueCash" },
                        totalOM: { $sum: "$revenueOrangeMoney" },
                        totalWave: { $sum: "$revenueWave" },
                        totalDebts: { $sum: "$debts" }
                    }
                }
            ])
            return res[0] || { totalCash: 0, totalOM: 0, totalWave: 0, totalDebts: 0 }
        }

        const totalsDay = await aggregateTotals(startOfDay)
        const totalsMonth = await aggregateTotals(startOfMonth)
        const totalsYear = await aggregateTotals(startOfYear)

        return NextResponse.json({
            message: "Rapports récupérés avec succès!",
            success: true,
            error: false,
            data: {
                dailyReport,
                totals: {
                    day: totalsDay,
                    month: totalsMonth,
                    year: totalsYear
                }
            }
        }, { status: 200 })

    } catch (error) {
        console.error("Erreur lors de la récupération des rapports: ", error)
        return NextResponse.json({
            message: "Erreur! Veuillez réessayer.",
            success: false,
            error: true
        }, { status: 500 })
    }
})