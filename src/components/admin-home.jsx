// components/AdminHome.jsx
import React from "react";
import Link from "next/link";
import { SquareArrowOutUpRight, SquareArrowOutUpRightIcon } from "lucide-react";

/**
 * AdminHome
 * Props:
 *   reportData: {
 *     dailyReports,
 *     banksCards,
 *     drTotals: { quincailleries, locations, plain },
 *     caGlobal: { day, month, year },
 *     lastCompta
 *   }
 */
export default function AdminHome({ reportData }) {
  const { dailyReports, banksCards, drTotals, caGlobal, lastCompta } = reportData;

  // Helper to format numbers with dots and append FCFA
  const formatMoney = (value) => {
    if (value == null) return "-";
    const str = value.toString();
    const withDots = str.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${withDots} FCFA`;
  };

  const formatDate = (iso) =>
    iso
      ? new Date(iso).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "-";

  const renderFullCards = (title, periodTotals) => {
    const periods = ["day", "month", "year"];
    const labels = { day: "Aujourd'hui", month: "Ce mois", year: "Cette année" };
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <h3 className="col-span-full text-xl font-semibold">{title}</h3>
        {periods.map((p) => {
          const t = periodTotals[p] || {};
          const incoming = (t.totalCash || 0) + (t.totalOM || 0) + (t.totalWave || 0);
          return (
            <div key={p} className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
              <div className="text-lg font-semibold mb-1">{labels[p]}</div>
              <div className="text-sm">Ventes: {t.totalSalesCount || 0}</div>
              <div className="text-sm">Espèces: {formatMoney(t.totalCash || 0)}</div>
              <div className="text-sm">Wave: {formatMoney(t.totalWave || 0)}</div>
              <div className="text-sm">Orange Money: {formatMoney(t.totalOM || 0)}</div>
              <div className="text-sm">Règlement dettes: {formatMoney(t.totalRegDebts || 0)}</div>
              <div className="font-semibold mt-1">Total entrées: {incoming}</div>
              <hr className="my-2" />
              <div className="text-sm">Dettes: {formatMoney(t.totalDebts || 0)}</div>
              <div className="text-sm">Versements Tata: {formatMoney(t.totalVersementTataDiara || 0)}</div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderLocationCards = () => {
    const periods = ["day", "month", "year"];
    const labels = { day: "Aujourd'hui", month: "Ce mois", year: "Cette année" };
    return (
      <div>
        <div className="flex gap-3">
          <h3 className="col-span-full text-xl font-semibold">
            Appartements / Véhicules
          </h3>
          <Link href="/dashboard/historique-locations" className="text-blue-500 hover:text-blue-600">
            <SquareArrowOutUpRightIcon size={15} />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {periods.map((p) => {
            const t = drTotals.locations[p] || {};
            return (
              <div
                key={p}
                className="bg-white dark:bg-gray-800 shadow rounded-lg p-4"
              >
                <div className="text-lg font-semibold mb-1">{labels[p]}</div>
                <div className="text-2xl">{formatMoney(t.totalCash || 0)}</div>
                <div className="text-sm">Montant locatif</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderBankCards = () => (
    <div className="grid md:grid-cols-3 gap-4 mb-6">
      <h3 className="col-span-full text-xl font-semibold">Banques (dernier rapport compta)</h3>
      {banksCards.map(({ nom, montant }) => (
        <div key={nom} className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
          <div className="font-semibold mb-1">{nom}</div>
          <div className="text-2xl">{formatMoney(montant)}</div>
          <div className="text-sm">Solde banque</div>
        </div>
      ))}
    </div>
  );

  const renderPlateformesCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      <h3 className="col-span-full text-xl font-semibold">Transfert d'argent</h3>
      {lastCompta.plateformes.map(p => (
        <div key={p.nom} className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
          <div className="font-semibold mb-1">{p.nom}</div>
          <div className="text-sm">Fond de caisse: {formatMoney(p.fondDeCaisse)}</div>
          <div className="text-sm">UV dispo: {formatMoney(p.uvDisponible)}</div>
          <div className="text-sm">Total dépôt: {formatMoney(p.totalDepot)}</div>
          <div className="text-sm">Total retrait: {formatMoney(p.totalRetrait)}</div>
          <div className="text-sm">Commission: {formatMoney(p.commission)}</div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="mt-16 p-4">
      <div className="flex justify-end mb-4 gap-3">
        <Link
          href={`/dashboard/gestion-dettes`}
          className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
        >
          historique dettes
        </Link>
        <Link
          href={`/dashboard/compta/${lastCompta._id}`}
          className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
        >
          Voir le rapport comptable
        </Link>
        <Link
          href={`/dashboard/historique-dettes`}
          className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
        >
          historique dettes quincaillerie
        </Link>
      </div>
      <div className="bg-blue-50 dark:bg-blue-900 shadow rounded-lg p-4 mb-6">
        <h3 className="text-xl font-semibold mb-2">Chiffre d'affaires global</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm">Aujourd'hui</div>
            <div className="text-2xl font-semibold">{formatMoney(caGlobal.day)}</div>
          </div>
          <div>
            <div className="text-sm">Ce mois</div>
            <div className="text-2xl font-semibold">{formatMoney(caGlobal.month)}</div>

          </div>
          <div>
            <div className="text-sm">Cette année</div>
            <div className="text-2xl font-semibold">{formatMoney(caGlobal.year)}</div>

          </div>
        </div>
      </div>

      {renderBankCards()}

      {renderFullCards("Quincailleries", drTotals.quincailleries)}
      {renderLocationCards()}
      {renderPlateformesCards()}

      <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Date</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Activité</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Ventes</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Revenu total</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {dailyReports.map((rep) => (
              <tr
                key={rep._id}
                className={rep.isCompta ? "bg-yellow-50 dark:bg-yellow-900" : "hover:bg-gray-50 dark:hover:bg-gray-700"}
              >
                <td className="px-4 py-2">{formatDate(rep.date)}</td>
                <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                  {rep.isCompta ? "Rapport Compta" : rep.business?.name || "-"}
                </td>
                <td className="px-4 py-2">{rep.sales?.length ?? "-"}</td>
                <td className="px-4 py-2">
                  {rep.revenueCash + rep.revenueOrangeMoney + rep.revenueWave}
                </td>
                <td className="px-4 py-2">
                  <Link href={`/dashboard/rapport/${rep._id}`}> 
                    <span className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">Détails</span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
