// app/dashboard/debts-manage/page.jsx
"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function DebtsManagePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [advanceMap, setAdvanceMap] = useState({});

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  const fetchDebts = async () => {
    if (status !== "authenticated") return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/debts?start=${startDate}&end=${endDate}&type=dette`
      );
      const json = await res.json();
      setData(json.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors du chargement des dettes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebts();
  }, [status, startDate, endDate]);

  const formatCurrency = (v) => {
    if (v === undefined || v === null) return "-";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      maximumFractionDigits: 0,
    }).format(v);
  };

  const handleSettle = async (reportId, ref) => {
    const ok = confirm(
      "Confirmez-vous que la dette est entièrement réglée (suppression) ?"
    );
    if (!ok) return;
    try {
      const res = await fetch("/api/debts/modify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, ref, action: "delete" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Erreur serveur");
      toast.success("Dette supprimée");
      fetchDebts();
    } catch (err) {
      console.error(err);
      toast.error("Impossible de supprimer la dette");
    }
  };

  const handleApplyAdvance = async (reportId, ref) => {
    const key = `${reportId}_${ref}`;
    const raw = advanceMap[key];
    const amount = Number(raw);
    if (!amount || amount <= 0) {
      toast.error("Saisissez un montant valide (> 0)");
      return;
    }

    try {
      const res = await fetch("/api/debts/modify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          ref,
          action: "partial",
          amount,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Erreur serveur");
      toast.success("Avance appliquée");
      setAdvanceMap((prev) => ({ ...prev, [key]: "" }));
      fetchDebts();
    } catch (err) {
      console.error(err);
      toast.error("Impossible d'appliquer l'avance");
    }
  };

  if (status === "loading") {
    return (
      <div className="mt-16 p-4">
        <p className="text-gray-500">Vérification de la session…</p>
      </div>
    );
  }
  if (status === "unauthenticated") return null;

  return (
    <div className="mt-16 p-4">
      <Link href="/dashboard">
        <span className="text-blue-600 hover:underline">← Retour</span>
      </Link>

      <Card className="mb-6">
        <CardHeader className="flex flex-col md:flex-row justify-between items-center gap-4">
          <CardTitle className="text-xl">
            Gestion des dettes (uniques)
          </CardTitle>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
            <div className="flex flex-col">
              <label className="text-sm font-medium">Date de début</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium">Date de fin</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button onClick={fetchDebts} className="mt-2 sm:mt-6">
              Rafraîchir
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="text-gray-500">Chargement...</p>
          ) : data.length === 0 ? (
            <p className="text-gray-500">Aucune dette pour ces dates.</p>
          ) : (
            <>
              {/* ========== TABLE pour écran >= md (desktop/tablette large) ========== */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium">
                        Date
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium">
                        Activité
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium">
                        N° Facture
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium">
                        Description
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium">
                        Montant
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium">
                        Avance
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((item, idx) => {
                      const key = `${item.reportId}_${item.numeroFacture}`;
                      return (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm">
                            {new Date(item.date).toLocaleDateString("fr-FR")}
                          </td>
                          <td className="px-4 py-2 text-sm">{item.business}</td>
                          <td className="px-4 py-2 text-sm">
                            {item.numeroFacture}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {item.description}
                          </td>
                          <td className="px-4 py-2 text-sm font-medium">
                            {formatCurrency(item.total)}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                inputMode="decimal"
                                value={advanceMap[key] ?? ""}
                                onChange={(e) =>
                                  setAdvanceMap((prev) => ({
                                    ...prev,
                                    [key]: e.target.value,
                                  }))
                                }
                                placeholder="Montant"
                                className="w-28"
                              />
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleApplyAdvance(
                                    item.reportId,
                                    item.numeroFacture
                                  )
                                }
                              >
                                Appliquer
                              </Button>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  handleSettle(
                                    item.reportId,
                                    item.numeroFacture
                                  )
                                }
                              >
                                Réglé
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ========== LISTE CARTES pour mobile (< md) ========== */}
              <div className="md:hidden space-y-3">
                {data.map((item, idx) => {
                  const key = `${item.reportId}_${item.numeroFacture}`;
                  return (
                    <article
                      key={idx}
                      className="bg-white shadow-sm rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <time className="text-xs text-gray-500">
                              {new Date(item.date).toLocaleDateString("fr-FR")}
                            </time>
                            <span className="text-sm font-medium text-gray-800">
                              — {item.business}
                            </span>
                          </div>

                          {/* Référence sur sa propre ligne */}
                          <div className="mt-2">
                            <span className="inline-block text-sm font-semibold">
                              {item.numeroFacture}
                            </span>
                          </div>

                          {/* Description sur la ligne suivante, affichée entièrement */}
                          <p className="text-sm text-gray-600 mt-1 whitespace-normal break-words">
                            {item.description}
                          </p>
                        </div>

                        <div className="text-right ml-3">
                          <div className="text-sm font-semibold">
                            {formatCurrency(item.total)}
                          </div>
                          <div className="text-xs text-gray-500">Reste</div>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            inputMode="decimal"
                            value={advanceMap[key] ?? ""}
                            onChange={(e) =>
                              setAdvanceMap((prev) => ({
                                ...prev,
                                [key]: e.target.value,
                              }))
                            }
                            placeholder="Avance"
                            className="w-full"
                            aria-label={`Avance pour ${item.numeroFacture}`}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() =>
                              handleApplyAdvance(
                                item.reportId,
                                item.numeroFacture
                              )
                            }
                          >
                            Appliquer
                          </Button>
                        </div>

                        <div className="col-span-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            className="w-full"
                            onClick={() =>
                              handleSettle(item.reportId, item.numeroFacture)
                            }
                          >
                            Réglé
                          </Button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
