"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  getCountFromServer,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { ensureAdminProfile } from "@/lib/ensureAdmin";
import TenantAlerts from "@/admin-components/TenantAlerts";
import RoleGate from "@/components/auth/RoleGate";

type Stat = { label: string; value: number | string };

type PropertyDoc = {
  id: string;
  adminId: string;
  name?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  zip: string;
};

type PropertyWithUnits = PropertyDoc & { unitsCount: number };

const COLORS = {
  primary: "#1E67A2",
  soft: "#A0BBD6",
  cardHeaderBg: "#EDF2FA",
  headerBg: "#EAF1F8",
  border: "#A0BBD6",
};

function Skeleton() {
  return (
    <main className="mx-auto w-full max-w-2xl p-6 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded border bg-white p-4">
            <div className="h-3 w-24 rounded bg-gray-200" />
            <div className="mt-3 h-7 w-16 rounded bg-gray-200" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <div className="h-5 w-40 rounded bg-gray-200" />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded border bg-white p-4">
              <div className="h-4 w-48 rounded bg-gray-200" />
              <div className="mt-2 h-3 w-64 rounded bg-gray-200" />
              <div className="mt-4 h-8 w-28 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default function AdminDashboardPage() {
  const search = useSearchParams();
  const waitForId = search.get("waitFor") || null;

  const [stats, setStats] = useState<Stat[] | null>(null);
  const [properties, setProperties] = useState<PropertyWithUnits[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeoutReached, setTimeoutReached] = useState(false);

  useEffect(() => {
    if (!waitForId) return;
    const t = setTimeout(() => setTimeoutReached(true), 7000);
    return () => clearTimeout(t);
  }, [waitForId]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setStats([
          { label: "Properties", value: 0 },
          { label: "Units", value: 0 },
          { label: "Open Maintenance", value: 0 },
          { label: "Payments (Attention)", value: 0 },
        ]);
        setProperties([]);
        setLoading(false);
        return;
      }

      (async () => {
        try {
          await ensureAdminProfile(user);

          const snap = await getDocs(
            query(collection(db, "properties"), where("adminId", "==", user.uid))
          );

          const raw: PropertyDoc[] = snap.docs.map((d) => {
            const x = d.data() as any;
            return {
              id: d.id,
              adminId: x.adminId,
              name: x.name ?? null,
              addressLine1: (x.addressLine1 || "").trim(),
              addressLine2: x.addressLine2 ?? null,
              city: (x.city || "").trim(),
              state: (x.state || "").trim(),
              zip: (x.zip || "").trim(),
            };
          });

          // Group all docs by full address (one card per address), then sum units across the group.
          const byAddr = new Map<string, PropertyDoc[]>();
          for (const p of raw) {
            const key = `${p.addressLine1.toLowerCase()}|${p.city.toLowerCase()}|${p.state.toLowerCase()}|${p.zip}`;
            const arr = byAddr.get(key) || [];
            arr.push(p);
            byAddr.set(key, arr);
          }

          const grouped: PropertyWithUnits[] = [];
          for (const [, docs] of byAddr.entries()) {
            // Prefer the newly created doc as the representative to satisfy waitFor spinner.
            const rep =
              (waitForId && docs.find((d) => d.id === waitForId)) || docs[0];

            // Sum units across *all* docs that match this address.
            let sum = 0;
            for (const d of docs) {
              try {
                const cSnap = await getCountFromServer(
                  query(
                    collection(db, "properties", d.id, "units"),
                    where("adminId", "==", user.uid)
                  )
                );
                sum += cSnap.data().count;
              } catch {
                // ignore
              }
            }

            grouped.push({ ...rep, unitsCount: sum });
          }

          // Sort cards by address line 1 for consistency.
          grouped.sort((a, b) =>
            (a.addressLine1 || "").localeCompare(b.addressLine1 || "")
          );

          setProperties(grouped);

          // KPI: Properties = unique groups by (name || addressLine1)
          const propKeys = new Set<string>();
          for (const p of grouped) {
            const key = (p.name?.trim() || p.addressLine1).toLowerCase();
            propKeys.add(key);
          }
          const propertiesKPI = propKeys.size;

          // KPI: Units = sum(unitsCount if >0 else 1 for standalone)
          let unitsKPI = 0;
          for (const p of grouped) unitsKPI += p.unitsCount > 0 ? p.unitsCount : 1;

          const maintKPI = 0;
          const paymentsKPI = 0;

          setStats([
            { label: "Properties", value: propertiesKPI },
            { label: "Units", value: unitsKPI },
            { label: "Open Maintenance", value: maintKPI },
            { label: "Payments (Attention)", value: paymentsKPI },
          ]);
        } catch {
          setProperties([]);
          setStats([
            { label: "Properties", value: "…" },
            { label: "Units", value: "…" },
            { label: "Open Maintenance", value: "…" },
            { label: "Payments (Attention)", value: "…" },
          ]);
        } finally {
          setLoading(false);
        }
      })();
    });

    return () => unsub();
  }, [waitForId]);

  const waitingForNew = Boolean(waitForId);
  const newPropPresent = useMemo(
    () => (waitForId && properties ? properties.some((p) => p.id === waitForId) : false),
    [waitForId, properties]
  );
  const showSkeleton =
    loading || (waitingForNew && !newPropPresent && !timeoutReached);

  // Cards are grouped visually by property name; one card per Address Line 1
  const groups = useMemo(() => {
    const byName = new Map<string, PropertyWithUnits[]>();
    for (const p of properties ?? []) {
      const key = (p.name?.trim() || "Unnamed Property").toLowerCase();
      const arr = byName.get(key) || [];
      arr.push(p);
      byName.set(key, arr);
    }
    return Array.from(byName.entries())
      .map(([key, arr]) => ({
        name: arr[0]?.name?.trim() || "Unnamed Property",
        items: arr,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [properties]);

  if (showSkeleton) return <Skeleton />;

  const visibleStats = (stats ??
    [
      { label: "Properties", value: "…" },
      { label: "Units", value: "…" },
      { label: "Open Maintenance", value: "…" },
      { label: "Payments (Attention)", value: "…" },
    ]) as Stat[];

  return (
    <RoleGate allowed={["admin"]}>
      <main className="mx-auto w-full max-w-2xl p-6 space-y-6">
        <TenantAlerts />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visibleStats.map((s) => (
            <div
              key={s.label}
              className="rounded border bg-white"
              style={{ borderColor: COLORS.border }}
            >
              <div
                className="px-4 h-10 flex items-center text-sm"
                style={{ backgroundColor: COLORS.cardHeaderBg, color: "#000" }}
              >
                {s.label}
              </div>
              <div className="px-4 py-3 text-2xl font-semibold text-gray-900">
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {waitingForNew && !newPropPresent && timeoutReached ? (
          <div
            className="rounded border p-3 text-sm"
            style={{ borderColor: "#FACC15", backgroundColor: "#FFFBEB", color: "#713F12" }}
          >
            We’re still syncing your new property. It should appear shortly.
          </div>
        ) : null}

        <section className="space-y-4">
          <div
            className="rounded border"
            style={{ borderColor: COLORS.border, backgroundColor: COLORS.headerBg }}
          >
            <div className="flex items-center justify-between px-4 py-2">
              <h2 className="text-lg font-semibold text-gray-900">Your Properties</h2>
              <Link
                href="/admin/properties/new"
                className="rounded border px-3 py-1 text-sm"
                style={{ borderColor: COLORS.soft, color: COLORS.primary }}
              >
                + Add Property
              </Link>
            </div>
          </div>

          {!properties?.length ? (
            <div
              className="rounded border bg-white p-4 text-sm text-gray-900"
              style={{ borderColor: COLORS.border }}
            >
              No properties yet. Click <strong>+ Add Property</strong> to get started.
            </div>
          ) : (
            <div className="space-y-6">
              {groups.map((g) => (
                <div key={g.name} className="space-y-3">
                  <div
                    className="rounded border px-4 py-2"
                    style={{ borderColor: COLORS.border, backgroundColor: COLORS.cardHeaderBg }}
                  >
                    <div className="font-medium text-gray-900">{g.name}</div>
                  </div>

                  <ul className="grid gap-3 md:grid-cols-2">
                    {g.items.map((p) => (
                      <li
                        key={p.id}
                        className="rounded border bg-white"
                        style={{ borderColor: COLORS.border }}
                      >
                        <div
                          className="px-4 h-10 flex items-center text-sm"
                          style={{ backgroundColor: COLORS.cardHeaderBg, color: "#000" }}
                        >
                          {p.addressLine1}
                        </div>
                        <div className="px-4 py-3 text-sm text-gray-900">
                          <div>
                            {p.city}, {p.state} {p.zip}
                          </div>
                          {p.unitsCount > 0 ? (
                            <div
                              className="mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs ring-1 ring-inset"
                              style={{ color: COLORS.primary, borderColor: COLORS.soft }}
                            >
                              Units: {p.unitsCount}
                            </div>
                          ) : null}
                        </div>
                        <div className="px-4 pb-4">
                          <Link
                            href={`/admin/property/${p.id}`}
                            className="rounded border px-3 py-1 text-sm"
                            style={{ borderColor: COLORS.soft, color: COLORS.primary }}
                          >
                            View Property
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </RoleGate>
  );
}
