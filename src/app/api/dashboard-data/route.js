// pages/api/dashboard-data.js
import dbConnection from "@/lib/db";
import { withAuth } from "@/utils/withAuth";
import DailyReport from "@/models/DailyReport.Model";
import RapportCompta from "@/models/RapportCompta.Model";
import { NextResponse } from "next/server";
import Business from "@/models/Business.Model";

export const GET = withAuth(async (req) => {
  try {
    await dbConnection();

    // --- Helpers pour fallback sur RapportCompta ---

    // 1) dernier rapport qui a au moins une banque
    async function fetchLatestBanques() {
      const doc = await RapportCompta
        .findOne({ "banques.0": { $exists: true } })
        .sort({ date: -1 })
        .lean();
      return doc?.banques || [];
    }

    // 2) dernier rapport qui a un montant de caissePrincipale
    async function fetchLatestCaisseMontant() {
      const doc = await RapportCompta
        .findOne({ "caissePrincipale.montant": { $exists: true } })
        .sort({ date: -1 })
        .lean();
      return doc?.caissePrincipale?.montant ?? null;
    }

    // 3) dernier rapport qui contient une plateforme donnée
    async function fetchLatestPlateformeByName(nom) {
      const doc = await RapportCompta
        .findOne({ "plateformes.nom": nom })
        .sort({ date: -1 })
        .lean();
      return doc?.plateformes?.find(p => p.nom === nom) || null;
    }

    // Helper : somme des commissions ce mois-ci pour une plateforme
    async function aggregateCommissionMonthByName(nom) {
      const now       = new Date();
      const startMon  = new Date(now.getFullYear(), now.getMonth(), 1);
      const [{ total = 0 } = {}] = await RapportCompta.aggregate([
        { $match: { date: { $gte: startMon } } },
        { $unwind: "$plateformes" },
        { $match: { "plateformes.nom": nom, "plateformes.commission": { $exists: true } } },
        {
          $group: {
            _id: null,
            total: { $sum: "$plateformes.commission" }
          }
        }
      ]);
      return total;
    }

    // --- Helper pour Commission assurance sur le mois ---
    async function aggregateAssuranceCommission() {
      const now      = new Date();
      const startMon = new Date(now.getFullYear(), now.getMonth(), 1);
      const biz = await Business.findOne({ name: "Commission assurance" }).lean();
      if (!biz) return 0;
      const [{ total = 0 } = {}] = await RapportCompta.aggregate([
        { $match: { date: { $gte: startMon } } },
        { $unwind: "$caissePrincipale.entrees" },
        { $match: { "caissePrincipale.entrees.business": biz._id } },
        { $group: { _id: null, total: { $sum: "$caissePrincipale.entrees.montant" } } }
      ]);
      return total;
    }

    // --- bornes temporelles ---
    const now = new Date();
    const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startMon = new Date(now.getFullYear(), now.getMonth(), 1);
    const startYear = new Date(now.getFullYear(), 0, 1);

    // --- Helpers d’agrégation DailyReport ---
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

    // --- Helper entrée location depuis RapportCompta ---
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

    // --- Fusion locations = daily + compta ---
    async function aggregateLocations(from, names) {
      const dr = await aggregateFromDailyReport(from, names);
      const rcE = await aggregateFromRapportCompta(from, names);
      return { ...dr, totalCash: dr.totalCash + rcE };
    }

    // --- DailyReports bruts ---
    const dailyReports = await DailyReport.find({ gerant: { $exists: true } })
      .populate("business", "name")
      .sort({ date: -1 })
      .limit(5)
      .lean();

    // --- Dernier rapport compta brut ---
    const lastCompta = await RapportCompta.findOne().sort({ date: -1 }).lean();

    async function fetchLatestBanqueByName(nom) { 
      const doc = await RapportCompta
        .findOne({ "banques.nom": nom })
        .sort({ date: -1 })
        .lean();
      return doc?.banques?.find(b => b.nom === nom) || null;
    }

    // 1) récupère **tous** les noms de banques
    const allBankNames = await RapportCompta.distinct("banques.nom");

    // 2) pour chaque nom, on applique la logique
    const banquesResolved = [];
    for (const name of allBankNames) {
      const found = lastCompta?.banques?.find(b => b.nom === name);
      if (found) {
        banquesResolved.push({ nom: name, montant: Number(found.montant) });
      } else {
        const fallback = await fetchLatestBanqueByName(name);
        if (fallback) {
          banquesResolved.push({ nom: name, montant: Number(fallback.montant) });
        }
      }
    }

    const banksCards = banquesResolved;

    // --- CAISSE PRINCIPALE : montant fallback si absent ---
    let caisseMontant = lastCompta?.caissePrincipale?.montant;
    if (caisseMontant == null) {
      caisseMontant = await fetchLatestCaisseMontant();
    }

    // --- PLATEFORMES : liste fixe et fallback par nom ---
    const platformNames = [
      "Wafacash",
      "Ria BIS",
      "Orange Money",
      "Free Money",
      "Wizall"
    ];
    const plateformes = await Promise.all(
      platformNames.map(async (nom) => {
        // on cherche d'abord dans le tout dernier rapport
        let p = lastCompta?.plateformes?.find(p => p.nom === nom);
        // si la plateforme n'existe pas dans le dernier rapport,
        // on la récupère via le fallback historique
        if (!p) {
          p = await fetchLatestPlateformeByName(nom);
        }
        if (!p) {
          // si aucune occurrence : on skip ce nom
          return null;
        }
        // commission = somme de toutes les commissions du mois en cours
        const commission = await aggregateCommissionMonthByName(nom);
        return {
          nom:           p.nom,
          commission,                // désormais toujours défini ou null
          fondDeCaisse: p.fondDeCaisse,
          uvDisponible: p.uvDisponible,
          rechargeUV:   p.rechargeUV,
          totalDepot:   p.totalDepot,
          totalRetrait: p.totalRetrait,
          disponibilites: p.disponibilites
        };
      })
    );
    const plateformesClean = plateformes.filter(Boolean);

    // --- Calcul des totaux DailyReport et CA global ---
    const quincailleries = ["Quincaillerie 1", "Quincaillerie 2"];
    const locations      = ["Appartement F4", "Appartement F3", "Mazda", "Sontafe Rouge", "Sontafe Bleu"];

    const drTotals = {
      plain: {
        day:   await aggregateFromDailyReport(startDay, quincailleries.concat(locations)),
        month: await aggregateFromDailyReport(startMon,  quincailleries.concat(locations)),
        year:  await aggregateFromDailyReport(startYear, quincailleries.concat(locations)),
      },
      quincailleries: {
        day:   await aggregateFromDailyReport(startDay, quincailleries),
        month: await aggregateFromDailyReport(startMon, quincailleries),
        year:  await aggregateFromDailyReport(startYear, quincailleries),
      },
      locations: {
        day:   await aggregateLocations(startDay, locations),
        month: await aggregateLocations(startMon,  locations),
        year:  await aggregateLocations(startYear, locations),
      },
    };

    const caGlobal = {};
    for (const period of ["day", "month", "year"]) {
      const dr = drTotals.plain[period];
      const caGerants =
        dr.totalCash + dr.totalOM + dr.totalWave + dr.totalRegDebts;

      const start =
        period === "day" ? startDay :
        period === "month" ? startMon :
        startYear;

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

    const commissions_assurance = await aggregateAssuranceCommission();

    // --- Réponse finale ---
    return NextResponse.json(
      {
        success: true,
        error: false,
        data: {
          dailyReports,
          banksCards,
          drTotals,
          caGlobal,
          commissions_assurance,
          lastCompta: {
            _id: lastCompta?._id,
            date: lastCompta?.date,
            caissePrincipale: { montant: caisseMontant },
            banques: banksCards,
            plateformes: plateformesClean,
          },
        },
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
