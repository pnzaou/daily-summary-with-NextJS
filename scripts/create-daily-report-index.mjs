// Crée l'index unique « un rapport par gérant, activité et jour » sur dailyreports.
//
// Par défaut le script ne fait que LIRE : il liste les doublons existants.
// Avec --details (lecture seule), il compare aussi le contenu de chaque doublon.
// Avec --apply, il crée l'index, uniquement si aucun doublon n'existe.
//
// Usage (PowerShell), avec l'URI de la base visée (entre apostrophes) :
//   $env:MONGODB_URI='mongodb+srv://...'; node scripts/create-daily-report-index.mjs
//   $env:MONGODB_URI='mongodb+srv://...'; node scripts/create-daily-report-index.mjs --details
//   $env:MONGODB_URI='mongodb+srv://...'; node scripts/create-daily-report-index.mjs --apply
import mongoose from "mongoose";

const apply = process.argv.includes("--apply");
const details = process.argv.includes("--details");

const sumTotals = (arr) => (arr || []).reduce((s, x) => s + (Number(x.total) || 0), 0);
const fmt = (n) => (Number(n) || 0).toLocaleString("fr-FR");

// Contenu métier d'un rapport, sans identifiants ni horodatages
const content = (r) => JSON.stringify({
  cash: r.revenueCash, om: r.revenueOrangeMoney, wave: r.revenueWave, versement: r.versementTataDiara,
  sales: (r.sales || []).map(({ ref, description, total }) => ({ ref, description, total })),
  debts: (r.debts || []).map(({ ref, description, total }) => ({ ref, description, total })),
  reglementDebts: (r.reglementDebts || []).map(({ ref, description, total }) => ({ ref, description, total })),
  sortieCaisse: (r.sortieCaisse || []).map(({ description, total }) => ({ description, total })),
});

const printDetails = async (collection, ids) => {
  const docs = await collection.find({ _id: { $in: ids } }).sort({ _id: 1 }).toArray();
  for (const r of docs) {
    console.log(`      ${r._id}  créé à ${r._id.getTimestamp().toISOString().slice(11, 16)} UTC`
      + `  espèces ${fmt(r.revenueCash)}  OM ${fmt(r.revenueOrangeMoney)}  Wave ${fmt(r.revenueWave)}`
      + `  versement ${fmt(r.versementTataDiara)}`);
    console.log(`        ventes ${r.sales?.length ?? 0} (${fmt(sumTotals(r.sales))})`
      + `  dettes ${r.debts?.length ?? 0} (${fmt(sumTotals(r.debts))})`
      + `  règlements ${r.reglementDebts?.length ?? 0} (${fmt(sumTotals(r.reglementDebts))})`
      + `  sorties ${fmt(sumTotals(r.sortieCaisse))}`);
  }
  const [first, second] = docs;
  if (docs.every((r) => content(r) === content(first))) {
    console.log("      => contenu identique (double envoi)");
  } else {
    const refs = (r) => new Set((r.sales || []).map((s) => s.ref));
    const a = refs(first);
    const b = refs(second);
    const common = [...a].filter((ref) => b.has(ref)).length;
    console.log(`      => contenu différent — ventes en commun : ${common},`
      + ` seulement dans le 1er : ${a.size - common}, seulement dans le 2e : ${b.size - common}`);
  }
  console.log();
};
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Veuillez définir la variable d'environnement MONGODB_URI");
  process.exit(1);
}

await mongoose.connect(uri);
const db = mongoose.connection.db;
const reports = db.collection("dailyreports");
console.log(`Base : ${mongoose.connection.host} / ${db.databaseName}`);

const duplicates = await reports.aggregate([
  {
    $group: {
      _id: { business: "$business", gerant: "$gerant", date: "$date" },
      count: { $sum: 1 },
      ids: { $push: "$_id" },
    },
  },
  { $match: { count: { $gt: 1 } } },
  {
    $lookup: { from: "businesses", localField: "_id.business", foreignField: "_id", as: "biz" },
  },
  {
    $lookup: { from: "users", localField: "_id.gerant", foreignField: "_id", as: "user" },
  },
  { $sort: { "_id.date": -1 } },
]).toArray();

if (duplicates.length > 0) {
  console.log(`\n${duplicates.length} doublon(s) trouvé(s) :`);
  for (const d of duplicates) {
    const day = d._id.date?.toISOString().slice(0, 10);
    const biz = d.biz[0]?.name ?? d._id.business;
    const user = d.user[0] ? `${d.user[0].prenom} ${d.user[0].nom}` : d._id.gerant;
    console.log(`  ${day}  ${biz}  ${user}  x${d.count}  ids: ${d.ids.join(", ")}`);
    if (details) await printDetails(reports, d.ids);
  }
  console.log("\nL'index ne peut pas être créé tant que ces doublons existent. Aucune modification faite.");
  await mongoose.disconnect();
  process.exit(apply ? 1 : 0);
}

console.log("\nAucun doublon.");

const existing = (await reports.indexes()).find((i) => i.name === "business_1_gerant_1_date_1");
if (existing) {
  console.log("L'index existe déjà, rien à faire.");
} else if (apply) {
  await reports.createIndex({ business: 1, gerant: 1, date: 1 }, { unique: true });
  console.log("Index unique business_1_gerant_1_date_1 créé.");
} else {
  console.log("Relancez avec --apply pour créer l'index.");
}

await mongoose.disconnect();
