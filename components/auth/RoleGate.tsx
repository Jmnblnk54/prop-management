"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

type Role = "admin" | "admin2" | "tenant";

export default function RoleGate({
  allowed,
  children,
}: {
  allowed: Role[];
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, appUser, loading } = useAuth();

  const [ready, setReady] = useState(false);
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push(`/login?next=${encodeURIComponent(pathname || "/")}`);
      return;
    }

    (async () => {
      let role: Role | undefined = appUser?.role as Role | undefined;

      if (!role) {
        try {
          const snap = await getDoc(doc(db, "admins", user.uid));
          role = (snap.exists() ? (snap.data() as any).role : "tenant") as Role;
        } catch {
          role = "tenant";
        }
      }

      setGranted(allowed.includes(role as Role));
      setReady(true);

      if (!allowed.includes(role as Role)) {
        router.push("/access-denied");
      }
    })();
  }, [loading, user, appUser, allowed, router, pathname]);

  if (!ready) return null;
  if (!granted) return null;

  return <>{children}</>;
}
