// Tests de bout en bout : appellent l'application lancée en local sur la base de TEST.
// Terminal 1 : npm run dev — Terminal 2 : npm test
// Les tests s'exécutent dans l'ordre : lectures d'abord, écritures en dernier.
import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { seed } from "./seed.mjs";
import { api, assertServerUp, login, session } from "./helpers.mjs";

const ROLES = ["admin", "comptable", "gerant1", "gerant2"];
let ids;
const cookies = {};

// remplace :g1, :g2 et :compta par les identifiants du jeu de données
const resolve = (path) => path
  .replace(":g1", ids.reports.g1Today)
  .replace(":g2", ids.reports.g2Today)
  .replace(":compta", ids.comptaId);

before(async () => {
  await assertServerUp();
  ids = await seed();
  for (const r of ROLES) cookies[r] = await login(`${r}@test.local`);
});

describe("Connexion", () => {
  it("chaque compte obtient son rôle", async () => {
    const expected = { admin: "admin", comptable: "comptable", gerant1: "gerant", gerant2: "gerant" };
    for (const r of ROLES) {
      assert.equal((await session(cookies[r])).user?.role, expected[r], r);
    }
  });

  it("un mauvais mot de passe est refusé", async () => {
    const cookie = await login("admin@test.local", "mauvais-mot-de-passe");
    assert.deepEqual(await session(cookie), {});
  });
});

describe("Droits en lecture (anonyme, admin, comptable, gérant 1, gérant 2)", () => {
  const cases = [
    ["/api/daily-report", [401, 200, 403, 403, 403]],
    ["/api/daily-reports", [401, 200, 200, 403, 403]],
    ["/api/dashboard-data", [401, 200, 200, 403, 403]],
    ["/api/dettes", [401, 200, 200, 403, 403]],
    ["/api/locations-entries", [401, 200, 200, 403, 403]],
    ["/api/debts", [401, 200, 200, 200, 200]],
    ["/api/daily-report-compta/:compta", [401, 200, 200, 403, 403]],
    ["/api/daily-report/:g1", [401, 200, 200, 200, 403]],
    ["/api/daily-report/:g2", [401, 200, 200, 403, 200]],
  ];
  for (const [path, expected] of cases) {
    it(`GET ${path}`, async () => {
      const statuses = [(await api(null, "GET", resolve(path))).status];
      for (const r of ROLES) statuses.push((await api(cookies[r], "GET", resolve(path))).status);
      assert.deepEqual(statuses, expected);
    });
  }

  it("GET /api/daily-report-compta n'existe plus (405)", async () => {
    assert.equal((await api(cookies.comptable, "GET", "/api/daily-report-compta")).status, 405);
  });
});

describe("Tableau de bord", () => {
  it("compte les ventes et les versements du jour des quincailleries", async () => {
    const { body } = await api(cookies.admin, "GET", "/api/dashboard-data");
    const day = body.data.drTotals.quincailleries.day;
    assert.equal(day.totalSalesCount, 3);
    assert.equal(day.totalVersementTataDiara, 8000);
  });

  it("additionne les sorties de caisse du jour", async () => {
    const { body } = await api(cookies.admin, "GET", "/api/daily-report");
    assert.equal(body.data.totals.day.totalSortieCaisse, 2000);
  });

  it("un gérant ne voit que les dettes de sa quincaillerie", async () => {
    const { body } = await api(cookies.gerant1, "GET", "/api/debts?type=dette");
    assert.deepEqual(
      body.data.map((d) => `${d.business}:${d.numeroFacture}`),
      ["Quincaillerie 1:facture num 3"]
    );
  });
});

describe("Pages", () => {
  const pages = [
    ["admin", "/dashboard"],
    ["admin", "/dashboard/historique-dettes"],
    ["admin", "/dashboard/historique-locations"],
    ["admin", "/dashboard/compta/:compta"],
    ["admin", "/dashboard/rapport/:g1"],
    ["comptable", "/dashboard"],
    ["comptable", "/dashboard/dash-compta"],
    ["comptable", "/dashboard/liste-rapport-compta"],
    ["comptable", "/dashboard/liste-rapport-quincaillerie"],
    ["comptable", "/dashboard/gestion-dettes"],
    ["gerant1", "/dashboard"],
    ["gerant1", "/dashboard/liste-rapport-quincaillerie"],
    ["gerant1", "/dashboard/rapport-update/:g1"],
    ["gerant1", "/dashboard/gestion-dettes-quinc"],
  ];
  for (const [role, path] of pages) {
    it(`${role} : ${path}`, async () => {
      const { status, body } = await api(cookies[role], "GET", resolve(path));
      assert.equal(status, 200);
      assert.doesNotMatch(body, /Application error|Unhandled Runtime Error/);
    });
  }

  it("la page de connexion s'affiche avec le titre de l'application", async () => {
    const { status, body } = await api(null, "GET", "/");
    assert.equal(status, 200);
    assert.match(body, /<title>Daily Summary<\/title>/);
    assert.match(body, /<html lang="fr"/);
  });

  it("sans session, une page protégée redirige vers la connexion", async () => {
    const { body } = await api(null, "GET", "/dashboard/dash-compta");
    assert.match(body, /NEXT_REDIRECT/);
  });

  it("le tableau de bord admin affiche les totaux en FCFA", async () => {
    const { body } = await api(cookies.admin, "GET", "/dashboard");
    assert.match(body, /Total entrées: <!-- -->[0-9.]+ FCFA/);
  });
});

