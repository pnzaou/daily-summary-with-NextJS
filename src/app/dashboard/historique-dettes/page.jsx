'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export default function DebtsPage() {
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    fetch(`/api/debts?start=${startDate}&end=${endDate}`)
      .then(res => res.json())
      .then(json => setData(json.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="mt-16 p-4">
      <Link href="/dashboard">
          <span className="text-blue-600 dark:text-blue-400 hover:underline">
            ← Retour
          </span>
      </Link>
      <Card className="mb-6">
        <CardHeader className="flex flex-col md:flex-row justify-between items-center gap-4">
          <CardTitle className="text-xl">Liste des dettes & règlements</CardTitle>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="flex flex-col">
              <label htmlFor="start" className="text-sm font-medium">Date de début</label>
              <Input
                id="start"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="end" className="text-sm font-medium">Date de fin</label>
              <Input
                id="end"
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
            <Button onClick={fetchData} className="mt-2 sm:mt-6">Filtrer</Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-500">Chargement...</p>
          ) : data.length === 0 ? (
            <p className="text-gray-500">Aucune donnée pour ces dates.</p>
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