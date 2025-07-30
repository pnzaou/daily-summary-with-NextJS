"use client";

import { LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const Header = ({userName}) => {
  const { data: session, status } = useSession()
  const router = useRouter()
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  if (status !== "authenticated") {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 w-full bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          <span className="text-lg font-semibold text-gray-800">
            Bonjour {userName}
          </span>

          <button
            onClick={() => signOut({})}
            className="text-gray-600 hover:text-red-600 transition-colors duration-200"
            title="Se déconnecter"
          >
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Header;
