// Crée l'index unique « un rapport par gérant, activité et jour » sur dailyreports.
//
// Par défaut le script ne fait que LIRE : il liste les doublons existants.
// Avec --apply, il crée l'index, uniquement si aucun doublon n'existe.
//
// Usage (PowerShell), avec l'URI de la base visée :
//   $env:MONGODB_URI="mongodb+srv://..."; node scripts/create-daily-report-index.mjs
//   $env:MONGODB_URI="mongodb+srv://..."; node scripts/create-daily-report-index.mjs --apply
import mongoose from "mongoose";

const apply = process.argv.includes("--apply");
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
