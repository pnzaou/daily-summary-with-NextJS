import dbConnection from "@/lib/db"
import DailyReport from "@/models/DailyReport.Model"
import User from "@/models/User.model"
import { withRoles } from "@/utils/withRoles"
import mongoose from "mongoose"
import { NextResponse } from "next/server"
import Business from "@/models/Business.Model"
import { cleanLines, cleanSortieLines, findIncompleteLine } from "@/lib/report-lines"

const DUPLICATE_MESSAGE =
  "Un rapport a déjà été envoyé aujourd'hui pour cette activité. Modifiez-le depuis « Voir mes rapports »."

export const POST = withRoles(["gerant", "admin"], async (req, context, session) => {
  try {
    await dbConnection();

    const { id: gerantId } = session?.user ?? {};
    if (!gerantId || !mongoose.Types.ObjectId.isValid(gerantId)) {
      return NextResponse.json(
        { message: "Utilisateur non trouvé !", success: false, error: true },
        { status: 401 }
      );
    }

    const {
      business,
      revenueCash = 0,
      revenueOrangeMoney = 0,
      revenueWave = 0,
      debts = [],
      reglementDebts = [],
      sales = [],
      sortieCaisse = [],
      versementTataDiara = 0,
    } = await req.json();

    if (!business || !mongoose.Types.ObjectId.isValid(business)) {
      return NextResponse.json(
        {
          message: "Veuillez sélectionner une activité.",
          success: false,
          error: true,
        },
        { status: 400 }
      );
    }

    // un gérant ne peut déclarer que pour ses propres activités
    if (session.user.role === "gerant") {
      const user = await User.findById(gerantId).select("businesses").lean();
      const isOwnBusiness = (user?.businesses || []).some((b) => b.toString() === business);
      if (!isOwnBusiness) {
        return NextResponse.json(
          { message: "Vous n'êtes pas rattaché à cette activité.", success: false, error: true },
          { status: 403 }
        );
      }
    }

    const cleanSales = cleanLines(sales);
    const cleanDebts = cleanLines(debts);
    const cleanRegs  = cleanLines(reglementDebts);
    const cleanSortieCaisse = cleanSortieLines(sortieCaisse);

    const incomplete = findIncompleteLine({
      sales: cleanSales, debts: cleanDebts, reglementDebts: cleanRegs, sortieCaisse: cleanSortieCaisse,
    });
    if (incomplete) {
      return NextResponse.json(
        { message: incomplete, success: false, error: true },
        { status: 400 }
      );
    }

    // un seul rapport par gérant, activité et jour (début de journée, comme le défaut du modèle)
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    if (await DailyReport.exists({ business, gerant: gerantId, date })) {
      return NextResponse.json(
        { message: DUPLICATE_MESSAGE, success: false, error: true },
        { status: 409 }
      );
    }

    // reglements groupés par ref
    const regsByRef = cleanRegs.reduce((map, { ref, total }) => {
      map[ref] = (map[ref] || 0) + total;
      return map;
    }, {});

    // recalcul du solde des dettes après règlement
    const finalDebts = cleanDebts.reduce((acc, { ref, description, total }) => {
      const payed     = regsByRef[ref] || 0;
      const remaining = total - payed;
      if (remaining > 0) {
        acc.push({ ref, description, total: remaining });
      }
      return acc;
    }, []);

    const newReport = await DailyReport.create({
      business,
      gerant: gerantId,
      date,
      revenueCash:        Number(revenueCash),
      revenueOrangeMoney: Number(revenueOrangeMoney),
      revenueWave:        Number(revenueWave),
      sales:              cleanSales,
      debts:              finalDebts,
      reglementDebts:     cleanRegs,
      sortieCaisse:       cleanSortieCaisse,
      versementTataDiara: Number(versementTataDiara),
    });

    return NextResponse.json(
      {
        message: "Rapport créé avec succès !",
        success: true,
        error: false,
        data: newReport,
      },
      { status: 201 }
    );
  } catch (error) {
    // doublon envoyé en même temps (rejeté par l'index unique)
    if (error?.code === 11000) {
      return NextResponse.json(
        { message: DUPLICATE_MESSAGE, success: false, error: true },
        { status: 409 }
      );
    }
    console.error("Erreur lors de la création du rapport: ", error);
    return NextResponse.json(
      { message: "Erreur ! Veuillez réessayer.", success: false, error: true },
      { status: 500 }
    );
  }
});

export const GET = withRoles(["admin"], async (req) => {
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
                        sortieCaisseSum: { $sum: "$sortieCaisse.total" },
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

                        totalSortieCaisse: { $sum: "$sortieCaisseSum" },
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