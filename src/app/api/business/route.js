import { NextResponse } from "next/server";
import dbConnection from "@/lib/db";
import { withAuthAndRole } from "@/utils/withAuthAndRole";
import Business from "@/models/Business.Model";

export const POST = withAuthAndRole(async (req) => {
  try {
    await dbConnection();
    const { name } = await req.json();
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
    const newBusiness = await Business.create({ name: trimmed });

    return NextResponse.json(
      {
        message: "Business créé avec succès.",
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
