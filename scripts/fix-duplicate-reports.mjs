// Corrige les doublons de rapports journaliers (même business, gérant et jour),
// préalable à la création de l'index unique (scripts/create-daily-report-index.mjs).
//
// Pour chaque groupe, le premier rapport envoyé est conservé, puis :
// - une copie identique (double envoi) est supprimée ;
// - un rapport différent (complément envoyé plus tard) est fusionné dans le premier
//   (montants additionnés, lignes ajoutées) puis supprimé : les totaux du tableau
//   de bord pour ce jour restent identiques.
//
// Par défaut le script ne fait que LIRE et affiche ce qu'il ferait.
// Avec --apply : sauvegarde des rapports concernés dans backups/, puis une
// transaction par groupe, puis vérification des totaux.
//
// Usage (PowerShell), avec l'URI de la base visée (entre apostrophes) :
//   $env:MONGODB_URI='mongodb+srv://...'; node scripts/fix-duplicate-reports.mjs
//   $env:MONGODB_URI='mongodb+srv://...'; node scripts/fix-duplicate-reports.mjs --apply
import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

const apply = process.argv.includes("--apply");
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Veuillez définir la variable d'environnement MONGODB_URI");
  process.exit(1);
}

const AMOUNTS = ["revenueCash", "revenueOrangeMoney", "revenueWave", "versementTataDiara"];
const LINES = ["sales", "debts", "reglementDebts", "sortieCaisse"];

const sumTotals = (arr) => (arr || []).reduce((s, x) => s + (Number(x.total) || 0), 0);
const fmt = (n) => (Number(n) || 0).toLocaleString("fr-FR");
const time = (r) => r._id.getTimestamp().toISOString().slice(11, 16);

// Contenu métier d'un rapport, sans identifiants ni horodatages
const content = (r) => JSON.stringify({
  cash: r.revenueCash, om: r.revenueOrangeMoney, wave: r.revenueWave, versement: r.versementTataDiara,
  sales: (r.sales || []).map(({ ref, description, total }) => ({ ref, description, total })),
  debts: (r.debts || []).map(({ ref, description, total }) => ({ ref, description, total })),
  reglementDebts: (r.reglementDebts || []).map(({ ref, description, total }) => ({ ref, description, total })),
  sortieCaisse: (r.sortieCaisse || []).map(({ description, total }) => ({ description, total })),
});

// Tout ce que le tableau de bord additionne : une fusion ne doit rien y changer
const dashboardTotals = (docs) => {
  const t = {};
  for (const f of AMOUNTS) t[f] = docs.reduce((s, r) => s + (Number(r[f]) || 0), 0);
  for (const f of LINES) {
    t[`${f}Count`] = docs.reduce((s, r) => s + (r[f]?.length || 0), 0);
    t[`${f}Total`] = docs.reduce((s, r) => s + sumTotals(r[f]), 0);
  }
  return t;
};

const summary = (r) =>
  `espèces ${fmt(r.revenueCash)}  OM ${fmt(r.revenueOrangeMoney)}  Wave ${fmt(r.revenueWave)}`
  + `  versement ${fmt(r.versementTataDiara)}  | ventes ${r.sales?.length ?? 0} (${fmt(sumTotals(r.sales))})`
  + `  dettes ${r.debts?.length ?? 0}  règlements ${r.reglementDebts?.length ?? 0} (${fmt(sumTotals(r.reglementDebts))})`
  + `  sorties ${fmt(sumTotals(r.sortieCaisse))}`;

await mongoose.connect(uri);
const db = mongoose.connection.db;
const reports = db.collection("dailyreports");
console.log(`Base : ${mongoose.connection.host} / ${db.databaseName}\n`);

const groups = await reports.aggregate([
  {
    $group: {
      _id: { business: "$business", gerant: "$gerant", date: "$date" },
      count: { $sum: 1 },
      ids: { $push: "$_id" },
    },
  },
  { $match: { count: { $gt: 1 } } },
  { $lookup: { from: "businesses", localField: "_id.business", foreignField: "_id", as: "biz" } },
  { $lookup: { from: "users", localField: "_id.gerant", foreignField: "_id", as: "user" } },
  { $sort: { "_id.date": -1 } },
]).toArray();

if (groups.length === 0) {
  console.log("Aucun doublon : rien à corriger.");
  await mongoose.disconnect();
  process.exit(0);
}

