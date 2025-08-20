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

  // 3. Chargement des détails une fois authentifié
  useEffect(() => {
    if (status !== "authenticated") return;

    async function fetchDetail() {
      try {
        const res = await fetch(`/api/daily-report-compta/${params.id}`);
        const json = await res.json();
        if (!json.success) throw new Error(json.message || "Erreur réseau");
        setData(json.data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDetail();
  }, [status, params.id]);

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
        {/* skeleton back button */}
        <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mb-4"></div>
        {/* skeleton card header */}
        <div className="border bg-white rounded shadow p-4 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
        {/* skeleton banques grid */}
        <div className="border bg-white rounded shadow p-4 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
          </div>
        </div>
        {/* skeleton caisse principale */}
        <div className="border bg-white rounded shadow p-4 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array(2)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
          </div>
        </div>
        {/* skeleton transferts */}
        <div className="border bg-white rounded shadow p-4 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array(2)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
          </div>
        </div>
        {/* skeleton dettes */}
        <div className="border bg-white rounded shadow p-4 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
              ))}
          </div>
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

  // 5. Rendu principal
  const { date, banques, caissePrincipale, plateformes, dettes } = data;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        ← Retour
      </Button>
      <Card className="mb-6">
        {/* -> J'ai placé le bouton de téléchargement dans l'en-tête de la carte,
               aligné à droite pour qu'il soit visible et logique (action sur le rapport affiché).
               C'est le meilleur endroit UX car l'utilisateur voit le rapport puis peut directement
               l'exporter. */}
        <CardHeader>
          <div className="flex items-start justify-between w-full">
            <div>
              <CardTitle>Détails Rapport Comptable</CardTitle>
              <p className="text-sm text-gray-500">
                Date : {new Date(date).toLocaleDateString("fr-FR")}
              </p>
              <h3 className="font-semibold mt-4">
                Caisse Principale :{" "}
                <span className="text-sm text-gray-500">
                  {caissePrincipale.montant}
                </span>
              </h3>
            </div>

            {/* Download button intégré ici */}
            <div className="ml-4">
              {/* passe l'id du rapport au composant */}
              <DownloadRapportButton rapportId={params.id} />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold">Banques</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              {banques.map((b) => (
                <Card key={b.nom}>
                  <CardHeader>
                    <CardTitle>{b.nom}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Montant: {b.montant}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold">Flux</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <Card>
                <CardHeader>
                  <CardTitle>Entrees</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {caissePrincipale.entrees.map((e, i) => (
                    <div key={i} className="flex justify-between">
                      <span>
                        {e.business?.name || "—"} — {e.description || "—"}
                      </span>
                      <span>{e.montant}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sorties</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {caissePrincipale.sorties.map((s, i) => (
                    <div key={i} className="flex justify-between">
                      <span>{s.description}</span>
                      <span>{s.montant}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          <div>
            <h3 className="font-semibold">Transferts d'argent</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              {plateformes.map((p, i) => (
                <Card key={i}>
                  <CardHeader>
                    <CardTitle>{p.nom}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <p>Fond de caisse: {p.fondDeCaisse}</p>
                    <p>UV dispo: {p.uvDisponible}</p>
                    <p>Total dépôt: {p.totalDepot}</p>
                    <p>Total retrait: {p.totalRetrait}</p>
                    <p>Commission: {p.commission}</p>
                    {p.dettes.length > 0 && (
                      <div>
                        <h4 className="font-medium mt-2">Dettes</h4>
                        {p.dettes.map((d, j) => (
                          <div key={j} className="flex justify-between">
                            <span>{d.description}</span>
                            <span>{d.montant}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold">Dettes</h3>
            <div className="space-y-2 mt-2">
              {dettes.map((d, i) => (
                <div key={i} className="flex justify-between">
                  <span>{d.description}</span>
                  <span>{d.montant}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
