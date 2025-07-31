"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function DailyReportsTable() {
  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const totalPages = limit > 0
    ? Math.max(1, Math.ceil(total / limit))
    : 1

  const formatDate = (iso) =>
    iso
      ? new Date(iso).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "-";

  useEffect(() => {
    setPage(p => Math.min(Math.max(p, 1), totalPages))
    const params = new URLSearchParams({ page, limit, from, to });
    fetch(`/api/daily-reports?${params}`)
      .then((res) => res.json())
      .then((data) => {
        console.log(data.data);
        setReports(data.data.docs);
        setTotal(data.data.total);
      });
  }, [page, limit, from, to]);

  return (
    <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow rounded-lg">
      <div className="flex gap-2 mb-4 items-end">
        <div className="flex flex-col">
          <label htmlFor="from" className="text-sm font-medium mb-1">
            Du
          </label>
          <input
            id="from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black transition"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="to" className="text-sm font-medium mb-1">
            Au
          </label>
          <input
            id="to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black transition"
          />
        </div>
        <button
          onClick={() => setPage(1)}
          className="bg-black text-white rounded-lg px-5 py-2 font-semibold hover:bg-gray-800 transition"
        >
          Filtrer
        </button>
      </div>

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
              Revenu total
            </th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {reports?.map((r) => (
            <tr
              key={r._id}
              className={
                r.isCompta
                  ? "bg-yellow-50 dark:bg-yellow-900"
                  : "hover:bg-gray-50 dark:hover:bg-gray-700"
              }
            >
              <td className="px-4 py-2">{formatDate(r.date)}</td>
              <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                {r.isCompta ? "Rapport Compta" : r.business?.name || "-"}
              </td>
              <td className="px-4 py-2">{r.sales?.length ?? "-"}</td>
              <td className="px-4 py-2">
                {r.revenueCash + r.revenueOrangeMoney + r.revenueWave}
              </td>
              <td className="px-4 py-2">
                <Link href={`/dashboard/rapport/${r._id}`}>
                  <span className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                    Détails
                  </span>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-between mt-4 items-center">
        <button
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          disabled={page === 1}
          className="bg-black text-white rounded-lg px-4 py-2 font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Précédent
        </button>

        <span className="text-sm font-medium">
          Page {page} / {totalPages}
        </span>

        <button
          onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          disabled={page === totalPages}
          className="bg-black text-white rounded-lg px-4 py-2 font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Suivant
        </button>
      </div>
    </div>
  );
}
