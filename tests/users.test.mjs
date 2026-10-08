// Gestion des utilisateurs : droits, garde-fous, sessions et mots de passe.
// Appelle l'application lancée en local sur la base de TEST (voir app.test.mjs).
import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { seed } from "./seed.mjs";
import { api, assertServerUp, login, session } from "./helpers.mjs";

const ROLES = ["admin", "comptable", "gerant1"];
const PROVISOIRE = "Provisoire-123";
let ids;
const cookies = {};

const newGerant = (email) => ({
  nom: "Diallo", prenom: "Awa", email, password: PROVISOIRE, role: "gerant",
  businesses: [ids.biz["Quincaillerie 1"]],
});

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

describe("Accès à la gestion des utilisateurs", () => {
  it("la liste des comptes est réservée à l'admin et au comptable", async () => {
    assert.deepEqual(await statuses("GET", "/api/users"), [401, 200, 200, 403]);
  });

  it("la liste ne contient jamais de mot de passe", async () => {
    const { body } = await api(cookies.admin, "GET", "/api/users");
    assert.ok(body.data.users.length >= 7);
    assert.ok(body.data.users.every((u) => !("password" in u)));
  });

  it("les comptes sans champ « actif » sont considérés comme actifs", async () => {
    const { body } = await api(cookies.admin, "GET", "/api/users");
    const byEmail = Object.fromEntries(body.data.users.map((u) => [u.email, u]));
    assert.equal(byEmail["gerant1@test.local"].actif, true);
    assert.equal(byEmail["inactif@test.local"].actif, false);
  });

  it("le comptable ne peut gérer que les gérants", async () => {
    const { body } = await api(cookies.comptable, "GET", "/api/users");
    assert.deepEqual(body.data.assignableRoles, ["gerant"]);
    for (const u of body.data.users) assert.equal(u.modifiable, u.role === "gerant", u.email);
  });

  it("la liste des activités est réservée à l'admin et au comptable", async () => {
    assert.deepEqual(await statuses("GET", "/api/business"), [401, 200, 200, 403]);
  });

  it("l'ancienne route /api/auth/register ne crée plus de compte", async () => {
    const { status } = await api(cookies.admin, "POST", "/api/auth/register",
      { nom: "X", prenom: "Y", email: "register@test.local", password: PROVISOIRE, role: "admin" });
    assert.notEqual(status, 201);
    assert.deepEqual(await session(await login("register@test.local", PROVISOIRE)), {});
  });
});

describe("Création de compte", () => {
  it("le comptable crée un gérant, avec un mot de passe provisoire", async () => {
    const { status, body } = await api(cookies.comptable, "POST", "/api/users", newGerant("awa@test.local"));
    assert.equal(status, 201);
    assert.equal(body.data.role, "gerant");
    assert.equal(body.data.mustChangePassword, true);
    assert.deepEqual(body.data.businesses.map((b) => b.name), ["Quincaillerie 1"]);
    ids.awa = body.data._id;
  });

  it("le nouveau gérant se connecte et doit changer son mot de passe", async () => {
    cookies.awa = await login("awa@test.local", PROVISOIRE);
    const s = await session(cookies.awa);
    assert.equal(s.user.role, "gerant");
    assert.equal(s.user.mustChangePassword, true);
  });

  it("son tableau de bord le renvoie vers « Mon compte »", async () => {
    const { body } = await api(cookies.awa, "GET", "/dashboard");
    assert.match(body, /NEXT_REDIRECT;\w+;\/dashboard\/mon-compte;/);
  });

  it("le comptable ne crée ni comptable ni admin", async () => {
    for (const role of ["comptable", "admin"]) {
      const { status } = await api(cookies.comptable, "POST", "/api/users",
        { ...newGerant(`${role}-par-comptable@test.local`), role });
      assert.equal(status, 403, role);
    }
  });

  it("l'admin crée un comptable", async () => {
    const { status, body } = await api(cookies.admin, "POST", "/api/users",
      { ...newGerant("nouveau-comptable@test.local"), role: "comptable" });
    assert.equal(status, 201);
    assert.equal(body.data.role, "comptable");
  });

  it("un email déjà utilisé est refusé (sans tenir compte des majuscules)", async () => {
    const { status } = await api(cookies.admin, "POST", "/api/users", newGerant("AWA@test.local"));
    assert.equal(status, 409);
  });

  it("les champs invalides sont refusés avec un message", async () => {
    const cases = [
      [{ email: "pas-un-email" }, /email invalide/],
      [{ password: "court" }, /Mot de passe trop faible/],
      [{ password: "sansmajuscule1!" }, /Mot de passe trop faible/],
      [{ businesses: ["0123456789abcdef01234567"] }, /Activité introuvable/],
      [{ nom: "  " }, /« nom » est obligatoire/],
    ];
    for (const [override, message] of cases) {
      const { status, body } = await api(cookies.admin, "POST", "/api/users",
        { ...newGerant("invalide@test.local"), ...override });
      assert.equal(status, 400, JSON.stringify(override));
      assert.match(body.message, message);
    }
  });

  it("un gérant ne crée pas de compte", async () => {
    const { status } = await api(cookies.gerant1, "POST", "/api/users", newGerant("par-gerant@test.local"));
    assert.equal(status, 403);
  });
});

