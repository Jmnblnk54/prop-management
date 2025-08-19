"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, getCountFromServer, query, where } from "firebase/firestore";
import { ensureAdminProfile } from "@/lib/ensureAdmin";

export default function TenantAlerts() {
  const [ready, setReady] = useState(false);
  const [counts, setCounts] = useState<{ maint: number; payments: number }>({ maint: 0, payments: 0 });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        setReady(true);
        return;
      }
      (async () => {
        try {
          await ensureAdminProfile(u);
          const [m, p] = await Promise.all([
            getCountFromServer(
              query(
                collection(db, "maintenanceRequests"),
                where("adminId", "==", u.uid),
                where("status", "in", ["open", "in_progress"])
              )
            ),
            getCountFromServer(
              query(collection(db, "payments"), where("adminId", "==", u.uid), where("status", "in", ["failed"]))
            ),
          ]);
          setCounts({ maint: m.data().count, payments: p.data().count });
        } catch {
          setCounts({ maint: 0, payments: 0 });
        } finally {
          setReady(true);
        }
      })();
    });
    return () => unsub();
  }, []);

  if (!ready) return null;
  const show = counts.maint > 0 || counts.payments > 0;
  if (!show) return null;

  return (
    <div className="rounded border bg-white p-4 text-sm">
      {counts.maint ? <div>{counts.maint} maintenance items need attention.</div> : null}
      {counts.payments ? <div>{counts.payments} payment issues detected.</div> : null}
    </div>
  );
}
