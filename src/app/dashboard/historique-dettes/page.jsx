'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Printer, FileText } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DebtsPrint } from '@/components/depts-print';
import { DebtsPreview } from '@/components/ui/depts-preview';

export default function DebtsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'dette' | 'reglement'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // États pour l'impression
  const [printMode, setPrintMode] = useState(null);
  const [printType, setPrintType] = useState('all');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    setLoading(true);
    fetch(`/api/debts?start=${startDate}&end=${endDate}&type=${filterType}`)
      .then(res => res.json())
      .then(json => setData(json.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [status, startDate, endDate, filterType]);

  // Gestion de l'impression
  const handlePrint = (type) => {
    setPrintType(type);
    setShowPreview(true);
  };

  const handleConfirmPrint = () => {
    setShowPreview(false);
    setPrintMode(printType);
    setTimeout(() => {
      window.print();
      setPrintMode(null);
    }, 300);
  };

  // Fonction pour formater la devise
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (status === 'loading') {
    return (
      <div className="mt-16 p-4">
        <p className="text-gray-500">Vérification de la session…</p>
      </div>
    );
  }
  
  if (status === 'unauthenticated') return null;

  return (
    <>
      {/* Contenu principal - caché lors de l'impression */}
      <div className={printMode ? "hidden" : "mt-16 p-4"}>
        <div className="flex items-center justify-between mb-4">
          <Link href="/dashboard">
            <span className="text-blue-600 dark:text-blue-400 hover:underline">
              ← Retour
            </span>
          </Link>

          {/* Bouton d'impression */}
          {data.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-2 bg-[#0084D1] text-white hover:bg-[#006BB3]">
                  <Printer className="w-4 h-4" />
                  Imprimer
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handlePrint('dette')}>
                  <FileText className="w-4 h-4 mr-2" />
                  Dettes uniquement
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePrint('reglement')}>
                  <FileText className="w-4 h-4 mr-2" />
                  Règlements uniquement
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePrint('all')}>
                  <FileText className="w-4 h-4 mr-2" />
                  Dettes & Règlements
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

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

              {/* Filtre par type */}
              <div className="flex flex-col">
                <label htmlFor="filterType" className="text-sm font-medium">Afficher</label>
                <select
                  id="filterType"
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="all">Tout</option>
                  <option value="dette">Dettes</option>
                  <option value="reglement">Règlements</option>
                </select>
              </div>
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
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.type === 'dette' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {item.type === 'reglement' ? 'Règlement' : 'Dette'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm">{item.business}</td>
                        <td className="px-4 py-2 text-sm">{item.numeroFacture}</td>
                        <td className="px-4 py-2 text-sm">{item.description}</td>
                        <td className={`px-4 py-2 text-sm font-medium ${
                          item.type === 'dette' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Composant d'impression - visible uniquement lors de l'impression */}
      {printMode && (
        <DebtsPrint 
          data={data} 
          type={printMode}
          startDate={new Date(startDate)}
          endDate={new Date(endDate)}
        />
      )}

      {/* Preview avant impression */}
      <DebtsPreview
        open={showPreview}
        onOpenChange={setShowPreview}
        data={data}
        type={printType}
        startDate={new Date(startDate)}
        endDate={new Date(endDate)}
        onPrint={handleConfirmPrint}
      />
    </>
  );
}