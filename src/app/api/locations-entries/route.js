// pages/api/location-entries.js
import dbConnection from "@/lib/db";
import { withAuth } from "@/utils/withAuth";
import RapportCompta from "@/models/RapportCompta.Model";
import { NextResponse } from "next/server";

export const GET = withAuth(async (req) => {
  try {
    await dbConnection();

    const historique = await RapportCompta.aggregate([
      { $unwind: "$caissePrincipale.entrees" },
      {
        $lookup: {
          from: "businesses",
          localField: "caissePrincipale.entrees.business",
          foreignField: "_id",
          as: "biz",
        },
      },
      { $unwind: "$biz" },
      { $match: { "biz.type": "location" } },
      {
        $project: {
          _id: 0,
          date: 1,
          business: "$biz.name",
          description: "$caissePrincipale.entrees.description",
          montant: "$caissePrincipale.entrees.montant",
        },
      },
      { $sort: { date: -1 } },
    ]);

    return NextResponse.json(
      { success: true, error: false, data: historique },
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, error: true, message: "Erreur lors de la récupération de l'historique" },
      { status: 500 }
    );
  }
});
