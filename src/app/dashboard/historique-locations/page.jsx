"use client"

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LocationEntriesList() {
  // 1. Hooks toujours en haut
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // 2. Redirection si non-authentifié
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  // 3. Chargement des entrées de location
  useEffect(() => {
    async function fetchEntries() {
      setLoading(true);
      try {
        const res = await fetch('/api/locations-entries');
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchEntries();
  }, []);

  // 4. Pagination (useMemo)
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, page]);
  const totalPages = Math.ceil(data.length / pageSize);

  // 5. States de session
  if (status === 'loading') {
    return (
      <div className="mt-16 p-4">
        <p className="text-gray-500">Vérification de la session…</p>
      </div>
    );
  }
  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="mt-16 p-4">
      <Link href="/dashboard">
        <span className="text-blue-600 dark:text-blue-400 hover:underline">← Retour</span>
      </Link>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">Historique des entrées (Location)</CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="text-gray-500">Chargement...</p>
          ) : paginated.length === 0 ? (
            <p className="text-gray-500">Aucune entrée de location.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium">Date</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Bien</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Description</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Montant</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginated.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm">{new Date(item.date).toLocaleDateString()}</td>
                      <td className="px-4 py-2 text-sm">{item.business}</td>
                      <td className="px-4 py-2 text-sm">{item.description}</td>
                      <td className="px-4 py-2 text-sm font-medium">{item.montant}</td>
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
