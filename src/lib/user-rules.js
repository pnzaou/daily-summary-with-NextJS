// Règles de la gestion des utilisateurs, appliquées côté serveur par /api/users.
import mongoose from "mongoose";
import { PASSWORD_REGEX, PASSWORD_RULE_MESSAGE } from "@/lib/password-rule";

export const ROLES = ["gerant", "comptable", "admin"];

// L'admin gère tous les comptes ; le comptable ne gère que les gérants (les autres en lecture seule).
// Comme personne ne peut changer son propre rôle ni se désactiver, il reste toujours un admin actif.
export function manageableRoles(actorRole) {
  if (actorRole === "admin") return ROLES;
  if (actorRole === "comptable") return ["gerant"];
  return [];
}

export const canManage = (actorRole, targetRole) => manageableRoles(actorRole).includes(targetRole);

// Même règle que l'écran de connexion : sinon le mot de passe ne pourrait pas y être saisi
export function passwordError(password) {
  if (typeof password !== "string" || !PASSWORD_REGEX.test(password)) {
    return `Mot de passe trop faible. ${PASSWORD_RULE_MESSAGE}`;
  }
  return null;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LABELS = { nom: "nom", prenom: "prénom" };

// Valide et normalise les champs envoyés pour un compte.
// creating : nom, prénom, email, mot de passe et rôle sont obligatoires.
// Renvoie { error } ou { values } (uniquement les champs fournis).
export function parseUserInput(data, { creating }) {
  const values = {};

  for (const field of ["nom", "prenom"]) {
    if (creating || data[field] !== undefined) {
      const value = typeof data[field] === "string" ? data[field].trim() : "";
      if (!value) return { error: `Le champ « ${LABELS[field]} » est obligatoire.` };
      values[field] = value;
    }
  }

  if (creating || data.email !== undefined) {
    const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
    if (!EMAIL.test(email)) return { error: "Adresse email invalide." };
    values.email = email;
  }

  if (creating) {
    const error = passwordError(data.password);
    if (error) return { error };
    values.password = data.password;
  }

  if (creating || data.role !== undefined) {
    if (!ROLES.includes(data.role)) return { error: "Rôle invalide." };
    values.role = data.role;
  }

  if (data.businesses !== undefined) {
    const valid = Array.isArray(data.businesses)
      && data.businesses.every((id) => mongoose.Types.ObjectId.isValid(id));
    if (!valid) return { error: "Liste d'activités invalide." };
    values.businesses = [...new Set(data.businesses.map(String))];
  }

  if (!creating && data.actif !== undefined) {
    if (typeof data.actif !== "boolean") return { error: "Statut invalide." };
    values.actif = data.actif;
  }

  return { values };
}

// Compte tel que renvoyé par l'API : jamais le mot de passe.
// modifiable indique si l'utilisateur connecté (actorRole) peut le gérer.
export function publicUser(user, actorRole) {
  return {
    _id: String(user._id),
    nom: user.nom,
    prenom: user.prenom,
    email: user.email,
    role: user.role,
    actif: user.actif !== false,
    mustChangePassword: user.mustChangePassword === true,
    lastLoginAt: user.lastLoginAt ?? null,
    businesses: (user.businesses || []).map((b) =>
      b?.name ? { _id: String(b._id), name: b.name } : { _id: String(b) }),
    createdAt: user.createdAt,
    modifiable: canManage(actorRole, user.role),
  };
}
