import authOptions from "@/lib/auth";
import dbConnection from "@/lib/db";
import { preparingServerSideRequest } from "@/utils/preparingServerRequest";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

const Page = async ({ params }) => {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  const { id } = await params;
  await dbConnection();

  let report = null;
  if (session.user?.role === "admin" || session.user?.role === "comptable") {
    const { cookie, host, protocol } = await preparingServerSideRequest();
    const res = await fetch(`${protocol}://${host}/api/daily-report/${id}`, {
      headers: { cookie },
    });
    console.log("res: ", res);
    const json = await res.json();
    report = json.data;
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
      return new Date(iso).toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "-";
    }
  };

  // Helpers pour grouper par numéro de facture
  const groupByInvoice = (arr) =>
    (arr || []).reduce((acc, item) => {
      const key = item.ref;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

  const groupedSales = groupByInvoice(report.sales);
  const groupedDebts = groupByInvoice(report.debts);
  const groupedReglements = groupByInvoice(report.reglementDebts);

  const totalRevenus =
    (report.revenueCash || 0) +
    (report.revenueWave || 0) +
    (report.revenueOrangeMoney || 0);
  const totalDettes = report.debts?.reduce((sum, d) => sum + d.total, 0) || 0;
  const totalReglements =
    report.reglementDebts?.reduce((sum, r) => sum + r.total, 0) || 0;

  return (
    <div className="mt-16 p-4 max-w-4xl mx-auto space-y-6">
      <Link href="/dashboard">
        <span className="text-blue-600 dark:text-blue-400 hover:underline">
          ← Retour
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

      {/* Résumé général & Revenus */}
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
            <div className="mt-4">
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Sortie de caisse
              </h3>

              {Array.isArray(report.sortieCaisse) ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {report.sortieCaisse.map((s) => (
                    <div
                      key={s._id}
                      className="flex flex-col justify-between bg-white dark:bg-gray-800 p-4 rounded-lg shadow transition-shadow"
                    >
                      <p className="text-gray-600 dark:text-gray-400">
                        {s.description}
                      </p>
                      <p className="mt-2 text-lg font-medium text-gray-800 dark:text-gray-100">
                        {s.total.toLocaleString()} FCFA
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-lg font-medium text-gray-800 dark:text-gray-100">
                  {report.sortieCaisse.toLocaleString()} FCFA
                </p>
              )}
            </div>

            <p>
              <span className="font-semibold">Versement Tata Diarra:</span>{" "}
              {report.versementTataDiara}
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
              {report.revenueCash}
            </p>
            <p>
              <span className="font-semibold">Wave:</span> {report.revenueWave}
            </p>
            <p>
              <span className="font-semibold">Orange Money:</span>{" "}
              {report.revenueOrangeMoney}
            </p>
            <p className="mt-2 font-semibold text-gray-800 dark:text-gray-100">
              Total Revenus: {totalRevenus}
            </p>
          </div>
        </div>
      </div>

      {/* Ventes groupées */}
      <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300">
          Ventes
        </h2>
        {Object.keys(groupedSales).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(groupedSales).map(([ref, items]) => (
              <div key={ref}>
                <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-100">
                  Réf: {ref} ({items.length} ligne{items.length > 1 ? "s" : ""})
                </h3>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400">
                  {items.map((i) => (
                    <li key={i._id} className="flex justify-between">
                      <span>{i.description}</span>
                      <span className="font-medium">{i.total}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">
            Aucune vente enregistrée.
          </p>
        )}
      </section>

      {/* Dettes & Règlements groupés */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300">
            Dettes ({report.debts.length})
          </h2>
          {Object.keys(groupedDebts).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(groupedDebts).map(([ref, items]) => (
                <div key={ref}>
                  <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-100">
                    Réf: {ref} ({items.length} ligne
                    {items.length > 1 ? "s" : ""})
                  </h3>
                  <ul className="list-disc list-inside text-gray-600 dark:text-gray-400">
                    {items.map((d) => (
                      <li key={d._id} className="flex justify-between">
                        <span>{d.description}</span>
                        <span className="font-medium">{d.total}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Aucune dette.</p>
          )}
          <p className="mt-4 font-semibold text-gray-800 dark:text-gray-100">
            Total Dettes: {totalDettes}
          </p>
        </section>
        <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300">
            Règlements de dettes ({report.reglementDebts.length})
          </h2>
          {Object.keys(groupedReglements).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(groupedReglements).map(([ref, items]) => (
                <div key={ref}>
                  <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-100">
                    Réf: {ref} ({items.length} ligne
                    {items.length > 1 ? "s" : ""})
                  </h3>
                  <ul className="list-disc list-inside text-gray-600 dark:text-gray-400">
                    {items.map((r) => (
                      <li key={r._id} className="flex justify-between">
                        <span>{r.description}</span>
                        <span className="font-medium">{r.total}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Aucun règlement.</p>
          )}
          <p className="mt-4 font-semibold text-gray-800 dark:text-gray-100">
            Total Règlements: {totalReglements}
          </p>
        </section>
      </div>
    </div>
  );
};

export default Page;
