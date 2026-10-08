// Règle des mots de passe, partagée par l'écran de connexion, les formulaires et l'API.
// (sans dépendance serveur : importable côté client)
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

export const PASSWORD_RULE_MESSAGE =
  "Au moins 8 caractères, dont une majuscule, une minuscule, un chiffre et un caractère spécial.";

// Mot de passe provisoire conforme à la règle, sans caractères ambigus (0/O, 1/l/I)
export function generatePassword(length = 12) {
  const sets = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnopqrstuvwxyz", "23456789", "!@#$%*-_"];
  const all = sets.join("");
  const random = (max) => crypto.getRandomValues(new Uint32Array(1))[0] % max;
  const chars = sets.map((set) => set[random(set.length)]);
  while (chars.length < length) chars.push(all[random(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = random(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}
