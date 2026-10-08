import { NextResponse } from "next/server";
import dbConnection from "@/lib/db";
import { withRoles } from "@/utils/withRoles";
import Business from "@/models/Business.Model";
import User from "@/models/User.model";
import DailyReport from "@/models/DailyReport.Model";
import { isProtectedName, nameTaken, parseBusinessInput } from "@/lib/business-rules";

const fail = (message, status) =>
  NextResponse.json({ message, success: false, error: true }, { status });

// Liste des activités, avec le nombre de comptes rattachés et de rapports
// (gestion des utilisateurs et des activités)
export const GET = withRoles(["admin", "comptable"], async () => {
  try {
    await dbConnection();
    const [businesses, users, reports] = await Promise.all([
      Business.find({}, { name: 1, type: 1 }).sort({ name: 1 }).lean(),
      User.aggregate([
        { $unwind: "$businesses" },
        { $group: { _id: "$businesses", count: { $sum: 1 } } },
      ]),
      DailyReport.aggregate([
        { $group: { _id: "$business", count: { $sum: 1 }, last: { $max: "$date" } } },
      ]),
    ]);
    const usersById = new Map(users.map((u) => [String(u._id), u.count]));
    const reportsById = new Map(reports.map((r) => [String(r._id), r]));

    const data = businesses.map((b) => ({
      ...b,
      usersCount: usersById.get(String(b._id)) ?? 0,
      reportsCount: reportsById.get(String(b._id))?.count ?? 0,
      lastReportAt: reportsById.get(String(b._id))?.last ?? null,
      protectedName: isProtectedName(b.name),
    }));

    return NextResponse.json({ success: true, error: false, data }, { status: 200 });
  } catch (err) {
    console.error("Erreur liste business :", err);
    return fail("Erreur serveur, veuillez réessayer.", 500);
  }
});

// Création d'une activité (admin)
export const POST = withRoles(["admin"], async (req) => {
  try {
    await dbConnection();
    const { error, values } = parseBusinessInput(await req.json(), { creating: true });
    if (error) return fail(error, 400);

    if (await nameTaken(values.name)) {
      return fail("Une activité porte déjà ce nom.", 409);
    }

    const newBusiness = await Business.create(values);

    return NextResponse.json(
      {
        message: values.type
          ? "Activité créée."
          : "Activité créée sans type : elle n'apparaîtra dans aucune section du tableau de bord.",
        data: newBusiness,
        success: true,
        error: false,
      },
      { status: 201 }
    );
  } catch (err) {
    if (err?.code === 11000) return fail("Une activité porte déjà ce nom.", 409);
    console.error("Erreur création business :", err);
    return fail("Erreur serveur, veuillez réessayer.", 500);
  }
});
