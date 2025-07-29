"use client"

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function DetteList() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  useEffect(() => {
    if (status !== 'authenticated') {
      router.push('/')
      return null
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="mt-16 p-4">
        <p className="text-gray-500">Vérification de la session…</p>
      </div>
    );
  }
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    async function fetchDettes() {
      setLoading(true);
      try {
        const res = await fetch('/api/dettes');
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchDettes();
  }, []);

  const handleToggle = async (item) => {
    try {
      const res = await fetch('/api/dettes/toggle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rapportId: item.rapportId,
          detteId: item._id,
          type: item.type
        })
      });
      const json = await res.json();
      if (json.success) {
        // mettre à jour localement
        setData(prev => prev.map(d =>
          d._id === item._id ? { ...d, status: d.status === 'impayée' ? 'payée' : 'impayée' } : d
        ));
      }
    } catch (err) {
      console.error('Erreur toggle:', err);
    }
  };

  const filtered = useMemo(
    () => data.filter(item => typeFilter === 'all' || item.type === typeFilter),
    [data, typeFilter]
  );
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);
  const totalPages = Math.ceil(filtered.length / pageSize);

  return (
    <div className="mt-16 p-4">
      <Link href="/dashboard">
        <span className="text-blue-600 dark:text-blue-400 hover:underline">← Retour</span>
      </Link>

      <Card className="mb-6">
        <CardHeader className="flex flex-col md:flex-row justify-between items-center gap-4">
          <CardTitle className="text-xl">Liste des dettes & règlements</CardTitle>
          <Select onValueChange={setTypeFilter} value={typeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="global">Dette</SelectItem>
              <SelectItem value="plateforme">Dette plateforme de transfert</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="text-gray-500">Chargement...</p>
          ) : paginated.length === 0 ? (
            <p className="text-gray-500">Aucune donnée.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium">Type</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Description</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Montant</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Statut</th>
                    {session?.user?.role === 'comptable' && (
                      <th className="px-4 py-2 text-left text-sm font-medium">Action</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginated.map(item => (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm capitalize">{item.type}</td>
                      <td className="px-4 py-2 text-sm">{item.description}</td>
                      <td className="px-4 py-2 text-sm font-medium">{item.montant}</td>
                      <td className="px-4 py-2 text-sm">{item.status}</td>
                      {session?.user?.role === 'comptable' && (
                        <td className="px-4 py-2 text-sm">
                          <Button size="sm" onClick={() => handleToggle(item)}>
                            {item.status === 'impayée' ? 'Marquer comme payée' : 'Marquer comme impayée'}
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4 flex justify-center items-center space-x-2">
                <Button disabled={page === 1} onClick={() => setPage(p => Math.max(p - 1, 1))}>
                  Précédent
                </Button>
                <span className="text-sm">{page} / {totalPages}</span>
                <Button disabled={page === totalPages} onClick={() => setPage(p => Math.min(p + 1, totalPages))}>
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}