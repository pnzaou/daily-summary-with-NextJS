import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnection from "@/lib/db";
import { withRoles } from "@/utils/withRoles";
import Business from "@/models/Business.Model";
import { isProtectedName, nameTaken, parseBusinessInput } from "@/lib/business-rules";

const fail = (message, status) =>
  NextResponse.json({ message, success: false, error: true }, { status });

// Modification d'une activité (admin) : nom et type.
// Les rapports, comptes et entrées de caisse la référencent par identifiant : un renommage ne casse rien,
// sauf pour « Commission assurance », que le tableau de bord retrouve par son nom.
export const PATCH = withRoles(["admin"], async (req, { params }) => {
  try {
    await dbConnection();
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return fail("Identifiant invalide.", 400);

    const business = await Business.findById(id);
    if (!business) return fail("Activité introuvable.", 404);

    const { error, values } = parseBusinessInput(await req.json(), { creating: false });
    if (error) return fail(error, 400);

    if (values.name !== undefined && values.name !== business.name) {
      if (isProtectedName(business.name)) {
        return fail(`« ${business.name} » est utilisée sous ce nom par le tableau de bord : elle ne peut pas être renommée.`, 400);
      }
      if (await nameTaken(values.name, business._id)) {
        return fail("Une activité porte déjà ce nom.", 409);
      }
    }

    Object.assign(business, values);
    await business.save();

    return NextResponse.json(
      { message: "Activité mise à jour.", data: business.toObject(), success: true, error: false },
      { status: 200 }
    );
  } catch (err) {
    if (err?.code === 11000) return fail("Une activité porte déjà ce nom.", 409);
    console.error("Erreur modification business :", err);
    return fail("Erreur serveur, veuillez réessayer.", 500);
  }
});
