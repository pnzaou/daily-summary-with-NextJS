import dbConnection from '@/lib/db';
import DailyReport from '@/models/DailyReport.Model';
import Business from '@/models/Business.Model';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';

// Utilitaire pour formater les dates
const formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

const Page = async () => {
  const session = await getServerSession(authOptions);
    if (!session) {
      redirect("/");
    }
  // Connexion à la base si nécessaire
  await dbConnection();

  // Récupère uniquement les rapports du jour et populae le nom du business
  const dailyReports = await DailyReport
    .find({ gerant: { $exists: true } })
    .populate('business', 'name')
    .lean();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Link
        href="/dashboard"
        className="self-start mb-4"
      >
        <Button variant="ghost" className="mb-4">
            ← Retour
        </Button>
      </Link>
      <div className="w-full max-w-4xl overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Date</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Activité</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Ventes</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Total Cash</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {dailyReports.map((rep) => (
              <tr
                key={rep._id}
                className={rep.isCompta ? 'bg-yellow-50 dark:bg-yellow-900' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}
              >
                <td className="px-4 py-2">{formatDate(rep.date)}</td>
                <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                  {rep.isCompta ? 'Rapport Compta' : rep.business?.name || '-'}
                </td>
                <td className="px-4 py-2">{rep.sales?.length ?? '-'}</td>
                <td className="px-4 py-2">
                  {rep.revenueCash ??
                    (rep.banques
                      ? rep.banques.reduce((sum, b) => sum + Number(b.montant), 0)
                      : 0)}
                </td>
                <td className="px-4 py-2">
                 {session?.user?.role === "comptable" ? (
                   <Link href={`/dashboard/rapport/${rep._id}`}> 
                    <span className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">Détails</span>
                  </Link>
                 ) : (
                   <Link href={`/dashboard/rapport-update/${rep._id}`}> 
                    <span className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">Modifier</span>
                  </Link>
                 )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Page;
