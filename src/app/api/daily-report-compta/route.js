import dbConnection from "@/lib/db";
import RapportCompta from "@/models/RapportCompta.Model";
import { withAuth } from "@/utils/withAuth";
import { NextResponse } from "next/server";

export const POST = withAuth(async (req) => {
  try {
    await dbConnection();
    const data = await req.json();

    // Nettoie un objet en supprimant clés undefined/null et tableaux vides
    function pickDefined(obj) {
      return Object.entries(obj).reduce((acc, [k, v]) => {
        if (v !== undefined && v !== null) {
          if (Array.isArray(v) && v.length === 0) return acc;
          acc[k] = v;
        }
        return acc;
      }, {});
    }

    const payload = { date: data.date };

    // Banques
    if (Array.isArray(data.banques) && data.banques.length > 0) {
      payload.banques = data.banques.map(pickDefined);
    }

    // Caisse Principale
    const cp = data.caissePrincipale || {};
    const hasMontant = cp.montant !== undefined && cp.montant !== null;
    const hasEntrees = Array.isArray(cp.entrees) && cp.entrees.length > 0;
    const hasSorties = Array.isArray(cp.sorties) && cp.sorties.length > 0;
    if (hasMontant || hasEntrees || hasSorties) {
      payload.caissePrincipale = {};
      if (hasMontant) payload.caissePrincipale.montant = cp.montant;
      if (hasEntrees) payload.caissePrincipale.entrees = cp.entrees.map(pickDefined);
      if (hasSorties) payload.caissePrincipale.sorties = cp.sorties.map(pickDefined);
    }

    // Dettes
    if (Array.isArray(data.dettes) && data.dettes.length > 0) {
      payload.dettes = data.dettes.map(pickDefined);
    }

    // Plateformes
    if (Array.isArray(data.plateformes) && data.plateformes.length > 0) {
      payload.plateformes = data.plateformes.map((p) => {
        const base = pickDefined({
          fondDeCaisse:   p.fondDeCaisse,
          uvDisponible:   p.uvDisponible,
          rechargeUV:     p.rechargeUV,
          totalDepot:     p.totalDepot,
          totalRetrait:   p.totalRetrait,
          commission:     p.commission,
          disponibilites: p.disponibilites,
        });
        const dettes = Array.isArray(p.dettes) && p.dettes.length > 0
          ? p.dettes.map(pickDefined)
          : undefined;
        return pickDefined({ nom: p.nom, ...base, dettes });
      }).filter(Boolean);
    }

    // Versement (ajout demandé)
    if (data.versement && typeof data.versement === "object") {
      const maybeVersement = pickDefined({
        method: data.versement.method,
        montant: data.versement.montant
      });
      if (Object.keys(maybeVersement).length > 0) {
        payload.versement = maybeVersement;
      }
    }

    // Création & sauvegarde
    const rapport = new RapportCompta(payload);
    const saved = await rapport.save();

    return NextResponse.json({
      message: "Rapport du comptable ajouté avec succès !",
      success: true,
      error: false,
      data: saved
    }, { status: 201 });

  } catch (error) {
    console.error("Erreur pendant l'ajout du rapport du comptable", error);
    return NextResponse.json({
      message: "Erreur serveur !",
      success: false,
      error: true
    }, { status: 500 });
  }
});
