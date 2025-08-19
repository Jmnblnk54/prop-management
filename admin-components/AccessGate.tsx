"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { ensureAdminProfile } from "@/lib/ensureAdmin";

type Role = "admin" | "admin2";

export default function AccessGate({
    children,
    requiredRole,
    loginPath = "/login?next=/admin-dashboard",
}: {
    children: React.ReactNode;
    requiredRole?: Role;
    loginPath?: string;
}) {
    const router = useRouter();
    const [ready, setReady] = useState(false);
    const [ok, setOk] = useState(false);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            if (!u) {
                router.push(loginPath);
                return;
            }
            (async () => {
                await ensureAdminProfile(u);
                let role: Role = "admin";
                try {
                    const snap = await getDoc(doc(db, "admins", u.uid));
                    role = ((snap.data() as any)?.role ?? "admin") as Role;
                } catch {
                    role = "admin";
                }
                setOk(requiredRole ? role === requiredRole : true);
                setReady(true);
            })();
        });
        return () => unsub();
    }, [router, loginPath, requiredRole]);

    if (!ready) {
        return (
            <div className="p-6">
                <div className="h-6 w-40 rounded bg-gray-200 animate-pulse" />
                <div className="mt-4 h-40 rounded bg-gray-200 animate-pulse" />
            </div>
        );
    }
    if (!ok) return null;
    return <>{children}</>;
}
