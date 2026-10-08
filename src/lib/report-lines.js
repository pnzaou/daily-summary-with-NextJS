// Normalisation des lignes d'un rapport journalier, commune à la création et à la modification :
// textes nettoyés, référence en minuscules, total numérique, lignes vides retirées.

// Ventes, dettes et règlements : { ref, description, total }
export function cleanLines(arr) {
  return (Array.isArray(arr) ? arr : [])
    .map((item) => ({
      ref:         (item?.ref || "").trim().toLowerCase(),
      description: (item?.description || "").trim(),
      total:       Number(item?.total) || 0,
    }))
    .filter(
      ({ ref, description, total }) =>
        ref !== "" || description !== "" || total > 0
    );
}

const LINE_LABELS = {
  sales: "vente",
  debts: "dette",
  reglementDebts: "règlement",
  sortieCaisse: "sortie de caisse",
};

// Lignes déjà nettoyées → message lisible pour la première ligne incomplète, ou null.
// Le modèle exige une référence (sauf sorties de caisse) et une description sur chaque ligne.
export function findIncompleteLine(lines) {
  for (const [key, label] of Object.entries(LINE_LABELS)) {
    for (const line of lines[key] || []) {
      if (key !== "sortieCaisse" && !line.ref) {
        return `Ligne de ${label} « ${line.description || `${line.total} FCFA`} » sans référence : `
          + "indiquez « facture num … », « ticket num … » ou « reçu num … ».";
      }
      if (!line.description) {
        return `Ligne de ${label} « ${line.ref || `${line.total} FCFA`} » sans description.`;
      }
    }
  }
  return null;
}

// Sorties de caisse : { description, total }
export function cleanSortieLines(arr) {
  return (Array.isArray(arr) ? arr : [])
    .map((item) => ({
      description: (item?.description || "").trim(),
      total:       Number(item?.total) || 0,
    }))
    .filter(
      ({ description, total }) =>
        description !== "" || total > 0
    );
}
