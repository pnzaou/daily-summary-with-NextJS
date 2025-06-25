'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export default function DebtsPage() {
  const [filter, setFilter] = useState('day');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter()

  useEffect(() => {
    setLoading(true);
    fetch(`/api/debts?filter=${filter}`)
      .then(res => res.json())
      .then(json => {
        setData(json.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="mt-16 p-4">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        ← Retour
      </Button>
      <Card className="mb-6">
        <CardHeader className="flex justify-between items-center">
          <CardTitle className="text-xl">Liste des dettes & règlements</CardTitle>
          <div className="space-x-2">
            <Button
              variant={filter === 'day' ? 'default' : 'outline'}
              onClick={() => setFilter('day')}
            >Aujourd'hui</Button>
            <Button
              variant={filter === 'month' ? 'default' : 'outline'}
              onClick={() => setFilter('month')}
            >Ce mois</Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-500">Chargement...</p>
          ) : data.length === 0 ? (
            <p className="text-gray-500">Aucune donnée pour cette période.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium">Date</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Type</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Activité</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">N° Facture</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Description</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Montant</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm">
                        {new Date(item.date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-2 text-sm capitalize">
                        {item.type === 'reglement' ? 'Règlement' : 'Dette'}
                      </td>
                      <td className="px-4 py-2 text-sm">{item.business}</td>
                      <td className="px-4 py-2 text-sm">{item.numeroFacture}</td>
                      <td className="px-4 py-2 text-sm">{item.description}</td>
                      <td className="px-4 py-2 text-sm font-medium">{item.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
