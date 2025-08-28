import dbConnection from "@/lib/db";
import RapportCompta from "@/models/RapportCompta.Model";
import { withAuth } from "@/utils/withAuth";
import { NextResponse } from "next/server";

export const PATCH = withAuth(async (req) => {
  try {
    const { rapportId, detteId, type } = await req.json();
    await dbConnection();

    const rapport = await RapportCompta.findById(rapportId);
    if (!rapport) {
      return NextResponse.json(
        { success: false, message: "Rapport non trouvé" },
        { status: 404 }
      );
    }

    let subDoc;
    if (type === "global") {
      subDoc = rapport.dettes.id(detteId);
    } else if (type === "plateforme de transfert") {
      // trouver dans chaque plateforme
      for (const plt of rapport.plateformes) {
        const d = plt.dettes.id(detteId);
        if (d) {
          subDoc = d;
          break;
        }
      }
    }

    if (!subDoc) {
      return NextResponse.json(
        { success: false, message: "Dette non trouvée" },
        { status: 404 }
      );
    }

    // basculer le statut
    subDoc.status = subDoc.status === 'impayée' ? 'payée' : 'impayée';
    await rapport.save();

    return NextResponse.json({ success: true, newStatus: subDoc.status });

  } catch (error) {
    console.error("Erreur PATCH /api/dettes/toggle:", error);
    return NextResponse.json(
      { success: false, error: true, message: "Erreur" },
      { status: 500 }
    );
  }
});