// --- Plan de correction ---
const plans = [];
for (const g of groups) {
  const docs = await reports.find({ _id: { $in: g.ids } }).sort({ _id: 1 }).toArray();
  const [keep, ...others] = docs;
  const seen = new Set([content(keep)]);
  const duplicates = [];
  const complements = [];
  for (const r of others) {
    if (seen.has(content(r))) {
      duplicates.push(r);
    } else {
      seen.add(content(r));
      complements.push(r);
    }
  }
  const kept = [keep, ...complements];
  const merged = {};
  for (const f of AMOUNTS) merged[f] = kept.reduce((s, r) => s + (Number(r[f]) || 0), 0);
  for (const f of LINES) merged[f] = kept.flatMap((r) => r[f] || []);

  const user = g.user[0] ? `${g.user[0].prenom} ${g.user[0].nom}` : g._id.gerant;
  plans.push({
    label: `${g._id.date?.toISOString().slice(0, 10)}  ${g.biz[0]?.name ?? g._id.business}  ${user}`,
    docs, keep, duplicates, complements, merged,
    expected: dashboardTotals(kept),
  });
}

for (const p of plans) {
  console.log(p.label);
  console.log(`  garder     ${p.keep._id}  créé à ${time(p.keep)}  ${summary(p.keep)}`);
  for (const r of p.complements) console.log(`  fusionner  ${r._id}  créé à ${time(r)}  ${summary(r)}`);
  for (const r of p.duplicates) console.log(`  supprimer  ${r._id}  créé à ${time(r)}  copie identique`);
  if (p.complements.length > 0) console.log(`  => résultat : ${summary(p.merged)}`);
  console.log();
}

const removedDuplicates = plans.flatMap((p) => p.duplicates);
const removedTotals = dashboardTotals(removedDuplicates);
console.log(`${plans.length} groupe(s) : ${plans.reduce((n, p) => n + p.complements.length, 0)} fusion(s),`
  + ` ${removedDuplicates.length} copie(s) identique(s) supprimée(s).`);
console.log("Totaux comptés deux fois et retirés du tableau de bord :"
  + ` espèces ${fmt(removedTotals.revenueCash)}, OM ${fmt(removedTotals.revenueOrangeMoney)},`
  + ` Wave ${fmt(removedTotals.revenueWave)}, versement ${fmt(removedTotals.versementTataDiara)},`
  + ` lignes de vente ${removedTotals.salesCount}.`);
console.log("Les fusions ne changent pas les totaux du tableau de bord.");

if (!apply) {
  console.log("\nAucune modification faite. Relancez avec --apply pour appliquer.");
  await mongoose.disconnect();
  process.exit(0);
}

// --- Sauvegarde avant modification ---
const backupDir = path.join(process.cwd(), "backups");
fs.mkdirSync(backupDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupFile = path.join(backupDir, `doublons-${db.databaseName}-${stamp}.json`);
const allDocs = plans.flatMap((p) => p.docs);
fs.writeFileSync(backupFile, mongoose.mongo.BSON.EJSON.stringify(allDocs, null, 2, { relaxed: false }));
console.log(`\nSauvegarde : ${backupFile} (${allDocs.length} rapports)\n`);

// --- Application, une transaction par groupe ---
let failures = 0;
const session = mongoose.connection.getClient().startSession();
try {
  for (const p of plans) {
    try {
      await session.withTransaction(async () => {
        // les rapports n'ont pas changé depuis la lecture ?
        const current = await reports.find({ _id: { $in: p.docs.map((r) => r._id) } }, { session }).toArray();
        const unchanged = current.length === p.docs.length && p.docs.every((r) => {
          const c = current.find((x) => x._id.equals(r._id));
          return c && content(c) === content(r);
        });
        if (!unchanged) throw new Error("rapport modifié entre-temps, groupe ignoré");

        if (p.complements.length > 0) {
          await reports.updateOne({ _id: p.keep._id }, { $set: { ...p.merged, updatedAt: new Date() } }, { session });
        }
        const toDelete = [...p.complements, ...p.duplicates].map((r) => r._id);
        await reports.deleteMany({ _id: { $in: toDelete } }, { session });
      });

      const after = await reports.find({
        business: p.keep.business, gerant: p.keep.gerant, date: p.keep.date,
      }).toArray();
      const ok = after.length === 1 && JSON.stringify(dashboardTotals(after)) === JSON.stringify(p.expected);
      if (!ok) failures++;
      console.log(`${ok ? "OK    " : "ÉCHEC "} ${p.label}`);
    } catch (error) {
      failures++;
      console.log(`ÉCHEC  ${p.label} : ${error.message}`);
    }
  }
} finally {
  await session.endSession();
}

console.log(failures === 0
  ? "\nTerminé. Vous pouvez maintenant créer l'index : node scripts/create-daily-report-index.mjs --apply"
  : `\n${failures} groupe(s) en échec. La sauvegarde ${backupFile} contient les rapports d'origine.`);
await mongoose.disconnect();
process.exit(failures === 0 ? 0 : 1);
