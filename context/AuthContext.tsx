"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { ensureAdminProfile } from "@/lib/ensureAdmin";

type AppUser = { role: "admin" | "admin2" | "tenant" } | null;

type Ctx = {
  user: FirebaseUser | null;
  appUser: AppUser;
  loading: boolean;
};

const C = createContext<Ctx>({ user: null, appUser: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) {
        setAppUser(null);
        setLoading(false);
        return;
      }

      try {
        await ensureAdminProfile(u);
        const snap = await getDoc(doc(db, "admins", u.uid));
        if (snap.exists()) {
          const d = snap.data() as any;
          const role = (d?.role ?? "tenant") as "admin" | "admin2" | "tenant";
          setAppUser({ role });
        } else {
          setAppUser({ role: "tenant" });
        }
      } catch {
        setAppUser({ role: "tenant" });
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  return <C.Provider value={{ user, appUser, loading }}>{children}</C.Provider>;
}

export function useAuth() {
  return useContext(C);
}
