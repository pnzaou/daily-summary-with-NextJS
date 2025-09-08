"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DownloadRapportButton from "@/components/download-rapport-compta-button";

export default function ComptaDetailPage() {
  // 1. Tous les Hooks en haut, dans un ordre fixe
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2. Redirection si non authentifié
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // helper format FR
  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "";

  // safe number parsing
  const toNumber = (v) => {
    if (v == null || v === "") return 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  // total banques
  const calcTotalBanques = (banques) =>
    Array.isArray(banques) ? banques.reduce((s, b) => s + toNumber(b?.montant), 0) : 0;

  // 3. Chargement des détails une fois authentifié
  useEffect(() => {
    if (status !== "authenticated") return;
    if (!params?.id) {
      setError("Identifiant du rapport manquant.");
      setLoading(false);
      return;
    }

    async function fetchDetail() {
      try {
        setLoading(true);
        const res = await fetch(`/api/daily-report-compta/${params.id}`);
        if (!res.ok) {
          const txt = await res.text().catch(() => null);
          const json = txt ? JSON.parse(txt) : null;
          throw new Error(json?.message || `Erreur ${res.status}`);
        }
        const json = await res.json();
        if (!json.success) throw new Error(json.message || "Erreur réseau");
        setData(json.data);
      } catch (e) {
        setError(e.message || "Erreur inattendue");
      } finally {
        setLoading(false);
      }
    }

    fetchDetail();
  }, [status, params?.id]);

  // 4. Rendus conditionnels après tous les Hooks
  if (status === "loading") {
    return (
      <div className="mt-16 p-4">
        <p className="text-gray-500">Vérification de la session…</p>
      </div>
    );
  }
  if (status === "unauthenticated") {
    return null;
  }
  if (loading) {
    return (
      <div className="p-4 max-w-4xl mx-auto space-y-6">
        <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mb-4"></div>
        <div className="border bg-white rounded shadow p-4 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 max-w-md mx-auto text-center">
        <h2 className="text-xl font-semibold text-red-600 mb-4">Erreur</h2>
        <p className="text-red-500 mb-6">{error}</p>
        <Button variant="outline" onClick={() => router.back()}>
          ← Retour
        </Button>
      </div>
    );
  }

  // 5. Rendu principal (défensive)
  const {
    date = null,
    banques = [],
    caissePrincipale = { montant: 0, entrees: [], sorties: [] },
    plateformes = [],
    dettes = [],
    versement = null,
  } = data ?? {};

  const totalBanques = calcTotalBanques(banques);

  // décompte dettes par status (global)
  const dettesCounts = Array.isArray(dettes)
    ? dettes.reduce(
        (acc, d) => {
          const s = d?.status || "impayée";
          acc[s] = (acc[s] || 0) + 1;
          return acc;
        },
        { payée: 0, impayée: 0 }
      )
    : { payée: 0, impayée: 0 };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        ← Retour
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between w-full">
            <div>
              <CardTitle>Détails Rapport Comptable</CardTitle>
              <p className="text-sm text-gray-500">Date : {formatDate(date)}</p>
              <div className="mt-2 text-sm text-gray-700">
                <strong>Total banques :</strong> {totalBanques}
              </div>
              <div className="mt-1 text-sm text-gray-700">
                <strong>Caisse principale :</strong>{" "}
                {caissePrincipale?.montant ?? "—"}
              </div>
              <div className="mt-1 text-sm text-gray-700">
                <strong>Versement :</strong>{" "}
                {versement ? `${versement.method || "-"} — ${versement.montant ?? "-"}` : "—"}
              </div>
            </div>

            {/* Download button */}
            <div className="ml-4">
              <DownloadRapportButton rapportId={params.id} />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Banques */}
          <div>
            <h3 className="font-semibold">Banques</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              {Array.isArray(banques) && banques.length > 0 ? (
                banques.map((b) => (
                  <Card key={b._id ?? b.nom}>
                    <CardHeader>
                      <CardTitle>{b.nom ?? "—"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>Montant: {toNumber(b.montant)}</p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-sm text-gray-500">Aucune banque renseignée.</p>
              )}
            </div>
          </div>

          {/* Caisse Principale : Entrees / Sorties */}
          <div>
            <h3 className="font-semibold">Caisse Principale — Flux</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <Card>
                <CardHeader>
                  <CardTitle>Entrées</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Array.isArray(caissePrincipale?.entrees) && caissePrincipale.entrees.length > 0 ? (
                    caissePrincipale.entrees.map((e) => {
                      const biz = e.business;
                      // business peut être { _id, name } ou juste id string
                      const bizName = biz?.name ?? (typeof biz === "string" ? biz : null);
                      const bizId = biz?._id ?? (typeof biz === "string" ? biz : null);
                      return (
                        <div key={e._id ?? `${bizId}-${e.description ?? ""}`} className="flex justify-between">
                          <span>
                            {bizName ? `${bizName}` : "—"} — {e.description || "—"}
                          </span>
                          <span>{toNumber(e.montant)}</span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-500">Aucune entrée.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sorties</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Array.isArray(caissePrincipale?.sorties) && caissePrincipale.sorties.length > 0 ? (
                    caissePrincipale.sorties.map((s) => (
                      <div key={s._id ?? `${s.description}-${s.montant}`} className="flex justify-between">
                        <span>{s.description || "—"}</span>
                        <span>{toNumber(s.montant)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Aucune sortie.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Plateformes */}
          <div>
            <h3 className="font-semibold">Transferts / Plateformes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              {Array.isArray(plateformes) && plateformes.length > 0 ? (
                plateformes.map((p) => (
                  <Card key={p._id ?? p.nom}>
                    <CardHeader>
                      <CardTitle>{p.nom ?? "—"}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <p>Fond de caisse: {toNumber(p.fondDeCaisse)}</p>
                      <p>UV dispo: {toNumber(p.uvDisponible)}</p>
                      <p>Recharge UV: {toNumber(p.rechargeUV)}</p>
                      <p>Total dépôt: {toNumber(p.totalDepot)}</p>
                      <p>Total retrait: {toNumber(p.totalRetrait)}</p>
                      <p>Commission: {toNumber(p.commission)}</p>
                      <p>Disponibilités: {toNumber(p.disponibilites)}</p>

                      {Array.isArray(p.dettes) && p.dettes.length > 0 && (
                        <div className="mt-2">
                          <h4 className="font-medium">Dettes ({p.dettes.length})</h4>
                          {p.dettes.map((d) => (
                            <div key={d._id ?? `${d.description}-${d.montant}`} className="flex justify-between">
                              <span>{d.description || "—"}</span>
                              <span>
                                {toNumber(d.montant)} {d.status ? `(${d.status})` : ""}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-sm text-gray-500">Aucune plateforme renseignée.</p>
              )}
            </div>
          </div>

          {/* Dettes racine */}
          <div>
            <h3 className="font-semibold">Dettes</h3>
            <div className="space-y-2 mt-2">
              {Array.isArray(dettes) && dettes.length > 0 ? (
                <>
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>Payées:</strong> {dettesCounts.payée} — <strong>Impayées:</strong> {dettesCounts.impayée}
                  </div>
                  {dettes.map((d) => (
                    <div key={d._id ?? `${d.description}-${d.montant}`} className="flex justify-between">
                      <span>{d.description || "—"}</span>
                      <span>
                        {toNumber(d.montant)} {d.status ? `(${d.status})` : ""}
                      </span>
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-sm text-gray-500">Aucune dette.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
