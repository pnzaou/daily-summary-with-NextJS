// Donne à chaque business des listes de src/lib/constants.js le type correspondant
// ("quincaillerie", "boucherie" ou "location"), utilisé par le tableau de bord pour les regrouper.
// Seuls les business présents dans ces listes sont concernés.
//
// Par défaut le script ne fait que LIRE et affiche les changements prévus.
// Avec --apply : sauvegarde des business concernés dans backups/, puis mise à jour.
//
// Usage (PowerShell), avec l'URI de la base visée (entre apostrophes) :
//   $env:MONGODB_URI='mongodb+srv://...'; node scripts/set-business-types.mjs
//   $env:MONGODB_URI='mongodb+srv://...'; node scripts/set-business-types.mjs --apply
// L'avertissement MODULE_TYPELESS_PACKAGE_JSON affiché au démarrage (lecture de constants.js) est sans conséquence.
import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import { QUINCAILLERIES, BOUCHERIES, LOCATIONS } from "../src/lib/constants.js";

const apply = process.argv.includes("--apply");
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Veuillez définir la variable d'environnement MONGODB_URI");
  process.exit(1);
}

await mongoose.connect(uri);
const db = mongoose.connection.db;
const collection = db.collection("businesses");
console.log(`Base : ${mongoose.connection.host} / ${db.databaseName}\n`);

const expectedType = new Map([
  ...QUINCAILLERIES.map((name) => [name, "quincaillerie"]),
  ...BOUCHERIES.map((name) => [name, "boucherie"]),
  ...LOCATIONS.map((name) => [name, "location"]),
]);

const businesses = await collection.find({ name: { $in: [...expectedType.keys()] } }).toArray();
const changes = businesses.filter((b) => b.type !== expectedType.get(b.name));

if (changes.length === 0) {
  console.log("Aucun changement : tous les business des listes ont déjà le bon type.");
  await mongoose.disconnect();
  process.exit(0);
}

console.log("Changements prévus :");
for (const b of changes) {
  console.log(`  ${b.name.padEnd(26)} type ${(b.type ?? "(vide)").padEnd(14)} -> ${expectedType.get(b.name)}`);
}

if (!apply) {
  console.log("\nAucune modification faite. Relancez avec --apply pour appliquer.");
  await mongoose.disconnect();
  process.exit(0);
}

// --- Sauvegarde avant modification ---
const backupDir = path.join(process.cwd(), "backups");
fs.mkdirSync(backupDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupFile = path.join(backupDir, `types-business-${db.databaseName}-${stamp}.json`);
fs.writeFileSync(backupFile, mongoose.mongo.BSON.EJSON.stringify(changes, null, 2, { relaxed: false }));
console.log(`\nSauvegarde : ${backupFile} (${changes.length} business)\n`);

// --- Mise à jour : seulement si le type n'a pas changé depuis la lecture ---
let failures = 0;
for (const b of changes) {
  const { modifiedCount } = await collection.updateOne(
    { _id: b._id, type: b.type ?? null },
    { $set: { type: expectedType.get(b.name), updatedAt: new Date() } }
  );
  if (modifiedCount !== 1) failures++;
  console.log(`${modifiedCount === 1 ? "OK    " : "ÉCHEC "} ${b.name} -> ${expectedType.get(b.name)}`);
}

console.log(failures === 0
  ? "\nTerminé. Relancez la comparaison : node scripts/compare-business-grouping.mjs"
  : `\n${failures} business non modifié(s) (type changé entre-temps ?). La sauvegarde ${backupFile} contient l'état d'origine.`);
await mongoose.disconnect();
process.exit(failures === 0 ? 0 : 1);
