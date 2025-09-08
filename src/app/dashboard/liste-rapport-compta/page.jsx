import dbConnection from '@/lib/db';
import RapportCompta from '@/models/RapportCompta.Model';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import { redirect } from 'next/navigation';

// Utilitaire pour formater les dates
const formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

const sumBanques = (banques) => {
  if (!banques || !Array.isArray(banques)) return 0;
  return banques.reduce((sum, b) => sum + Number(b.montant || 0), 0);
};

const Page = async () => {
  const session = await getServerSession(authOptions);

  // Seul un comptable peut accéder à cette page
  if (!session || session.user.role !== 'comptable') {
    // redirige vers l'accueil (ou dashboard) si non autorisé
    redirect('/');
  }

  // Connexion à la base si nécessaire
  await dbConnection();

  // Récupère tous les rapports compta, triés par date décroissante
  const rapports = await RapportCompta
    .find({})
    .sort({ date: -1 })
    .lean();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Link href="/dashboard" className="self-start mb-4">
        <Button variant="ghost" className="mb-4">← Retour</Button>
      </Link>

      <div className="w-full max-w-4xl overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Date</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Banques (total)</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Caisse principale</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Versement</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Dettes</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {rapports.map((r) => (
              <tr key={r._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-2">{formatDate(r.date)}</td>
                <td className="px-4 py-2">{sumBanques(r.banques)}</td>
                <td className="px-4 py-2">{r.caissePrincipale?.montant ?? '-'}</td>
                <td className="px-4 py-2">{r.versement ? `${r.versement.method} — ${r.versement.montant ?? '-'} ` : '-'}</td>
                <td className="px-4 py-2">{r.dettes ? r.dettes.length : 0}</td>
                <td className="px-4 py-2">
                  <Link href={`/dashboard/compta/${r._id}`}>
                    <span className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">Détails</span>
                  </Link>
                </td>
              </tr>
            ))}

            {rapports.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center" colSpan={6}>Aucun rapport comptable trouvé.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Page;
