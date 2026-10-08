// Remet la base de TEST dans un état connu avant les tests.
// Refuse toute base dont le nom ne contient pas "test" : ne jamais pointer MONGODB_URI vers la production.
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export const TEST_PASSWORD = "Test1234!";

export async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  try {
    if (!/test/i.test(db.databaseName)) {
      throw new Error(`Refus : la base "${db.databaseName}" n'est pas une base de test`);
    }

    for (const c of ["users", "businesses", "dailyreports", "rapportcomptas"]) {
      await db.collection(c).deleteMany({});
    }

    const now = new Date();
    const id = () => new mongoose.Types.ObjectId();

    const biz = {};
    for (const [name, type] of [
      ["Quincaillerie 1", "quincaillerie"],
      ["Quincaillerie 2", "quincaillerie"],
      ["Boucherie", "boucherie"],
      ["Appartement F4", "location"],
      ["Mazda", "location"],
      ["Commission assurance", null],
    ]) {
      const { insertedId } = await db.collection("businesses").insertOne({ name, type, createdAt: now, updatedAt: now });
      biz[name] = insertedId;
    }

    const password = await bcrypt.hash(TEST_PASSWORD, 10);
    // comme en production, les comptes n'ont pas les champs actif / mustChangePassword (absent = actif)
    const user = async (email, prenom, role, businesses, extra = {}) => {
      const { insertedId } = await db.collection("users").insertOne({
        nom: "Test", prenom, email, password, role, businesses, createdAt: now, updatedAt: now, ...extra,
      });
      return insertedId;
    };
    const users = {
      admin: await user("admin@test.local", "Admin", "admin", []),
      gerant1: await user("gerant1@test.local", "Gerant1", "gerant", [biz["Quincaillerie 1"]]),
      gerant2: await user("gerant2@test.local", "Gerant2", "gerant", [biz["Quincaillerie 2"]]),
      gerant3: await user("gerant3@test.local", "Gerant3", "gerant", [biz["Boucherie"]]),
      admin2: await user("admin2@test.local", "Admin2", "admin", []),
      inactif: await user("inactif@test.local", "Inactif", "gerant", [biz["Quincaillerie 1"]], { actif: false }),
      comptable: await user("comptable@test.local", "Comptable", "comptable",
        [biz["Appartement F4"], biz["Mazda"], biz["Commission assurance"]]),
    };

    // Même convention que l'API : minuit (heure locale) du jour
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

    const report = (business, gerant, date, extra) => ({
      _id: id(), business, gerant, date,
      revenueCash: 0, revenueOrangeMoney: 0, revenueWave: 0, versementTataDiara: 0,
      sales: [], debts: [], reglementDebts: [], sortieCaisse: [],
      createdAt: now, updatedAt: now, ...extra,
    });
    const reports = {
      g1Today: report(biz["Quincaillerie 1"], users.gerant1, today, {
        revenueCash: 100000, revenueOrangeMoney: 20000, revenueWave: 30000, versementTataDiara: 5000,
        sales: [
          { _id: id(), ref: "facture num 1", description: "Ciment", total: 60000 },
          { _id: id(), ref: "facture num 2", description: "Fer", total: 90000 },
        ],
        debts: [{ _id: id(), ref: "facture num 3", description: "Client A", total: 10000 }],
        sortieCaisse: [{ _id: id(), description: "Transport", total: 2000 }],
      }),
      g2Today: report(biz["Quincaillerie 2"], users.gerant2, today, {
        revenueCash: 50000, versementTataDiara: 3000,
        sales: [{ _id: id(), ref: "ticket num 7", description: "Peinture", total: 50000 }],
        debts: [{ _id: id(), ref: "facture num 9", description: "Client B", total: 25000 }],
      }),
      boucherieToday: report(biz["Boucherie"], users.gerant3, today, {
        revenueCash: 12000, revenueWave: 3000, versementTataDiara: 1000,
        sales: [
          { _id: id(), ref: "ticket num 11", description: "Viande", total: 7000 },
          { _id: id(), ref: "ticket num 12", description: "Volaille", total: 8000 },
        ],
      }),
      g1Yesterday: report(biz["Quincaillerie 1"], users.gerant1, yesterday, {
        revenueCash: 40000,
        sales: [{ _id: id(), ref: "reçu num 4", description: "Clous", total: 40000 }],
      }),
    };
    await db.collection("dailyreports").insertMany(Object.values(reports));

    const comptaId = id();
    await db.collection("rapportcomptas").insertOne({
      _id: comptaId,
      date: now,
      banques: [{ _id: id(), nom: "CBAO", montant: "1000000" }],
      caissePrincipale: {
        montant: 200000,
        entrees: [{ _id: id(), business: biz["Appartement F4"], description: "Loyer", montant: 150000 }],
        sorties: [],
      },
      plateformes: [{
        _id: id(), nom: "Wafacash", fondDeCaisse: 50000, uvDisponible: 10000, rechargeUV: 0,
        totalDepot: 30000, totalRetrait: 20000, commission: 1500, disponibilites: 60000, dettes: [],
      }],
      dettes: [{ _id: id(), description: "Fournisseur X", montant: 70000, status: "impayée" }],
    });

    const str = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, String(v._id ?? v)]));
    return { biz: str(biz), users: str(users), reports: str(reports), comptaId: String(comptaId) };
  } finally {
    await mongoose.disconnect();
  }
}
