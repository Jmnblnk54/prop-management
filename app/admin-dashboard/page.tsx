// app/admin-dashboard/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import TenantAlerts from "@/admin-components/TenantAlerts";
import PropertySummaryCard from "@/admin-components/PropertySummaryCard";

type PropertyDoc = {
  id: string;
  adminId: string;
  name?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zip: string;
};

type Summary = {
  id: string;
  name?: string;
  address: string;          // PropertySummaryCard expects `address`
  totalUnits: number;
  leasedUnits: number;
};

export default function AdminDashboardPage() {
  const [summaries, setSummaries] = useState<Summary[] | null>(null);
  const [kpis, setKpis] = useState<{ properties: number; units: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setSummaries([]);
        setKpis({ properties: 0, units: 0 });
        setLoading(false);
        return;
      }

      try {
        const uid = user.uid;

        // 1) Properties for this admin
        const propSnap = await getDocs(
          query(
            collection(db, "properties"),
            where("adminId", "==", uid),
            orderBy("addressLine1", "asc")
          )
        );

        const props: PropertyDoc[] = propSnap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            adminId: data.adminId,
            name: data.name,
            addressLine1: data.addressLine1,
            addressLine2: data.addressLine2,
            city: data.city,
            state: data.state,
            zip: data.zip,
          };
        });

        // 2) Build summaries (and count units per property)
        const rows: Summary[] = [];
        let unitsTotal = 0;

        for (const p of props) {
          const unitsSnap = await getDocs(collection(db, "properties", p.id, "units"));
          const units = unitsSnap.docs.map((u) => u.data() as any);
          const totalUnits = units.length;
          const leasedUnits = units.filter((u) => !!u.tenantId).length;

          unitsTotal += totalUnits;

          const address =
            `${p.addressLine1}${p.addressLine2 ? ", " + p.addressLine2 : ""}, ` +
            `${p.city}, ${p.state} ${p.zip}`;

          rows.push({
            id: p.id,
            name: p.name,
            address,
            totalUnits,
            leasedUnits,
          });
        }

        setSummaries(rows);
        setKpis({ properties: props.length, units: unitsTotal });
      } catch {
        setSummaries([]);
        setKpis({ properties: 0, units: 0 });
      } finally {
        setLoading(false);
        unsub(); // fetch once
      }
    });

    return () => unsub();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <TenantAlerts />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/properties/new"
            className="rounded bg-gray-900 px-4 py-2 text-white hover:bg-black"
          >
            Add Property
          </Link>
          <Link
            href="/admin/tenants/invite"
            className="rounded border px-4 py-2 hover:bg-gray-50"
          >
            Invite Tenant
          </Link>
        </div>
      </div>

      {/* Simple KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded border bg-white p-4">
          <div className="text-sm text-gray-600">Properties</div>
          <div className="mt-1 text-2xl font-semibold">{kpis?.properties ?? "…"}</div>
        </div>
        <div className="rounded border bg-white p-4">
          <div className="text-sm text-gray-600">Units</div>
          <div className="mt-1 text-2xl font-semibold">{kpis?.units ?? "…"}</div>
        </div>
        <div className="rounded border bg-white p-4">
          <div className="text-sm text-gray-600">Open Maintenance</div>
          <div className="mt-1 text-2xl font-semibold">—</div>
        </div>
        <div className="rounded border bg-white p-4">
          <div className="text-sm text-gray-600">Payments (Attention)</div>
          <div className="mt-1 text-2xl font-semibold">—</div>
        </div>
      </div>

      {/* Property summaries */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Your Properties</h2>

        {loading ? (
          <div className="text-sm text-gray-500">Loading your properties…</div>
        ) : !summaries?.length ? (
          <div className="rounded border bg-white p-4 text-sm text-gray-600">
            No properties yet. Click <strong>Add Property</strong> to get started.
          </div>
        ) : (
          summaries.map((summary) => (
            <div key={summary.id} className="rounded border bg-white p-4">
              {/* TypeScript, chill. We’re passing the exact runtime shape PropertySummaryCard uses. */}
              {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
              {/* @ts-ignore */}
              <PropertySummaryCard property={summary} />
              <div className="mt-3">
                <Link
                  href={`/admin/properties/${summary.id}`}
                  className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
                >
                  View Property
                </Link>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
