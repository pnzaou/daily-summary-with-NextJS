// Compare, en LECTURE SEULE, les totaux du tableau de bord calculés de deux façons :
// - avec les listes de noms (src/lib/constants.js), comme aujourd'hui ;
// - avec le champ Business.type ("quincaillerie" / "location").
// Si tout est identique, le tableau de bord peut passer aux types sans changer aucun chiffre.
//
// Usage (PowerShell), avec l'URI de la base visée (entre apostrophes) :
//   $env:MONGODB_URI='mongodb+srv://...'; node scripts/compare-business-grouping.mjs
// L'avertissement MODULE_TYPELESS_PACKAGE_JSON affiché au démarrage (lecture de constants.js) est sans conséquence.
import mongoose from "mongoose";
import { QUINCAILLERIES, LOCATIONS, COMMISSION_ASSURANCE } from "../src/lib/constants.js";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Veuillez définir la variable d'environnement MONGODB_URI");
  process.exit(1);
}

await mongoose.connect(uri);
const db = mongoose.connection.db;
console.log(`Base : ${mongoose.connection.host} / ${db.databaseName}\n`);

// --- 1. Cohérence entre les listes de noms et les types ---
const businesses = await db.collection("businesses").find({}, { projection: { name: 1, type: 1 } }).toArray();
const listOf = (name) =>
  QUINCAILLERIES.includes(name) ? "quincaillerie"
  : LOCATIONS.includes(name) ? "location"
  : name === COMMISSION_ASSURANCE ? "commission"
  : null;

console.log("== Business : liste de noms / type en base");
let typeProblems = 0;
for (const b of businesses.sort((x, y) => x.name.localeCompare(y.name))) {
  const list = listOf(b.name);
  const type = b.type ?? null;
  let note = "ok";
  if ((list === "quincaillerie" || list === "location") && type !== list) note = `ÉCART : dans la liste ${list}, type ${type ?? "(vide)"}`;
  else if (!list && (type === "quincaillerie" || type === "location")) note = `ÉCART : type ${type}, absent des listes`;
  if (note !== "ok") typeProblems++;
  console.log(`  ${b.name.padEnd(26)} liste=${(list ?? "-").padEnd(14)} type=${(type ?? "(vide)").padEnd(14)} ${note}`);
}
const existing = new Set(businesses.map((b) => b.name));
for (const name of [...QUINCAILLERIES, ...LOCATIONS].filter((n) => !existing.has(n))) {
  console.log(`  ${name.padEnd(26)} présent dans les listes mais AUCUN business de ce nom en base`);
}

// --- 2. Totaux, mêmes calculs que /api/dashboard-data ---
const byNames = (names) => ({ "biz.name": { $in: names } });
const byType = (type) => ({ "biz.type": type });

async function dailyReportTotals(from, bizMatch) {
  const [res] = await db.collection("dailyreports").aggregate([
    { $match: { date: { $gte: from } } },
    { $lookup: { from: "businesses", localField: "business", foreignField: "_id", as: "biz" } },
    { $unwind: "$biz" },
    { $match: bizMatch },
    {
      $group: {
        _id: null,
        especes: { $sum: "$revenueCash" },
        om: { $sum: "$revenueOrangeMoney" },
        wave: { $sum: "$revenueWave" },
        versement: { $sum: "$versementTataDiara" },
        ventes: { $sum: { $size: { $ifNull: ["$sales", []] } } },
        dettes: { $sum: { $sum: "$debts.total" } },
        reglements: { $sum: { $sum: "$reglementDebts.total" } },
      },
    },
  ]).toArray();
  const { _id, ...totals } = res ?? { especes: 0, om: 0, wave: 0, versement: 0, ventes: 0, dettes: 0, reglements: 0 };
  return totals;
}

async function comptaEntreesTotal(from, bizMatch) {
  const [res] = await db.collection("rapportcomptas").aggregate([
    { $match: { date: { $gte: from } } },
    { $unwind: "$caissePrincipale.entrees" },
    { $lookup: { from: "businesses", localField: "caissePrincipale.entrees.business", foreignField: "_id", as: "biz" } },
    { $unwind: "$biz" },
    { $match: bizMatch },
    { $group: { _id: null, total: { $sum: "$caissePrincipale.entrees.montant" } } },
  ]).toArray();
  return res?.total ?? 0;
}

