"use client";

import React, { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import DailyReportPdfDocument from "@/components/DailyReportPdfDocument";
import { Button } from "@/components/ui/button";

export default function DownloadDailyReportButton({ dailyReportId, fetchUrl }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const url = fetchUrl || `/api/daily-report/${dailyReportId}`;

  async function handleDownload() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url, { method: "GET", credentials: "include" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Erreur ${res.status}`);
      }
      const js = await res.json();
      const report = js.data || js;

      // create PDF blob from the document component
      const blob = await pdf(<DailyReportPdfDocument report={report} />).toBlob();

      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const dateStr = report?.date ? new Date(report.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
      a.href = objectUrl;
      a.download = `daily-report-${dateStr}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error("Erreur génération PDF daily:", err);
      setError(err.message || "Erreur lors de la génération du PDF");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button onClick={handleDownload} disabled={loading}>
        {loading ? "Génération..." : "Télécharger (PDF)"}
      </Button>
      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
    </div>
  );
}
