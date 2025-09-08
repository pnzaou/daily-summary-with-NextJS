// pages/api/rapport-compta/[id].js
import RapportCompta from "@/models/RapportCompta.Model";
import Business from "@/models/Business.Model";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { withAuth } from "@/utils/withAuth";

export const GET = withAuth(async (req, { params }) => {
  try {
    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({
        error: true,
        success: false,
        message: "Veuillez renseigner un id valide"
      }, { status: 400 });
    }

    // 1) on récupère le rapport courant (sans populate, on fera manuellement)
    const rapport = await RapportCompta.findById(id).lean();
    if (!rapport) {
      return NextResponse.json({
        error: true,
        success: false,
        message: "Rapport introuvable"
      }, { status: 404 });
    }
    const baseDate = rapport.date;

    // 2) helper pour fallback
    async function fetchLast(filter) {
      return await RapportCompta
        .findOne({ date: { $lt: baseDate }, ...filter })
        .sort({ date: -1 })
        .lean();
    }

    // 3) BANQUES
    let banques = Array.isArray(rapport.banques) ? rapport.banques : [];
    if (banques.length === 0) {
      const doc = await fetchLast({ "banques.0": { $exists: true } });
      banques = doc?.banques || [];
    }

    // 4) CAISSE PRINCIPALE
    // 4a) montant
    let cpMontant = rapport.caissePrincipale?.montant;
    if (cpMontant == null) {
      const doc = await fetchLast({ "caissePrincipale.montant": { $exists: true } });
      cpMontant = doc?.caissePrincipale?.montant;
    }
    // 4b) entrees
    let cpEntreesRaw = rapport.caissePrincipale?.entrees;
    if (!Array.isArray(cpEntreesRaw) || cpEntreesRaw.length === 0) {
      const doc = await fetchLast({ "caissePrincipale.entrees.0": { $exists: true } });
      cpEntreesRaw = doc?.caissePrincipale?.entrees || [];
    }
    // 4c) sorties
    let cpSorties = rapport.caissePrincipale?.sorties;
    if (!Array.isArray(cpSorties) || cpSorties.length === 0) {
      const doc = await fetchLast({ "caissePrincipale.sorties.0": { $exists: true } });
      cpSorties = doc?.caissePrincipale?.sorties || [];
    }

    // 5) DETTES (niveau racine)
    let dettes = Array.isArray(rapport.dettes) ? rapport.dettes : [];
    if (dettes.length === 0) {
      const doc = await fetchLast({ "dettes.0": { $exists: true } });
      dettes = doc?.dettes || [];
    }

    // 6) PLATEFORMES (fallback par nom puis fallback complet)
    const PLATFORM_NAMES = ["Wafacash","Ria BIS","Orange Money","Free Money","Wizall"];
    const plateformesResults = await Promise.all(
      PLATFORM_NAMES.map(async (nom) => {
        const found = Array.isArray(rapport.plateformes)
          ? rapport.plateformes.find(p => p.nom === nom)
          : null;
        if (found) return found;
        const doc = await fetchLast({ "plateformes.nom": nom });
        return doc?.plateformes?.find(p => p.nom === nom) || null;
      })
    );
    let plateformes = plateformesResults.filter(Boolean);

    // si on n'a rien via la sélection par noms, on prend toute la liste du rapport courant
    if (plateformes.length === 0) {
      if (Array.isArray(rapport.plateformes) && rapport.plateformes.length > 0) {
        plateformes = rapport.plateformes;
      } else {
        const doc = await fetchLast({ "plateformes.0": { $exists: true } });
        plateformes = doc?.plateformes || [];
      }
    }

    // 7) On enrichit les entrées avec le nom du business (et on conserve l'_id si pas de name)
    const businessIds = (cpEntreesRaw || [])
      .map(e => e.business)
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => id.toString());
    const uniqueBizIds = [...new Set(businessIds)];

    const bizDocs = uniqueBizIds.length > 0
      ? await Business.find({ _id: { $in: uniqueBizIds } }, { name: 1 }).lean()
      : [];
    const nameById = bizDocs.reduce((acc, b) => {
      acc[b._id.toString()] = b.name;
      return acc;
    }, {});

    const cpEntrees = (cpEntreesRaw || []).map(e => {
      const bizId = e.business ? e.business.toString() : null;
      return {
        _id: e._id,
        business: bizId
          ? (nameById[bizId]
              ? { _id: e.business, name: nameById[bizId] } // id + name
              : { _id: e.business } // on conserve l'id si pas de name
            )
          : null,
        description: e.description,
        montant: e.montant
      };
    });

    // 8) VERSEMENT (ajouté)
    let versement = rapport.versement ?? null;
    if (!versement) {
      const doc = await fetchLast({ "versement.method": { $exists: true } });
      versement = doc?.versement || null;
    }

    // 9) On reconstruit la structure finale
    const complete = {
      ...rapport,
      banques,
      caissePrincipale: {
        montant: cpMontant,
        entrees: cpEntrees,
        sorties: cpSorties
      },
      dettes,
      plateformes,
      versement
    };

    return NextResponse.json({
      error: false,
      success: true,
      data: complete
    }, { status: 200 });

  } catch (error) {
    console.error("Erreur détail rapport comptable:", error);
    return NextResponse.json({
      error: true,
      success: false,
      message: "Erreur, veuillez réessayer."
    }, { status: 500 });
  }
});

