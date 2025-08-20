"use client";

import { useState } from "react";
import RapportComptaPdfDocument from "./rapport-compta-pdf-document";
import { pdf } from "@react-pdf/renderer";

export default function DownloadRapportButton({ rapportId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleDownload() {
    setError(null);
    setLoading(true);
    try {
      // si ton endpoint nécessite cookies / session, include credentials
      const res = await fetch(`/api/rapport-compta/${rapportId}`, {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Erreur ${res.status}`);
      }
      const js = await res.json();
      const report = js.data || js; // selon structure de ta réponse

      // Création du Document et conversion en blob
      const blob = await pdf(<RapportComptaPdfDocument report={report} />).toBlob();

      // Téléchargement
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const dateStr = report?.date
        ? new Date(report.date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];
      a.href = url;
      a.download = `rapport-${dateStr}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erreur génération PDF:", err);
      setError(err.message || "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={loading}
        className="px-4 py-2 rounded bg-blue-600 text-white"
      >
        {loading ? "Génération..." : "Télécharger le rapport (PDF)"}
      </button>
      {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
    </div>
  );
}
