import { NextResponse } from "next/server";
import dbConnection from "@/lib/db";
import { withAuthAndRole } from "@/utils/withAuthAndRole";
import { withRoles } from "@/utils/withRoles";
import Business, { BUSINESS_TYPES } from "@/models/Business.Model";

// Liste des activités, pour les rattacher à un compte (gestion des utilisateurs)
export const GET = withRoles(["admin", "comptable"], async () => {
  try {
    await dbConnection();
    const businesses = await Business.find({}, { name: 1, type: 1 }).sort({ name: 1 }).lean();
    return NextResponse.json(
      { success: true, error: false, data: businesses },
      { status: 200 }
    );
  } catch (err) {
    console.error("Erreur liste business :", err);
    return NextResponse.json(
      { message: "Erreur serveur, veuillez réessayer.", success: false, error: true },
      { status: 500 }
    );
  }
});

export const POST = withAuthAndRole(async (req) => {
  try {
    await dbConnection();
    const { name, type = null } = await req.json();
    if (!name || !name.trim()) {
      return NextResponse.json(
        {
          message: "Veuillez renseigner le nom du business.",
          success: false,
          error: true,
        },
        { status: 400 }
      );
    }

    if (type !== null && !BUSINESS_TYPES.includes(type)) {
      return NextResponse.json(
        {
          message: `Type invalide. Valeurs possibles : ${BUSINESS_TYPES.join(", ")} (ou aucun type).`,
          success: false,
          error: true,
        },
        { status: 400 }
      );
    }

    const trimmed = name.trim();

    const exists = await Business.findOne({ name: trimmed });
    if (exists) {
      return NextResponse.json(
        {
          message: "Ce business existe déjà.",
          success: false,
          error: true,
        },
        { status: 400 }
      );
    }

    // Création
    const newBusiness = await Business.create({ name: trimmed, type });

    return NextResponse.json(
      {
        message: type
          ? "Business créé avec succès."
          : "Business créé sans type : il n'apparaîtra dans aucune section du tableau de bord.",
        data: newBusiness,
        success: true,
        error: false,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Erreur création business :", err);
    return NextResponse.json(
      {
        message: "Erreur serveur, veuillez réessayer.",
        success: false,
        error: true,
      },
      { status: 500 }
    );
  }
});
