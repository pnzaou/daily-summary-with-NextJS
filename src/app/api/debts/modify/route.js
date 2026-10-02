// app/api/debts/modify/route.js
import dbConnection from "@/lib/db";
import DailyReport from "@/models/DailyReport.Model";
import User from "@/models/User.model";
import { withRoles } from "@/utils/withRoles";
import { NextResponse } from "next/server";

export const POST = withRoles(["gerant", "admin"], async (req, context, session) => {
  try {
    await dbConnection();
    const body = await req.json();
    const { reportId, ref, action, amount, description } = body;

    if (!reportId || !ref || !action) {
      return NextResponse.json({ message: "reportId, ref et action sont requis." }, { status: 400 });
    }

    // récupère le rapport
    const report = await DailyReport.findById(reportId);
    if (!report) {
      return NextResponse.json({ message: "DailyReport introuvable." }, { status: 404 });
    }

    // un gérant ne règle que les dettes de ses propres quincailleries
    if (session.user.role === "gerant") {
      const user = await User.findById(session.user.id).select("businesses").lean();
      const isOwnBusiness = (user?.businesses || []).some((b) => b.toString() === report.business.toString());
      if (!isOwnBusiness) {
        return NextResponse.json({ message: "Cette dette n'appartient pas à votre quincaillerie.", error: true }, { status: 403 });
      }
    }

    // cherche la dette (par ref)
    const debtIndex = report.debts.findIndex(d => d.ref === ref);
    if (debtIndex === -1) {
      return NextResponse.json({ message: "Dette introuvable dans ce rapport." }, { status: 404 });
    }

    const debt = report.debts[debtIndex];

    if (action === "delete") {
      // suppression complète de la dette
      report.debts.splice(debtIndex, 1);
      await report.save();
      return NextResponse.json({ message: "Dette supprimée (réglée).", success: true }, { status: 200 });
    }

    if (action === "partial") {
      const pay = Number(amount);
      if (!pay || isNaN(pay) || pay <= 0) {
        return NextResponse.json({ message: "amount invalide (> 0)."}, { status: 400 });
      }

      // si paiement >= total => on retire la dette
      if (pay >= debt.total) {
        // remove debt
        report.debts.splice(debtIndex, 1);
        await report.save();
        return NextResponse.json({ message: "Dette complètement réglée et supprimée.", success: true }, { status: 200 });
      }

      // sinon on diminue le montant
      debt.total = Number((debt.total - pay).toFixed(2)); // arrondi si nécessaire

      // sauvegarde
      await report.save();
      return NextResponse.json({ message: "Avance appliquée, dette mise à jour.", success: true, newTotal: debt.total }, { status: 200 });
    }

    return NextResponse.json({ message: "Action inconnue." }, { status: 400 });

  } catch (error) {
    console.error("Erreur endpoint modify debt:", error);
    return NextResponse.json({ message: "Erreur serveur", error: true }, { status: 500 });
  }
});