describe("Modification de compte", () => {
  it("le comptable change les activités d'un gérant", async () => {
    const { status, body } = await api(cookies.comptable, "PATCH", `/api/users/${ids.awa}`,
      { businesses: [ids.biz["Quincaillerie 2"]] });
    assert.equal(status, 200);
    assert.deepEqual(body.data.businesses.map((b) => b.name), ["Quincaillerie 2"]);
  });

  it("le comptable ne modifie ni un admin ni un comptable", async () => {
    for (const id of [ids.users.admin2, ids.users.comptable]) {
      const { status } = await api(cookies.comptable, "PATCH", `/api/users/${id}`, { prenom: "Pirate" });
      assert.equal(status, 403);
    }
  });

  it("le comptable ne promeut pas un gérant", async () => {
    const { status } = await api(cookies.comptable, "PATCH", `/api/users/${ids.awa}`, { role: "admin" });
    assert.equal(status, 403);
  });

  it("personne ne change son propre rôle ni ne se désactive", async () => {
    let r = await api(cookies.admin, "PATCH", `/api/users/${ids.users.admin}`, { role: "gerant" });
    assert.equal(r.status, 400);
    r = await api(cookies.admin, "PATCH", `/api/users/${ids.users.admin}`, { actif: false });
    assert.equal(r.status, 400);
  });

  it("l'admin modifie un autre admin", async () => {
    const { status, body } = await api(cookies.admin, "PATCH", `/api/users/${ids.users.admin2}`, { prenom: "Admin bis" });
    assert.equal(status, 200);
    assert.equal(body.data.prenom, "Admin bis");
  });

  it("un changement de rôle s'applique sans reconnexion", async () => {
    let r = await api(cookies.admin, "PATCH", `/api/users/${ids.awa}`, { role: "comptable" });
    assert.equal(r.status, 200);
    assert.equal((await session(cookies.awa)).user.role, "comptable");
    r = await api(cookies.admin, "PATCH", `/api/users/${ids.awa}`, { role: "gerant" });
    assert.equal(r.status, 200);
    assert.equal((await session(cookies.awa)).user.role, "gerant");
  });
});

describe("Désactivation", () => {
  it("un compte désactivé perd sa session immédiatement", async () => {
    const { status, body } = await api(cookies.comptable, "PATCH", `/api/users/${ids.awa}`, { actif: false });
    assert.equal(status, 200);
    assert.equal(body.data.actif, false);
    assert.deepEqual(await session(cookies.awa), {});
    assert.equal((await api(cookies.awa, "GET", "/api/debts")).status, 401);
  });

  it("et ne peut plus se connecter", async () => {
    assert.deepEqual(await session(await login("awa@test.local", PROVISOIRE)), {});
  });

  it("un compte réactivé peut se reconnecter", async () => {
    const { status } = await api(cookies.comptable, "PATCH", `/api/users/${ids.awa}`, { actif: true });
    assert.equal(status, 200);
    cookies.awa = await login("awa@test.local", PROVISOIRE);
    assert.equal((await session(cookies.awa)).user.role, "gerant");
  });

  it("le compte désactivé du jeu de données ne peut pas se connecter", async () => {
    assert.deepEqual(await session(await login("inactif@test.local")), {});
  });
});

