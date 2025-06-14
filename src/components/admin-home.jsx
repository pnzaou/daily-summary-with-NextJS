import Link from "next/link";

const AdminHome = ({ reportData }) => {
  const { totals, dailyReport } = reportData || {};

  const periods = [
    { key: "day", label: "Aujourd'hui", totals: totals?.day || {} },
    { key: "month", label: "Ce mois", totals: totals?.month || {} },
    { key: "year", label: "Cette année", totals: totals?.year || {} },
  ];

  const formatDate = (isoString) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    //return date.toLocaleDateString()
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="mt-16 p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {periods.map(({ key, label, totals }) => {
          const incomingSum =
            (totals.totalCash || 0) +
            (totals.totalOM || 0) +
            (totals.totalWave || 0) +
            (totals.totalReglementDebts || 0);

          return (
            <div
              key={key}
              className="bg-white dark:bg-gray-800 shadow rounded-lg p-4"
            >
              <h3 className="text-lg font-semibold mb-2">{label}</h3>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Nombre de ventes:{" "}
                <span className="font-medium">
                  {totals.totalSalesCount ?? 0}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row justify-between mt-4 text-sm">
                <div className="text-left mb-2 sm:mb-0">
                  <div>En espèces: {totals.totalCash ?? 0}</div>
                  <div>Wave: {totals.totalWave ?? 0}</div>
                  <div>Orange Money: {totals.totalOM ?? 0}</div>
                  <div>Règlement dettes: {totals.totalReglementDebts ?? 0}</div>
                  <div className="mt-1 font-semibold">
                    Total entrées: {incomingSum}
                  </div>
                </div>
                <div className="text-right">
                  <div>
                    Total dettes:{" "}
                    <span className="font-medium">
                      {totals.totalDebts ?? 0}
                    </span>
                  </div>
                  <div>
                    Total versements Tata Diarra:{" "}
                    <span className="font-medium">
                      {totals.totalVersementTataDiara ?? 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                Date
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                Activité
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                Ventes
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                Total Cash
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {dailyReport.map((report) => (
              <tr
                key={report._id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                  {formatDate(report.date)}
                </td>
                <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                  {report.business?.name || "-"}
                </td>
                <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                  {report.sales?.length ?? 0}
                </td>
                <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                  {report.revenueCash ?? 0}
                </td>
                <td className="px-4 py-2">
                  <Link href={`dashboard/rapport/${report._id}`}>
                    <span className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                      Détails
                    </span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminHome;
