import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth";
import { Button } from "@/components/ui/button";
import UsersManager from "@/components/users-manager";

const Page = async () => {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/");
  }
  if (session.user.mustChangePassword) {
    redirect("/dashboard/mon-compte");
  }
  // gestion des utilisateurs réservée à l'admin et au comptable (l'API le vérifie aussi)
  if (!["admin", "comptable"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 p-4 md:p-8">
      <Link href="/dashboard" className="self-start">
        <Button variant="ghost">← Retour</Button>
      </Link>
      <div>
        <h1 className="text-2xl font-semibold">Utilisateurs</h1>
        <p className="text-sm text-gray-500">
          {session.user.role === "admin"
            ? "Vous pouvez gérer tous les comptes."
            : "Vous pouvez gérer les comptes des gérants ; les autres comptes sont en lecture seule."}
        </p>
      </div>
      <UsersManager currentUserId={session.user.id} />
    </div>
  );
};

export default Page;
