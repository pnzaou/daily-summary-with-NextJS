// app/dashboard/compta/[id]/page.jsx
'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ComptaDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchDetail() {
      try {
        const res = await fetch(`/api/daily-report-compta/${params.id}`)
        const json = await res.json()
        if (!json.success) throw new Error(json.message)
        setData(json.data)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [params.id])

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
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
        {/* skeleton caisse principale */}
        <div className="border bg-white rounded shadow p-4 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array(2).fill(0).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
        {/* skeleton transferts */}
        <div className="border bg-white rounded shadow p-4 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array(2).fill(0).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
        {/* skeleton dettes */}
        <div className="border bg-white rounded shadow p-4 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 max-w-md mx-auto text-center">
        <h2 className="text-xl font-semibold text-red-600 mb-4">Erreur</h2>
        <p className="text-red-500 mb-6">{error}</p>
        <Button variant="outline" onClick={() => router.back()}>Retour</Button>
      </div>
    )
  }

  const { date, banques, caissePrincipale, plateformes, dettes } = data

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        ← Retour
      </Button>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Détails Rapport Comptable</CardTitle>
          <p className="text-sm text-gray-500">Date : {new Date(date).toLocaleDateString('fr-FR')}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold">Banques</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              {banques.map(b => (
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
            <h3 className="font-semibold">Caisse Principale</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <Card>
                <CardHeader>
                  <CardTitle>Entrees</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {caissePrincipale.entrees.map((e,i) => (
                    <div key={i} className="flex justify-between">
                      <span>{e.business?.name || '—'} — {e.description || '—'}</span>
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
                  {caissePrincipale.sorties.map((s,i) => (
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
              {plateformes.map((p,i) => (
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
                        {p.dettes.map((d,j) => (
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
              {dettes.map((d,i) => (
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
  )
}
