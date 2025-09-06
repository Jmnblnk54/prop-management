"use client";

import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  getCountFromServer,
  getDocs,
  limit,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { ensureAdminProfile } from "@/lib/ensureAdmin";
const TenantAlerts = lazy(() => import("@/admin-components/TenantAlerts"));
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

type PropertyWithUnits = PropertyDoc & {
  unitsCount: number;
  firstUnitId: string | null; // only set when unitsCount === 1
};

const COLORS = {
  primary: "#1E67A2",
  soft: "#A0BBD6",
  cardHeaderBg: "#EDF2FA",
  headerBg: "#EAF1F8",
  border: "#A0BBD6",
};

function Skeleton() {
  return (
    <main className="mx-auto w-full max-w-2xl p-6 space-y-6" aria-busy="true" aria-live="polite">
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
  const router = useRouter();
  const search = useSearchParams();
  const waitForId = search.get("waitFor") || null;

  const [stats, setStats] = useState<Stat[] | null>(null);
  const [properties, setProperties] = useState<PropertyWithUnits[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeoutReached, setTimeoutReached] = useState(false);

  useEffect(() => {
    const el = document.getElementById("page-title");
    el?.focus();
  }, []);

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

          // Load properties for this admin
          const snap = await getDocs(
            query(collection(db, "properties"), where("adminId", "==", user.uid))
          );

          const base: PropertyDoc[] = snap.docs.map((d) => {
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

          // For each property, get units count (and first unit id if exactly one)
          const withCounts: PropertyWithUnits[] = await Promise.all(
            base.map(async (p) => {
              const unitsCol = collection(db, "properties", p.id, "units");
              const cSnap = await getCountFromServer(query(unitsCol));
              const unitsCount = cSnap.data().count;

              let firstUnitId: string | null = null;
              if (unitsCount === 1) {
                const firstSnap = await getDocs(query(unitsCol, limit(1)));
                firstUnitId = firstSnap.docs[0]?.id ?? null;
              }

              return { ...p, unitsCount, firstUnitId };
            })
          );

          withCounts.sort((a, b) => (a.addressLine1 || "").localeCompare(b.addressLine1 || ""));
          setProperties(withCounts);

          // KPIs
          const propertiesKPI = withCounts.length;
          const unitsKPI = withCounts.reduce((sum, p) => sum + p.unitsCount, 0);
          setStats([
            { label: "Properties", value: propertiesKPI },
            { label: "Units", value: unitsKPI },
            { label: "Open Maintenance", value: 0 },
            { label: "Payments (Attention)", value: 0 },
          ]);
        } catch (e) {
          console.error("[Dashboard] load error:", e);
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

  // Click behavior (FIXED overview route):
  // 0 units → create default "Home" then /property/[id]/unit/[unitId]
  // 1 unit → /property/[id]/unit/[unitId]
  // 2+ units → /admin/property/[id]
  const onOpenProperty = async (p: PropertyWithUnits) => {
    const u = auth.currentUser;
    if (!u) {
      router.push("/login");
      return;
    }
    try {
      await ensureAdminProfile(u);

      if (p.unitsCount === 1 && p.firstUnitId) {
        router.push(`/property/${p.id}/unit/${p.firstUnitId}`);
        return;
      }

      if (p.unitsCount === 0) {
        const unitRef = await addDoc(collection(db, "properties", p.id, "units"), {
          adminId: u.uid,
          propertyId: p.id,
          unitNumber: "Home",
          isStandalone: true,
          createdAt: serverTimestamp(),
        });
        router.push(`/property/${p.id}/unit/${unitRef.id}`);
        return;
      }

      // 2+ units → property overview (admin namespace)
      router.push(`/admin/property/${p.id}`);
    } catch (e) {
      console.error("[Dashboard] open property error:", e);
      router.push(`/admin/property/${p.id}`);
    }
  };

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
      <main
        className="mx-auto w-full max-w-2xl p-6 space-y-6"
        aria-labelledby="page-title"
      >
        <h1 id="page-title" tabIndex={-1} className="sr-only">
          Admin dashboard
        </h1>

        <Suspense
          fallback={
            <div role="status" aria-live="polite" className="text-sm text-gray-500">
              Loading alerts…
            </div>
          }
        >
          <TenantAlerts />
        </Suspense>

        {/* KPI cards */}
        <ul role="list" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visibleStats.map((s) => {
            const idBase = `stat-${s.label.replace(/\s+/g, "-").toLowerCase()}`;
            return (
              <li
                key={s.label}
                role="listitem"
                aria-labelledby={`${idBase}-label`}
                aria-describedby={`${idBase}-value`}
                className="rounded border bg-white"
                style={{ borderColor: COLORS.border }}
              >
                <div
                  id={`${idBase}-label`}
                  className="px-4 h-10 flex items-center text-sm"
                  style={{ backgroundColor: COLORS.cardHeaderBg, color: "#000" }}
                >
                  {s.label}
                </div>
                <div
                  id={`${idBase}-value`}
                  className="px-4 py-3 text-2xl font-semibold text-gray-900"
                >
                  {s.value}
                </div>
              </li>
            );
          })}
        </ul>

        {waitingForNew && !newPropPresent && timeoutReached ? (
          <div
            role="status"
            aria-live="polite"
            className="rounded border p-3 text-sm"
            style={{ borderColor: "#FACC15", backgroundColor: "#FFFBEB", color: "#713F12" }}
          >
            We’re still syncing your new property. It should appear shortly.
          </div>
        ) : null}

        <section className="space-y-4" aria-labelledby="props-heading">
          <div
            className="rounded border"
            style={{ borderColor: COLORS.border, backgroundColor: COLORS.headerBg }}
          >
            <div className="flex items-center justify-between px-4 py-2">
              <h2 id="props-heading" className="text-lg font-semibold text-gray-900">
                Your Properties
              </h2>
              <Link
                href="/admin/properties/new"
                className="rounded border px-3 py-1 text-sm"
                aria-label="Add a new property"
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
            <ul role="list" className="grid gap-3 md:grid-cols-2">
              {properties.map((p) => (
                <li
                  key={p.id}
                  role="listitem"
                  className="rounded border bg-white"
                  style={{ borderColor: COLORS.border }}
                >
                  <div
                    className="px-4 h-10 flex items-center text-sm"
                    style={{ backgroundColor: COLORS.cardHeaderBg, color: "#000" }}
                  >
                    {p.name?.trim() || "Unnamed Property"}
                  </div>

                  <div className="px-4 py-3 text-sm text-gray-900">
                    <div className="font-medium">{p.addressLine1}</div>
                    <div className="text-gray-700">
                      {p.city}, {p.state} {p.zip}
                    </div>
                    <div
                      className="mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs ring-1 ring-inset"
                      style={{ color: COLORS.primary, borderColor: COLORS.soft }}
                    >
                      Units: {p.unitsCount}
                    </div>
                  </div>

                  <div className="px-4 pb-4">
                    <button
                      type="button"
                      onClick={() => onOpenProperty(p)}
                      className="rounded border px-3 py-1 text-sm"
                      aria-label={
                        p.unitsCount === 0
                          ? `Create unit and open ${p.addressLine1}`
                          : p.unitsCount === 1
                            ? `Open unit for ${p.addressLine1}`
                            : `Open property ${p.addressLine1}`
                      }
                      style={{ borderColor: COLORS.soft, color: COLORS.primary }}
                    >
                      {p.unitsCount <= 1 ? "Open Unit" : "View Property"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </RoleGate>
  );
}