describe("Écritures", () => {
  it("un gérant ne modifie pas le rapport d'un autre gérant", async () => {
    const { status } = await api(cookies.gerant1, "PUT", resolve("/api/daily-report/:g2"), { revenueCash: 1 });
    assert.equal(status, 403);
  });

  it("le comptable ne modifie pas un rapport de gérant", async () => {
    const { status } = await api(cookies.comptable, "PUT", resolve("/api/daily-report/:g1"), { revenueCash: 1 });
    assert.equal(status, 403);
  });

  it("un gérant modifie son propre rapport", async () => {
    const { status, body } = await api(cookies.gerant1, "PUT", resolve("/api/daily-report/:g1"), { revenueCash: 100000 });
    assert.equal(status, 200);
    assert.equal(body.data.revenueCash, 100000);
  });

  it("la modification nettoie les lignes comme la création", async () => {
    const { status, body } = await api(cookies.gerant1, "PUT", resolve("/api/daily-report/:g1"), {
      sales: [
        { ref: " Facture num 1 ", description: " Ciment ", total: 60000 },
        { ref: "", description: "", total: null },             // ligne vide : retirée
        { ref: "facture num 5", description: "Sable", total: null }, // total vide : 0
      ],
    });
    assert.equal(status, 200);
    assert.deepEqual(
      body.data.sales.map(({ ref, description, total }) => ({ ref, description, total })),
      [
        { ref: "facture num 1", description: "Ciment", total: 60000 },
        { ref: "facture num 5", description: "Sable", total: 0 },
      ]
    );
  });

  it("un gérant ne règle pas la dette d'une autre quincaillerie", async () => {
    const { status } = await api(cookies.gerant1, "POST", "/api/debts/modify",
      { reportId: ids.reports.g2Today, ref: "facture num 9", action: "partial", amount: 1 });
    assert.equal(status, 403);
  });

  it("le comptable ne règle pas une dette de quincaillerie", async () => {
    const { status } = await api(cookies.comptable, "POST", "/api/debts/modify",
      { reportId: ids.reports.g1Today, ref: "facture num 3", action: "partial", amount: 1 });
    assert.equal(status, 403);
  });

  it("un gérant applique une avance sur sa propre dette", async () => {
    const { status, body } = await api(cookies.gerant1, "POST", "/api/debts/modify",
      { reportId: ids.reports.g1Today, ref: "facture num 3", action: "partial", amount: 1000 });
    assert.equal(status, 200);
    assert.equal(body.newTotal, 9000);
  });

  it("un gérant ne déclare pas pour l'activité d'un autre", async () => {
    const { status } = await api(cookies.gerant1, "POST", "/api/daily-report",
      { business: ids.biz["Quincaillerie 2"], revenueCash: 1 });
    assert.equal(status, 403);
  });

  it("un 2e rapport le même jour est refusé", async () => {
    const { status, body } = await api(cookies.gerant1, "POST", "/api/daily-report",
      { business: ids.biz["Quincaillerie 1"], revenueCash: 1 });
    assert.equal(status, 409);
    assert.match(body.message, /déjà été envoyé aujourd'hui/);
  });

  it("seul le comptable (ou l'admin) enregistre un rapport comptable", async () => {
    const data = { date: new Date().toISOString().slice(0, 10), caissePrincipale: { montant: 1 } };
    assert.equal((await api(cookies.gerant1, "POST", "/api/daily-report-compta", data)).status, 403);
    assert.equal((await api(cookies.comptable, "POST", "/api/daily-report-compta", data)).status, 201);
  });

  it("seul le comptable (ou l'admin) change le statut d'une dette comptable", async () => {
    const { body } = await api(cookies.comptable, "GET", "/api/dettes");
    const dette = body.data.find((d) => d.description === "Fournisseur X");
    const data = { rapportId: dette.rapportId, detteId: dette._id, type: "global" };

    assert.equal((await api(cookies.gerant1, "PATCH", "/api/dettes/toggle", data)).status, 403);
    assert.equal((await api(cookies.comptable, "PATCH", "/api/dettes/toggle", data)).body.newStatus, "payée");
    assert.equal((await api(cookies.comptable, "PATCH", "/api/dettes/toggle", data)).body.newStatus, "impayée");
  });
});
