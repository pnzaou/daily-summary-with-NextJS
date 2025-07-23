import { Button } from "@/components/ui/button";
import authOptions from "@/lib/auth";
import dbConnection from "@/lib/db";
import { preparingServerSideRequest } from "@/utils/preparingServerRequest";
import { getServerSession } from "next-auth";
import Link from "next/link";
import React from "react";

const page = async () => {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/");
  }
  await dbConnection();
  let dailyReport = {};
  const { cookie, host, protocol } = await preparingServerSideRequest();
  const res = await fetch(`${protocol}://${host}/api/dashboard-data`, {
    headers: {
      cookie,
    },
  });
  const { data } = await res.json();
  const { dailyReports, banksCards, drTotals, caGlobal, lastCompta } = data;

  const formatMoney = (value) => {
    if (value == null) return "-";
    const str = value.toString();
    const withDots = str.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${withDots} FCFA`;
  };

  const renderBankCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <h3 className="col-span-full text-xl font-semibold">
        Banques (dernier rapport compta)
      </h3>
      {banksCards.map(({ nom, montant }) => (
        <div
          key={nom}
          className="bg-white dark:bg-gray-800 shadow rounded-lg p-4"
        >
          <div className="font-semibold mb-1">{nom}</div>
          <div className="text-2xl">{formatMoney(montant)}</div>
          <div className="text-sm">Solde banque</div>
        </div>
      ))}
    </div>
  );

  const renderPlateformesCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      <h3 className="col-span-full text-xl font-semibold">
        Transfert d'argent
      </h3>
      {lastCompta.plateformes.map((p) => (
        <div
          key={p.nom}
          className="bg-white dark:bg-gray-800 shadow rounded-lg p-4"
        >
          <div className="font-semibold mb-1">{p.nom}</div>
          <div className="text-sm">
            Fond de caisse: {formatMoney(p.fondDeCaisse)}
          </div>
          <div className="text-sm">UV dispo: {formatMoney(p.uvDisponible)}</div>
          <div className="text-sm">
            Total dépôt: {formatMoney(p.totalDepot)}
          </div>
          <div className="text-sm">
            Total retrait: {formatMoney(p.totalRetrait)}
          </div>
          <div className="text-sm">Commission: {formatMoney(p.commission)}</div>
        </div>
      ))}
    </div>
  );
  return (
    <div className="mt-16 p-4">
      <Link href="/dashboard" className="fixed top-5 left-4 self-start mb-4">
       <span className="text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 p-2 rounded-md">
          ← Retour
        </span>
      </Link>
      {renderBankCards()}
      {renderPlateformesCards()}
    </div>
  );
};

export default page;
