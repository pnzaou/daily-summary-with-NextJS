import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export const DebtsPreview = ({ open, onOpenChange, data, type, startDate, endDate, onPrint }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  };

  // Filtrer les données selon le type
  const dettes = type === 'all' || type === 'dette' 
    ? data.filter(item => item.type === 'dette') 
    : [];
  
  const reglements = type === 'all' || type === 'reglement' 
    ? data.filter(item => item.type === 'reglement') 
    : [];

  const totalDettes = dettes.reduce((sum, item) => sum + item.total, 0);
  const totalReglements = reglements.reduce((sum, item) => sum + item.total, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Aperçu avant impression</span>
            <Button onClick={onPrint} size="sm" className="bg-[#0084D1] text-white hover:bg-[#006BB3]">
              <Printer className="h-4 w-4 mr-2" />
              Imprimer
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="bg-white text-black p-8 border rounded-lg">
          {/* En-tête */}
          <div className="mb-8 border-b-2 border-gray-800 pb-4">
            <h1 className="text-3xl font-bold text-gray-900">
              {type === 'dette' ? 'RAPPORT DES DETTES' : 
               type === 'reglement' ? 'RAPPORT DES RÈGLEMENTS' : 
               'RAPPORT DETTES & RÈGLEMENTS'}
            </h1>
            <div className="mt-2 text-sm text-gray-600">
              <p>Période : {formatDate(startDate)} - {formatDate(endDate)}</p>
              <p>Date d'impression : {formatDate(new Date())}</p>
            </div>
          </div>

          {/* Section Dettes */}
          {dettes.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-400 pb-2">
                DETTES
              </h2>
              <table className="w-full mb-4 border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-800">
                    <th className="text-left py-2 text-sm font-bold text-gray-900">DATE</th>
                    <th className="text-left py-2 text-sm font-bold text-gray-900">BUSINESS</th>
                    <th className="text-left py-2 text-sm font-bold text-gray-900">N° FACTURE</th>
                    <th className="text-left py-2 text-sm font-bold text-gray-900">DESCRIPTION</th>
                    <th className="text-right py-2 text-sm font-bold text-gray-900">MONTANT</th>
                  </tr>
                </thead>
                <tbody>
                  {dettes.map((item, index) => (
                    <tr key={index} className="border-b border-gray-300">
                      <td className="py-3 text-sm text-gray-800">
                        {formatDate(item.date)}
                      </td>
                      <td className="py-3 text-sm text-gray-800">
                        {item.business}
                      </td>
                      <td className="py-3 text-sm text-gray-800">
                        {item.numeroFacture}
                      </td>
                      <td className="py-3 text-sm text-gray-800">
                        {item.description}
                      </td>
                      <td className="py-3 text-sm text-gray-800 text-right font-medium">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-800">
                    <td colSpan="4" className="py-3 text-right font-bold text-gray-900">
                      TOTAL DETTES:
                    </td>
                    <td className="py-3 text-right font-bold text-red-600 text-lg">
                      {formatCurrency(totalDettes)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Section Règlements */}
          {reglements.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-400 pb-2">
                RÈGLEMENTS
              </h2>
              <table className="w-full mb-4 border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-800">
                    <th className="text-left py-2 text-sm font-bold text-gray-900">DATE</th>
                    <th className="text-left py-2 text-sm font-bold text-gray-900">BUSINESS</th>
                    <th className="text-left py-2 text-sm font-bold text-gray-900">N° FACTURE</th>
                    <th className="text-left py-2 text-sm font-bold text-gray-900">DESCRIPTION</th>
                    <th className="text-right py-2 text-sm font-bold text-gray-900">MONTANT</th>
                  </tr>
                </thead>
                <tbody>
                  {reglements.map((item, index) => (
                    <tr key={index} className="border-b border-gray-300">
                      <td className="py-3 text-sm text-gray-800">
                        {formatDate(item.date)}
                      </td>
                      <td className="py-3 text-sm text-gray-800">
                        {item.business}
                      </td>
                      <td className="py-3 text-sm text-gray-800">
                        {item.numeroFacture}
                      </td>
                      <td className="py-3 text-sm text-gray-800">
                        {item.description}
                      </td>
                      <td className="py-3 text-sm text-gray-800 text-right font-medium">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-800">
                    <td colSpan="4" className="py-3 text-right font-bold text-gray-900">
                      TOTAL RÈGLEMENTS:
                    </td>
                    <td className="py-3 text-right font-bold text-green-600 text-lg">
                      {formatCurrency(totalReglements)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Résumé global si les deux sont affichés */}
          {type === 'all' && dettes.length > 0 && reglements.length > 0 && (
            <div className="mt-8 p-4 bg-gray-100 rounded">
              <h3 className="text-lg font-bold text-gray-900 mb-3">RÉSUMÉ</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Total des dettes:</span>
                  <span className="text-red-600 font-bold">{formatCurrency(totalDettes)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Total des règlements:</span>
                  <span className="text-green-600 font-bold">{formatCurrency(totalReglements)}</span>
                </div>
                <div className="border-t-2 border-gray-800 pt-2 flex justify-between text-lg">
                  <span className="font-bold">Solde:</span>
                  <span className={`font-bold ${totalDettes - totalReglements > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(totalDettes - totalReglements)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Pied de page */}
          <div className="mt-12 pt-4 border-t border-gray-300 text-center text-xs text-gray-600">
            <p>Document généré automatiquement</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};