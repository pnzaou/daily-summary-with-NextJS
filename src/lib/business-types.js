// Types d'activité regroupés sur le tableau de bord (sans dépendance serveur : importable côté client).
// Une activité sans type n'apparaît dans aucune section (ex. catégories du comptable : Autre, Versement bancaire).
export const BUSINESS_TYPES = ["location", "quincaillerie", "boucherie"];

export const BUSINESS_TYPE_LABELS = {
  quincaillerie: "Quincaillerie",
  boucherie: "Boucherie",
  location: "Location (appartement, véhicule)",
};