const now = new Date();
const periods = {
  "aujourd'hui": new Date(now.getFullYear(), now.getMonth(), now.getDate()),
  "ce mois": new Date(now.getFullYear(), now.getMonth(), 1),
  "cette année": new Date(now.getFullYear(), 0, 1),
  "depuis le début": new Date(0),
};

const groups = [
  ["Quincailleries (rapports)", (from) => dailyReportTotals(from, byNames(QUINCAILLERIES)),
    (from) => dailyReportTotals(from, byType("quincaillerie"))],
  ["Locations (rapports)", (from) => dailyReportTotals(from, byNames(LOCATIONS)),
    (from) => dailyReportTotals(from, byType("location"))],
  ["Locations (entrées compta)", async (from) => ({ entrees: await comptaEntreesTotal(from, byNames(LOCATIONS)) }),
    async (from) => ({ entrees: await comptaEntreesTotal(from, byType("location")) })],
  ["Quincailleries + locations", (from) => dailyReportTotals(from, byNames([...QUINCAILLERIES, ...LOCATIONS])),
    (from) => dailyReportTotals(from, { "biz.type": { $in: ["quincaillerie", "location"] } })],
];

const fmt = (n) => (Number(n) || 0).toLocaleString("fr-FR");
console.log("\n== Totaux du tableau de bord : par noms / par types");
let totalDiffs = 0;
for (const [label, withNames, withTypes] of groups) {
  for (const [period, from] of Object.entries(periods)) {
    const a = await withNames(from);
    const b = await withTypes(from);
    const diffs = Object.keys(a).filter((k) => a[k] !== b[k]);
    totalDiffs += diffs.length;
    const detail = diffs.length === 0
      ? "identiques"
      : "DIFFÉRENTS : " + diffs.map((k) => `${k} ${fmt(a[k])} / ${fmt(b[k])}`).join(", ");
    console.log(`  ${label.padEnd(28)} ${period.padEnd(16)} ${detail}`);
  }
}

// --- 3. Activités dont les rapports n'entrent dans aucun total (ni section, ni CA global) ---
const encaisse = { $add: [
  { $ifNull: ["$revenueCash", 0] }, { $ifNull: ["$revenueOrangeMoney", 0] }, { $ifNull: ["$revenueWave", 0] },
] };
const outside = await db.collection("dailyreports").aggregate([
  { $lookup: { from: "businesses", localField: "business", foreignField: "_id", as: "biz" } },
  { $unwind: "$biz" },
  { $match: { "biz.name": { $nin: [...QUINCAILLERIES, ...LOCATIONS] } } },
  {
    $group: {
      _id: "$biz.name",
      rapports: { $sum: 1 },
      dernier: { $max: "$date" },
      encaisseAnnee: { $sum: { $cond: [{ $gte: ["$date", periods["cette année"]] }, encaisse, 0] } },
      encaisseTotal: { $sum: encaisse },
    },
  },
  { $sort: { encaisseTotal: -1 } },
]).toArray();

console.log("\n== Rapports de gérants comptés nulle part dans le tableau de bord (ni section, ni CA global)");
if (outside.length === 0) console.log("  (aucun)");
for (const o of outside) {
  console.log(`  ${o._id.padEnd(26)} ${o.rapports} rapport(s), dernier le ${o.dernier?.toISOString().slice(0, 10)},`
    + ` encaissé cette année ${fmt(o.encaisseAnnee)}, depuis le début ${fmt(o.encaisseTotal)}`);
}

console.log(totalDiffs === 0 && typeProblems === 0
  ? "\nVerdict : passer aux types ne changerait aucun chiffre du tableau de bord."
  : `\nVerdict : ${typeProblems} écart(s) de type et ${totalDiffs} total(aux) différent(s). `
    + "Il faut d'abord corriger le type des business signalés.");

await mongoose.disconnect();
