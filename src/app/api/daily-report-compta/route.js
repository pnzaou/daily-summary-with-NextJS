import dbConnection from "@/lib/db";
import RapportCompta from "@/models/RapportCompta.Model";
import { withAuth } from "@/utils/withAuth";
import { NextResponse } from "next/server";

export const POST = withAuth(async (req) => {
    try {
        await dbConnection()
        const data = await req.json()
        
        const rapport = new RapportCompta({
            date: data.date || undefined,
            banques: data.banques,
            caissePrincipale: {
                montant: data.caissePrincipale.montant,
                entrees: data.caissePrincipale.entrees,
                sorties: data.caissePrincipale.sorties,
            },
            dettes: data.dettes,
            plateformes: data.plateformes.map((p) => ({
                nom: p.nom,
                fondDeCaisse: p.fondDeCaisse,
                uvDisponible: p.uvDisponible,
                rechargeUV: p.rechargeUV,
                totalDepot: p.totalDepot,
                totalRetrait: p.totalRetrait,
                commission: p.commission,
                disponibilites: p.disponibilites,
                dettes: p.dettes,
            }))
        });

        const saved = await rapport.save();

        return NextResponse.json({
            message: "Rapport du comptable ajouté avec succès!",
            success: true,
            error: false,
            data: saved
        }, { status: 201 })

    } catch (error) {
        console.log("Erreur pendant l'ajout du rapport du comptable", error)
        return NextResponse.json({
            message: "Erreur serveur!",
            success: false,
            error: true
        }, { status: 500 })
    }
})