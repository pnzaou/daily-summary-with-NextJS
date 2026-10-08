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
