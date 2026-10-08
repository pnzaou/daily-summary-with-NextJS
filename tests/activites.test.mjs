// Gestion des activités (admin) : liste, création, modification, garde-fous et effet sur le tableau de bord.
// Appelle l'application lancée en local sur la base de TEST (voir app.test.mjs).
import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { seed } from "./seed.mjs";
import { api, assertServerUp, login } from "./helpers.mjs";

const ROLES = ["admin", "comptable", "gerant1"];
let ids;
const cookies = {};

// statuts de la même requête : anonyme, admin, comptable, gérant
const statuses = async (method, path, data) => {
  const result = [(await api(null, method, path, data)).status];
  for (const r of ROLES) result.push((await api(cookies[r], method, path, data)).status);
  return result;
};

before(async () => {
  await assertServerUp();
  ids = await seed();
  for (const r of ROLES) cookies[r] = await login(`${r}@test.local`);
});

describe("Liste des activités", () => {
  it("donne le type, le nombre de comptes et de rapports de chaque activité", async () => {
    const { body } = await api(cookies.admin, "GET", "/api/business");
    const q1 = body.data.find((b) => b.name === "Quincaillerie 1");
    assert.equal(q1.type, "quincaillerie");
    assert.equal(q1.usersCount, 2);   // gerant1 et le compte désactivé
    assert.equal(q1.reportsCount, 2); // aujourd'hui et hier
    assert.ok(q1.lastReportAt);
    assert.equal(body.data.find((b) => b.name === "Commission assurance").protectedName, true);
  });
});

describe("Création", () => {
  it("seule l'admin crée une activité", async () => {
    assert.deepEqual(
      await statuses("POST", "/api/business", { name: "Quincaillerie 3", type: "quincaillerie" }),
      [401, 201, 403, 403]
    );
  });

  it("un nom déjà pris est refusé, sans tenir compte des majuscules, accents ni espaces", async () => {
    for (const name of ["quincaillerie 1", "BOUCHÉRIE", "  Quincaillerie   1 "]) {
      const { status } = await api(cookies.admin, "POST", "/api/business", { name, type: "quincaillerie" });
      assert.equal(status, 409, name);
    }
  });

  it("un nom vide ou trop long, ou un type inconnu, est refusé", async () => {
    for (const data of [{ name: "  " }, { name: "x".repeat(61) }, { name: "Pharmacie", type: "pharmacie" }]) {
      const { status } = await api(cookies.admin, "POST", "/api/business", data);
      assert.equal(status, 400, JSON.stringify(data));
    }
  });
});

describe("Modification", () => {
  it("l'admin renomme une activité, et ses rapports suivent", async () => {
    const { status, body } = await api(cookies.admin, "PATCH", `/api/business/${ids.biz["Quincaillerie 1"]}`,
      { name: "Quincaillerie Centre" });
    assert.equal(status, 200);
    assert.equal(body.data.name, "Quincaillerie Centre");
    const report = await api(cookies.admin, "GET", `/api/daily-report/${ids.reports.g1Today}`);
    assert.equal(report.body.data.business.name, "Quincaillerie Centre");
  });

  it("« Commission assurance » ne peut pas être renommée, mais son type peut changer", async () => {
    const id = ids.biz["Commission assurance"];
    let r = await api(cookies.admin, "PATCH", `/api/business/${id}`, { name: "Assurances" });
    assert.equal(r.status, 400);
    assert.match(r.body.message, /ne peut pas être renommée/);
    r = await api(cookies.admin, "PATCH", `/api/business/${id}`, { type: null });
    assert.equal(r.status, 200);
  });

  it("un nom déjà pris par une autre activité est refusé", async () => {
    const { status } = await api(cookies.admin, "PATCH", `/api/business/${ids.biz["Quincaillerie 2"]}`, { name: "boucherie" });
    assert.equal(status, 409);
  });

  it("seule l'admin modifie une activité", async () => {
    assert.deepEqual(
      await statuses("PATCH", `/api/business/${ids.biz["Quincaillerie 2"]}`, { type: "quincaillerie" }),
      [401, 200, 403, 403]
    );
  });

  it("un identifiant invalide ou inconnu est refusé", async () => {
    assert.equal((await api(cookies.admin, "PATCH", "/api/business/abc", { type: null })).status, 400);
    assert.equal((await api(cookies.admin, "PATCH", "/api/business/0123456789abcdef01234567", { type: null })).status, 404);
  });

  it("changer le type déplace les rapports dans le tableau de bord", async () => {
    const id = ids.biz["Boucherie"];
    const boucherieDuJour = async () =>
      (await api(cookies.admin, "GET", "/api/dashboard-data")).body.data.drTotals.boucheries.day.totalCash;

    assert.equal((await api(cookies.admin, "PATCH", `/api/business/${id}`, { type: null })).status, 200);
    assert.equal(await boucherieDuJour(), 0);
    assert.equal((await api(cookies.admin, "PATCH", `/api/business/${id}`, { type: "boucherie" })).status, 200);
    assert.equal(await boucherieDuJour(), 12000);
  });
});

describe("Page", () => {
  it("la page Activités s'affiche pour l'admin", async () => {
    const { status, body } = await api(cookies.admin, "GET", "/dashboard/activites");
    assert.equal(status, 200);
    assert.match(body, /<h1[^>]*>Activités<\/h1>/);
  });

  it("le comptable et le gérant sont renvoyés vers leur tableau de bord", async () => {
    for (const r of ["comptable", "gerant1"]) {
      const { body } = await api(cookies[r], "GET", "/dashboard/activites");
      assert.match(body, /NEXT_REDIRECT;\w+;\/dashboard;/, r);
    }
  });
});
