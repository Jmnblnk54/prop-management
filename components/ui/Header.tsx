"use client";

import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function Header() {
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <header className="w-full flex justify-between items-center p-4 border-b shadow-sm mb-6">
      <h1 className="text-xl font-bold">Dashboard</h1>
      {user && (
        <Button variant="outline" onClick={handleLogout}>
          Log Out
        </Button>
      )}
    </header>
  );
}
