import authOptions from "@/lib/auth";
import dbConnection from "@/lib/db";
import { preparingServerSideRequest } from "@/utils/preparingServerRequest";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

const Page = async ({ params }) => {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/");
  }
  const { id } = await params;
  await dbConnection();

  let report = null;
  if (session?.user?.role === "admin") {
    const { cookie, host, protocol } = await preparingServerSideRequest();
    const res = await fetch(`${protocol}://${host}/api/daily-report/${id}`, {
      headers: {
        cookie,
      },
    });

    const json = await res.json();
    report = json.data || null;
  }

  if (!report) {
    return (
      <div className="mt-16 p-4 text-center text-gray-500 dark:text-gray-400">
        Rapport introuvable ou accès non autorisé.
      </div>
    );
  }

  const formatDate = (iso) => {
    try {
      const date = new Date(iso);
      return date.toLocaleString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "-";
    }
  };

  const totalRevenus =
    (report.revenueCash || 0) +
    (report.revenueWave || 0) +
    (report.revenueOrangeMoney || 0);
  const totalDettes =
    report.debts?.reduce((sum, d) => sum + (d.total || 0), 0) || 0;
  const totalReglements =
    report.reglementDebts?.reduce((sum, r) => sum + (r.total || 0), 0) || 0;

  return (
    <div className="mt-16 p-4 max-w-4xl mx-auto space-y-6">
      <Link href="/dashboard">
        <span className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
          ← Retour aux rapports
        </span>
      </Link>
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
          Détails du rapport
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Date : {formatDate(report.date)}
        </p>
      </header>

      {/* General Info & Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300">
            Informations générales
          </h2>
          <div className="space-y-2 text-gray-600 dark:text-gray-400">
            <p>
              <span className="font-semibold">Activité:</span>{" "}
              {report.business?.name || "-"}
            </p>
            <p>
              <span className="font-semibold">Sortie Caisse:</span>{" "}
              {report.sortieCaisse ?? 0}
            </p>
            <p>
              <span className="font-semibold">Versement Tata Diarra:</span>{" "}
              {report.versementTataDiara ?? 0}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300">
            Résumé des revenus
          </h2>
          <div className="space-y-2 text-gray-600 dark:text-gray-400">
            <p>
              <span className="font-semibold">Espèces:</span>{" "}
              {report.revenueCash ?? 0}
            </p>
            <p>
              <span className="font-semibold">Wave:</span>{" "}
              {report.revenueWave ?? 0}
            </p>
            <p>
              <span className="font-semibold">Orange Money:</span>{" "}
              {report.revenueOrangeMoney ?? 0}
            </p>
            <p className="mt-2 text-gray-800 dark:text-gray-100 font-semibold">
              Total Revenus: {totalRevenus}
            </p>
          </div>
        </div>
      </div>

      {/* Sales List */}
      <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300">
          Ventes ({report.sales?.length || 0})
        </h2>
        {report.sales?.length > 0 ? (
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            {report.sales.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">
            Aucune vente enregistrée.
          </p>
        )}
      </section>

      {/* Debts & Reglements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300">
            Dettes ({report.debts?.length || 0})
          </h2>
          {report.debts?.length > 0 ? (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-600 dark:text-gray-400">
              {report.debts.map((d) => (
                <li key={d._id} className="py-2 flex justify-between">
                  <span>{d.description}</span>
                  <span className="font-medium">{d.total}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Aucune dette.</p>
          )}
          <p className="mt-4 text-gray-800 dark:text-gray-100 font-semibold">
            Total Dettes: {totalDettes}
          </p>
        </section>
        <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300">
            Règlements de dettes ({report.reglementDebts?.length || 0})
          </h2>
          {report.reglementDebts?.length > 0 ? (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-600 dark:text-gray-400">
              {report.reglementDebts.map((r) => (
                <li key={r._id} className="py-2 flex justify-between">
                  <span>{r.description}</span>
                  <span className="font-medium">{r.total}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Aucun règlement.</p>
          )}
          <p className="mt-4 text-gray-800 dark:text-gray-100 font-semibold">
            Total Règlements: {totalReglements}
          </p>
        </section>
      </div>
    </div>
  );
};

export default Page;
