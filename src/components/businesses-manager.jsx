"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import BusinessFormDialog from "./business-form-dialog"
import { BUSINESS_TYPE_LABELS } from "@/lib/business-types"

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—"

export default function BusinessesManager() {
  // reloadKey force un rechargement après une action ; la liste est en chargement
  // tant que la dernière réponse reçue ne correspond pas à la demande en cours
  const [reloadKey, setReloadKey] = useState(0)
  const [result, setResult] = useState({ key: null, businesses: [] })
  const loading = result.key !== reloadKey
  const [search, setSearch] = useState("")
  const [dialog, setDialog] = useState(null) // { business } ; business absent = création

  const closeDialog = () => setDialog(null)
  const afterSave = () => {
    setDialog(null)
    setReloadKey((k) => k + 1)
  }

  useEffect(() => {
    let ignore = false
    axios.get("/api/business")
      .then(({ data }) => {
        if (!ignore) setResult({ key: reloadKey, businesses: data.data })
      })
      .catch((error) => {
        console.error(error)
        if (ignore) return
        toast.error(error.response?.data?.message || "Impossible de charger les activités.")
        setResult((prev) => ({ ...prev, key: reloadKey }))
      })
    return () => { ignore = true }
  }, [reloadKey])

  const term = search.trim().toLowerCase()
  const businesses = result.businesses.filter((b) => !term || b.name.toLowerCase().includes(term))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col">
          <label htmlFor="search" className="mb-1 text-sm font-medium">Rechercher</label>
          <Input id="search" className="w-64" placeholder="Nom de l'activité"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button className="ml-auto" onClick={() => setDialog({})}>Nouvelle activité</Button>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Nom", "Type", "Comptes rattachés", "Rapports", "Dernier rapport", "Actions"].map((h) => (
                <th key={h} className="px-4 py-2 text-left font-medium text-gray-700">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading && result.businesses.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">Chargement…</td></tr>
            ) : businesses.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">Aucune activité.</td></tr>
            ) : (
              businesses.map((b) => (
                <tr key={b._id}>
                  <td className="px-4 py-2">{b.name}</td>
                  <td className="px-4 py-2">
                    {b.type
                      ? BUSINESS_TYPE_LABELS[b.type] ?? b.type
                      : <span className="text-amber-700">Aucun (hors sections)</span>}
                  </td>
                  <td className="px-4 py-2">{b.usersCount}</td>
                  <td className="px-4 py-2">{b.reportsCount}</td>
                  <td className="px-4 py-2">{formatDate(b.lastReportAt)}</td>
                  <td className="px-4 py-2">
                    <Button size="sm" variant="outline" onClick={() => setDialog({ business: b })}>
                      Modifier
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {dialog && (
        <BusinessFormDialog business={dialog.business} onClose={closeDialog} onSaved={afterSave} />
      )}
    </div>
  )
}
