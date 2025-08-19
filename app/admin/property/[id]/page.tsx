"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import RoleGate from "@/components/auth/RoleGate";

type UnitDoc = { id: string; adminId: string; propertyId: string; unitNumber: string };

function normalize(p: any) {
  if (p?.address) {
    const a = p.address || {};
    return {
      name: p.name ?? null,
      adminId: p.adminId,
      address: {
        line1: a.line1 || "",
        line2: a.line2 ?? null,
        city: a.city || "",
        state: a.state || "",
        postalCode: a.postalCode || "",
        country: a.country ?? null,
      },
      type: p.type ?? null,
      isStandalone: p.isStandalone ?? null,
      unitsCount: p.unitsCount ?? null,
    };
  }
  return {
    name: p.name ?? null,
    adminId: p.adminId,
    address: {
      line1: p.addressLine1 || "",
      line2: p.addressLine2 ?? null,
      city: p.city || "",
      state: p.state || "",
      postalCode: p.zip || "",
      country: p.country ?? null,
    },
    type: p.type ?? null,
    isStandalone: p.isStandalone ?? null,
    unitsCount: p.unitsCount ?? null,
  };
}

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [prop, setProp] = useState<ReturnType<typeof normalize> | null>(null);
  const [units, setUnits] = useState<UnitDoc[]>([]);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/login");
        return;
      }
      try {
        setBusy(true);
        const pSnap = await getDoc(doc(db, "properties", id));
        if (!pSnap.exists()) {
          setErr("Property not found.");
          return;
        }
        setProp(normalize(pSnap.data()));
        const uSnap = await getDocs(
          query(collection(db, "properties", id, "units"), where("adminId", "==", u.uid))
        );
        const list: UnitDoc[] = uSnap.docs.map((d) => {
          const x = d.data() as any;
          return { id: d.id, adminId: x.adminId, propertyId: x.propertyId, unitNumber: x.unitNumber };
        });
        list.sort((a, b) => (a.unitNumber || "").localeCompare(b.unitNumber || ""));
        setUnits(list);
        setProp(p => (p ? { ...p, unitsCount: list.length } : p));
      } catch (e: any) {
        setErr(e?.message || "Failed to load property.");
      } finally {
        setBusy(false);
      }
    });
    return () => unsub();
  }, [id, router]);

  const HeaderSkeleton = () => (
    <div className="animate-pulse space-y-3">
      <div className="h-7 w-2/3 bg-gray-200 rounded" />
      <div className="h-4 w-1/3 bg-gray-200 rounded" />
      <div className="h-6 w-40 bg-gray-200 rounded" />
    </div>
  );

  const CardSkeleton = () => (
    <div className="animate-pulse rounded border bg-white p-4">
      <div className="h-5 w-1/3 bg-gray-200 rounded mb-4" />
      <div className="space-y-2">
        <div className="h-4 w-full bg-gray-200 rounded" />
        <div className="h-4 w-5/6 bg-gray-200 rounded" />
        <div className="h-4 w-4/6 bg-gray-200 rounded" />
      </div>
    </div>
  );

  const Badge = ({ kind }: { kind: "standalone" | "multi" }) => {
    const label = kind === "standalone" ? "Standalone" : "Multi-unit";
    const styles =
      kind === "standalone"
        ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
        : "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200";
    return <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${styles}`}>{label}</span>;
  };

  const UnitsPill = ({ count }: { count: number | null | undefined }) => (
    <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200">
      Units: {typeof count === "number" ? count : "—"}
    </span>
  );

  return (
    <RoleGate allowed={["admin"]}>
      <main className="mx-auto w-full max-w-2xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/admin/properties" className="text-sm underline hover:no-underline">
            ← Back to Properties
          </Link>
          <Link href="/admin-dashboard" className="text-sm underline hover:no-underline">
            Dashboard
          </Link>
        </div>

        <section className="space-y-2">
          {busy ? (
            <HeaderSkeleton />
          ) : err ? (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{err}</div>
          ) : prop ? (
            <>
              <h1 className="text-2xl md:text-3xl font-bold">{prop.name?.trim() || "Unnamed Property"}</h1>
              <p className="text-gray-600">
                {prop.address.line1}
                {prop.address.line2 ? `, ${prop.address.line2}` : ""},{" "}
                {prop.address.city}, {prop.address.state} {prop.address.postalCode}
                {prop.address.country ? `, ${prop.address.country}` : ""}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Badge kind={prop.isStandalone ? "standalone" : "multi"} />
                <UnitsPill count={prop.unitsCount} />
                {prop.type ? (
                  <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200">
                    Type: {prop.type}
                  </span>
                ) : null}
              </div>
            </>
          ) : null}
        </section>

        <section className="rounded border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Units</h2>
          {!units.length ? (
            <div className="text-sm text-gray-600">No units yet.</div>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {units.map((u) => (
                <li key={u.id} className="rounded border p-3">
                  <div className="font-medium">{u.unitNumber}</div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">What’s next?</h2>
          <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-1">
            <li>Invite your tenants for this property.</li>
            <li>{prop?.isStandalone ? "Set rent and lease details for this dwelling." : "Add units, then set rent and lease details per unit."}</li>
            <li>Upload lease documents and insurance information.</li>
          </ol>
        </section>
      </main>
    </RoleGate>
  );
}
