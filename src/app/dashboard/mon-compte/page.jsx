import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ChangePasswordForm from "@/components/change-password-form";
import { ROLE_LABELS } from "@/lib/roles";

const Page = async () => {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/");
  }
  const { name, email, role, mustChangePassword } = session.user;

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="flex w-full max-w-md flex-col gap-4">
        {!mustChangePassword && (
          <Link href="/dashboard" className="self-start">
            <Button variant="ghost">← Retour</Button>
          </Link>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Mon compte</CardTitle>
            <CardDescription>
              {name} · {email} · {ROLE_LABELS[role] ?? role}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {mustChangePassword && (
              <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
                Votre mot de passe est provisoire : choisissez-en un nouveau pour accéder à l&apos;application.
              </p>
            )}
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Page;