describe("Mots de passe", () => {
  const NOUVEAU = "Nouveau-456";
  const FINAL = "Final-7890";

  it("l'admin ne réinitialise pas son propre mot de passe depuis la gestion", async () => {
    const { status } = await api(cookies.admin, "POST", `/api/users/${ids.users.admin}/password`, { password: NOUVEAU });
    assert.equal(status, 400);
  });

  it("le comptable ne réinitialise pas celui d'un admin", async () => {
    const { status } = await api(cookies.comptable, "POST", `/api/users/${ids.users.admin2}/password`, { password: NOUVEAU });
    assert.equal(status, 403);
  });

  it("un mot de passe provisoire trop faible est refusé", async () => {
    const { status } = await api(cookies.comptable, "POST", `/api/users/${ids.users.gerant2}/password`, { password: "faible" });
    assert.equal(status, 400);
  });

  it("le comptable réinitialise le mot de passe d'un gérant", async () => {
    const { status } = await api(cookies.comptable, "POST", `/api/users/${ids.users.gerant2}/password`, { password: NOUVEAU });
    assert.equal(status, 200);
    assert.deepEqual(await session(await login("gerant2@test.local")), {}, "l'ancien mot de passe ne marche plus");
    cookies.gerant2 = await login("gerant2@test.local", NOUVEAU);
    assert.equal((await session(cookies.gerant2)).user.mustChangePassword, true);
  });

  it("« Mon compte » refuse un mot de passe actuel incorrect", async () => {
    const { status, body } = await api(cookies.gerant2, "POST", "/api/me/password",
      { currentPassword: "pas-le-bon", newPassword: FINAL });
    assert.equal(status, 400);
    assert.match(body.message, /actuel incorrect/);
  });

  it("« Mon compte » refuse un nouveau mot de passe trop faible ou identique", async () => {
    let r = await api(cookies.gerant2, "POST", "/api/me/password", { currentPassword: NOUVEAU, newPassword: "faible" });
    assert.equal(r.status, 400);
    r = await api(cookies.gerant2, "POST", "/api/me/password", { currentPassword: NOUVEAU, newPassword: NOUVEAU });
    assert.equal(r.status, 400);
  });

  it("« Mon compte » change le mot de passe et lève l'obligation", async () => {
    const { status } = await api(cookies.gerant2, "POST", "/api/me/password",
      { currentPassword: NOUVEAU, newPassword: FINAL });
    assert.equal(status, 200);
    assert.equal((await session(cookies.gerant2)).user.mustChangePassword, false);
    assert.equal((await session(await login("gerant2@test.local", FINAL))).user.role, "gerant");
  });

  it("« Mon compte » exige d'être connecté", async () => {
    const { status } = await api(null, "POST", "/api/me/password", { currentPassword: "x", newPassword: FINAL });
    assert.equal(status, 401);
  });
});

describe("Pages", () => {
  it("la page Utilisateurs s'affiche pour l'admin et le comptable", async () => {
    for (const r of ["admin", "comptable"]) {
      const { status, body } = await api(cookies[r], "GET", "/dashboard/utilisateurs");
      assert.equal(status, 200, r);
      assert.match(body, /<h1[^>]*>Utilisateurs<\/h1>/, r);
    }
  });

  it("un gérant est renvoyé vers son tableau de bord", async () => {
    const { body } = await api(cookies.gerant1, "GET", "/dashboard/utilisateurs");
    assert.match(body, /NEXT_REDIRECT;\w+;\/dashboard;/);
  });

  it("la page « Mon compte » s'affiche pour tous les rôles", async () => {
    for (const r of ["admin", "comptable", "gerant1"]) {
      const { status, body } = await api(cookies[r], "GET", "/dashboard/mon-compte");
      assert.equal(status, 200, r);
      assert.match(body, /Mon compte/, r);
    }
  });
});
