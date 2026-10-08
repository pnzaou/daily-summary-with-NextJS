// Règles de la gestion des activités (business), appliquées côté serveur par /api/business.
import Business from "@/models/Business.Model";
import { BUSINESS_TYPES } from "@/lib/business-types";
import { COMMISSION_ASSURANCE } from "@/lib/constants";

export const NAME_MAX_LENGTH = 60;

// Valide et normalise le nom et le type. creating : le nom est obligatoire.
// Renvoie { error } ou { values } (uniquement les champs fournis).
export function parseBusinessInput(data, { creating }) {
  const values = {};

  if (creating || data.name !== undefined) {
    const name = typeof data.name === "string" ? data.name.trim().replace(/\s+/g, " ") : "";
    if (!name) return { error: "Veuillez renseigner le nom de l'activité." };
    if (name.length > NAME_MAX_LENGTH) {
      return { error: `Le nom ne doit pas dépasser ${NAME_MAX_LENGTH} caractères.` };
    }
    values.name = name;
  }

  if (creating || data.type !== undefined) {
    const type = data.type === "" || data.type === undefined ? null : data.type;
    if (type !== null && !BUSINESS_TYPES.includes(type)) {
      return { error: `Type invalide. Valeurs possibles : ${BUSINESS_TYPES.join(", ")} (ou aucun type).` };
    }
    values.type = type;
  }

  return { values };
}

// Une autre activité porte-t-elle déjà ce nom ? (sans tenir compte des majuscules ni des accents)
export function nameTaken(name, exceptId) {
  const filter = exceptId ? { name, _id: { $ne: exceptId } } : { name };
  return Business.exists(filter).collation({ locale: "fr", strength: 1 });
}

// Le tableau de bord retrouve cette activité par son nom : la renommer casserait sa carte
export const isProtectedName = (name) => name === COMMISSION_ASSURANCE;
