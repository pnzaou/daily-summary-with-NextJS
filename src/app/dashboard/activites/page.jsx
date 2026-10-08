import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth";
import { Button } from "@/components/ui/button";
import BusinessesManager from "@/components/businesses-manager";

const Page = async () => {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/");
  }
  if (session.user.mustChangePassword) {
    redirect("/dashboard/mon-compte");
  }
  // gestion des activités réservée à l'admin (l'API le vérifie aussi)
  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 p-4 md:p-8">
      <Link href="/dashboard" className="self-start">
        <Button variant="ghost">← Retour</Button>
      </Link>
      <div>
        <h1 className="text-2xl font-semibold">Activités</h1>
        <p className="text-sm text-gray-500">
          Le type d&apos;une activité détermine la section du tableau de bord où ses rapports sont comptés.
          Sans type, elle n&apos;apparaît dans aucune section (catégories du comptable comme « Autre » ou « Versement bancaire »).
        </p>
      </div>
      <BusinessesManager />
    </div>
  );
};

export default Page;
