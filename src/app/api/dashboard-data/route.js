// pages/api/dashboard-data.js
import dbConnection from "@/lib/db";
import DailyReport from "@/models/DailyReport.Model";
import RapportCompta from "@/models/RapportCompta.Model";
import { withAuthAndRole } from "@/utils/withAuthAndRole";
import { NextResponse } from "next/server";
import Business from "@/models/Business.Model";

export const GET = withAuthAndRole(async (req) => {
  try {
    await dbConnection();

    const now = new Date();
    const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startMon = new Date(now.getFullYear(), now.getMonth(), 1);
    const startYear = new Date(now.getFullYear(), 0, 1);

    // Helper: agrégation DailyReport selon business names
    async function aggregateFromDailyReport(from, names) {
      const pipeline = [
        { $match: { date: { $gte: from } } },
        {
          $lookup: {
            from: "businesses",
            localField: "business",
            foreignField: "_id",
            as: "biz",
          },
        },
        { $unwind: "$biz" },
        { $match: { "biz.name": { $in: names } } },
        {
          $project: {
            revenueCash: 1,
            revenueOrangeMoney: 1,
            revenueWave: 1,
            debtsSum: { $sum: "$debts.total" },
            regDebtsSum: { $sum: "$reglementDebts.total" },
          },
        },
        {
          $group: {
            _id: null,
            totalCash: { $sum: "$revenueCash" },
            totalOM: { $sum: "$revenueOrangeMoney" },
            totalWave: { $sum: "$revenueWave" },
            totalDebts: { $sum: "$debtsSum" },
            totalRegDebts: { $sum: "$regDebtsSum" },
          },
        },
      ];
      const [res] = await DailyReport.aggregate(pipeline);
      return (
        res || {
          totalCash: 0,
          totalOM: 0,
          totalWave: 0,
          totalDebts: 0,
          totalRegDebts: 0,
        }
      );
    }

    // Helper: agrégation entrées location depuis RapportCompta
    async function aggregateFromRapportCompta(from, names) {
      const pipeline = [
        { $match: { date: { $gte: from } } },
        { $unwind: "$caissePrincipale.entrees" },
        {
          $lookup: {
            from: "businesses",
            localField: "caissePrincipale.entrees.business",
            foreignField: "_id",
            as: "biz",
          },
        },
        { $unwind: "$biz" },
        { $match: { "biz.name": { $in: names } } },
        {
          $group: {
            _id: null,
            totalEntrees: { $sum: "$caissePrincipale.entrees.montant" },
          },
        },
      ];
      const [res] = await RapportCompta.aggregate(pipeline);
      return res?.totalEntrees || 0;
    }

    // Fusion locations = daily + compta
    async function aggregateLocations(from, names) {
      const dr = await aggregateFromDailyReport(from, names);
      const rcE = await aggregateFromRapportCompta(from, names);
      return { ...dr, totalCash: dr.totalCash + rcE };
    }

    // Récupération rapports gérants
    const dailyReports = await DailyReport.find({ date: { $gte: startDay } })
      .populate("business", "name")
      .lean();

    // Dernier rapport compta et cartes banques
    const lastCompta = await RapportCompta.findOne().sort({ date: -1 }).lean();
    const banksCards = (lastCompta?.banques || []).map((b) => ({
      nom: b.nom,
      montant: Number(b.montant),
    }));

    // Définition des groupes
    const quincailleries = ["Quincaillerie 1", "Quincaillerie 2"];
    const locations = ["Appartement F4", "Appartement F3", "Mazda", "Sontafe"];

    // Calcul totaux
    const drTotals = {
      plain: {
        day: await aggregateFromDailyReport(
          startDay,
          quincailleries.concat(locations)
        ),
        month: await aggregateFromDailyReport(
          startMon,
          quincailleries.concat(locations)
        ),
        year: await aggregateFromDailyReport(
          startYear,
          quincailleries.concat(locations)
        ),
      },
      quincailleries: {
        day: await aggregateFromDailyReport(startDay, quincailleries),
        month: await aggregateFromDailyReport(startMon, quincailleries),
        year: await aggregateFromDailyReport(startYear, quincailleries),
      },
      locations: {
        day: await aggregateLocations(startDay, locations),
        month: await aggregateLocations(startMon, locations),
        year: await aggregateLocations(startYear, locations),
      },
    };

    // Calcul CA global
    const caGlobal = {};
    for (const period of ["day", "month", "year"]) {
      const dr = drTotals.plain[period];
      const caGerants =
        dr.totalCash + dr.totalOM + dr.totalWave + dr.totalRegDebts;

      const start =
        period === "day" ? startDay : period === "month" ? startMon : startYear;
      const [{ totalCommission = 0 } = {}] = await RapportCompta.aggregate([
        { $match: { date: { $gte: start } } },
        { $unwind: "$plateformes" },
        {
          $group: {
            _id: null,
            totalCommission: { $sum: "$plateformes.commission" },
          },
        },
      ]);
      const [{ totalCaisse = 0 } = {}] = await RapportCompta.aggregate([
        { $match: { date: { $gte: start } } },
        { $unwind: "$caissePrincipale.entrees" },
        {
          $group: {
            _id: null,
            totalCaisse: { $sum: "$caissePrincipale.entrees.montant" },
          },
        },
      ]);

      caGlobal[period] = caGerants + totalCommission + totalCaisse;
    }

    return NextResponse.json(
      {
        success: true,
        error: false,
        data: { dailyReports, lastCompta, banksCards, drTotals, caGlobal },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, error: true, message: "Erreur" },
      { status: 500 }
    );
  }
});
