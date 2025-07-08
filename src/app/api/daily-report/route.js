import authOptions from "@/lib/auth"
import dbConnection from "@/lib/db"
import DailyReport from "@/models/DailyReport.Model"
import { withAuth } from "@/utils/withAuth"
import { withAuthAndRole } from "@/utils/withAuthAndRole"
import mongoose from "mongoose"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import Business from "@/models/Business.Model"

export const POST = withAuth(async (req) => {
    try {
        await dbConnection()

        const session = await getServerSession(authOptions)
        const {id} = session?.user ?? {};

        if(!id || !mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({
                message: "Utilisateur non trouvé!",
                success: false,
                error: true
            },{ status: 401 })
        }

        const { business, revenueCash, revenueOrangeMoney, revenueWave, debts = [], reglementDebts = [], sales = [], sortieCaisse, versementTataDiara } = await req.json()

        if (!business || !mongoose.Types.ObjectId.isValid(business)) {
            return NextResponse.json(
              { message: "Veuillez selectionner une activiter.", success: false, error: true },
              { status: 400 }
            );
        }

        const regsByRef = reglementDebts.reduce((map, r) => {
            const key = r.ref.toLowerCase();
            const tot = Number(r.total);
            map[key] = (map[key] || 0) + tot;
            return map;
        }, {})

        const finalDebts = debts.reduce((acc, d) => {
            const key = d.ref.toLowerCase();
            const originalTotal = Number(d.total);
            const payed = regsByRef[key] || 0;
            const remaining = originalTotal - payed;

            if (remaining > 0) {
                acc.push({
                    ref: key,
                    description: d.description,
                    total: remaining
                })
            }

            return acc;
        }, [])

        const newReport = await DailyReport.create({
            business,
            gerant: id,
            revenueCash: Number(revenueCash) || 0,
            revenueOrangeMoney: Number(revenueOrangeMoney) || 0,
            revenueWave: Number(revenueWave) || 0,
            sales: Array.isArray(sales) 
            ? sales.map((s) => ({
                ref: s.ref.toLowerCase(),
                description: s.description,
                total: Number(s.total),
            })) 
            : [],
            debts: finalDebts,
            reglementDebts: Array.isArray(reglementDebts) 
            ? reglementDebts.map((r) => ({
                ref: r.ref.toLowerCase(),
                description: r.description,
                total: Number(r.total)
            })) : [],
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
            .select("business revenueCash revenueOrangeMoney revenueWave sortieCaisse versementTataDiara sales debts reglementDebts date")
            .lean()

        const aggregateTotals = async (startDate) => {
            const res = await DailyReport.aggregate([
                { $match: { date: { $gte: startDate } } },
                {
                    $project: {
                        revenueCash: 1,
                        revenueOrangeMoney: 1,
                        revenueWave: 1,
                        sortieCaisse: 1,
                        versementTataDiara: 1,

                        salesCount: { $size: "$sales" },

                        debtsSum: { $sum: "$debts.total" },

                        reglementDebtsSum: { $sum: "$reglementDebts.total" }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalCash: { $sum: "$revenueCash" },
                        totalOM: { $sum: "$revenueOrangeMoney" },
                        totalWave: { $sum: "$revenueWave" },

                        totalSortieCaisse: { $sum: "$sortieCaisse" },
                        totalVersementTataDiara: { $sum: "$versementTataDiara" },

                        totalSalesCount: { $sum: "$salesCount" },

                        totalDebts: { $sum: "$debtsSum" },

                        totalReglementDebts: { $sum: "$reglementDebtsSum" }
                    }
                }
            ]);

            return res[0] || {
                totalCash: 0,
                totalOM: 0,
                totalWave: 0,
                totalSortieCaisse: 0,
                totalVersementTataDiara: 0,
                totalSalesCount: 0,
                totalDebts: 0,
                totalReglementDebts: 0,
            };
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