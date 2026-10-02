const { default: dbConnection } = require("@/lib/db");
const { default: RapportCompta } = require("@/models/RapportCompta.Model");
const { withRoles } = require("@/utils/withRoles");
const { NextResponse } = require("next/server");

export const GET = withRoles(["comptable", "admin"], async (req) => {
  try {
    await dbConnection();

    const rapports = await RapportCompta.find({}).lean();

    const allDettes = [];
    rapports.forEach((rpt) => {
      // Dettes globales
      rpt.dettes.forEach((dette) => {
        allDettes.push({
          ...dette,
          rapportId: rpt._id,

          type: "global",
        });
      });

      //Dette par plateforme
      (rpt.plateformes || []).forEach((plt) => {
        (plt.dettes || []).forEach((dette) => {
          allDettes.push({
            ...dette,
            rapportId: rpt._id,
            plateforme: plt.nom,
            type: "plateforme de transfert",
          });
        });
      });
    });


    return NextResponse.json({
      success: true,
      error: false,
      data: allDettes,
    })
  } catch (error) {
    console.error('Erreur GET /api/dettes:', error);
    return NextResponse.json(
      { success: false, error: true, message: "Erreur" },
      { status: 500 }
    );
  }
});
