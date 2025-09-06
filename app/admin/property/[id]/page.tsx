"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, query } from "firebase/firestore";
import RoleGate from "@/components/auth/RoleGate";
import { ensureAdminProfile } from "@/lib/ensureAdmin";
import { COLORS } from "@/lib/constants";

type UnitDoc = {
  id: string | null; // null = virtual row when standalone
  unitNumber: string;
  tenantSince?: any | null;
  unoccupiedSince?: any | null;
  leaseEndDate?: any | null;
  delinquent?: boolean | null;
  maintReqOpenCount?: number | null;
};

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

function fmtDate(ts: any) {
  if (!ts) return "—";
  const ms =
    typeof ts?.toDate === "function"
      ? ts.toDate().getTime()
      : typeof ts?.seconds === "number"
        ? ts.seconds * 1000
        : Number(ts);
  if (!ms || Number.isNaN(ms)) return "—";
  return new Date(ms).toLocaleDateString();
}

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [prop, setProp] = useState<PropertyDoc | null>(null);
  const [units, setUnits] = useState<UnitDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/login");
        return;
      }
      try {
        setLoading(true);
        await ensureAdminProfile(u);

        const pSnap = await getDoc(doc(db, "properties", id));
        if (!pSnap.exists()) {
          setErr("Property not found.");
          setProp(null);
          setUnits([]);
          return;
        }
        const x = pSnap.data() as any;
        const property: PropertyDoc = {
          id,
          adminId: x.adminId,
          name: x.name ?? null,
          addressLine1: (x.addressLine1 || "").trim(),
          addressLine2: x.addressLine2 ?? null,
          city: (x.city || "").trim(),
          state: (x.state || "").trim(),
          zip: (x.zip || "").trim(),
        };
        setProp(property);

        // Load units for this property
        const uSnap = await getDocs(query(collection(db, "properties", id, "units")));
        let list: UnitDoc[] = uSnap.docs.map((d) => {
          const r = d.data() as any;
          return {
            id: d.id,
            unitNumber: (r.unitNumber || "").trim() || "—",
            tenantSince: r.tenantSince ?? null,
            unoccupiedSince: r.unoccupiedSince ?? null,
            leaseEndDate: r.leaseEndDate ?? null,
            delinquent: typeof r.delinquent === "boolean" ? r.delinquent : null,
            maintReqOpenCount:
              typeof r.maintReqOpenCount === "number" ? r.maintReqOpenCount : null,
          };
        });

        if (!list.length) {
          list = [
            {
              id: null,
              unitNumber: "—",
              tenantSince: null,
              unoccupiedSince: null,
              leaseEndDate: null,
              delinquent: null,
              maintReqOpenCount: null,
            },
          ];
        }

        list.sort((a, b) =>
          (a.unitNumber || "").localeCompare(b.unitNumber || "")
        );
        setUnits(list);
      } catch (e: any) {
        setErr(e?.message || "Failed to load property.");
        setProp(null);
        setUnits([]);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [id, router]);

  const title = useMemo(() => {
    if (!prop) return "Property";
    return prop.name?.trim() || "Unnamed Property";
  }, [prop]);

  if (loading) {
    return (
      <RoleGate allowed={["admin"]}>
        <main className="mx-auto w-full max-w-6xl p-6 space-y-6">
          <div className="animate-pulse space-y-3">
            <div className="h-7 w-2/3 bg-gray-200 rounded" />
            <div className="h-4 w-1/2 bg-gray-200 rounded" />
          </div>
          <div className="rounded border bg-white" style={{ borderColor: COLORS.border }}>
            <div className="px-4 py-2 text-sm" style={{ backgroundColor: COLORS.cardHeaderBg }}>
              Units
            </div>
            <div className="p-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-9 bg-gray-100 rounded" />
              ))}
            </div>
          </div>
        </main>
      </RoleGate>
    );
  }

  if (err) {
    return (
      <RoleGate allowed={["admin"]}>
        <main className="mx-auto w-full max-w-6xl p-6 space-y-6">
          <div className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{err}</div>
          <Link href="/admin-dashboard" className="text-sm underline hover:no-underline">
            ← Back to Dashboard
          </Link>
        </main>
      </RoleGate>
    );
  }

  if (!prop) return null;

  return (
    <RoleGate allowed={["admin"]}>
      <main className="mx-auto w-full max-w-6xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/admin-dashboard" className="text-sm underline hover:no-underline">
            ← Dashboard
          </Link>
          <Link href="/admin/properties/new" className="text-sm underline hover:no-underline">
            + Add Property
          </Link>
        </div>

        <section className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h1>
          <div className="text-gray-900">{prop.addressLine1}</div>
        </section>

        <section className="rounded border bg-white" style={{ borderColor: COLORS.border }}>
          <div
            className="px-4 py-2 text-sm"
            style={{ backgroundColor: COLORS.cardHeaderBg, color: "#000" }}
          >
            Units
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[56rem]"><thead>
              <tr className="text-left">
                <th className="px-4 py-2 border-b whitespace-nowrap" style={{ borderColor: COLORS.border }}>
                  Unit
                </th>
                <th className="px-4 py-2 border-b whitespace-nowrap" style={{ borderColor: COLORS.border }}>
                  Tenant Since
                </th>
                <th className="px-4 py-2 border-b whitespace-nowrap" style={{ borderColor: COLORS.border }}>
                  Unoccupied Since / Lease End
                </th>
                <th className="px-4 py-2 border-b whitespace-nowrap" style={{ borderColor: COLORS.border }}>
                  Delinquent
                </th>
                <th className="px-4 py-2 border-b whitespace-nowrap" style={{ borderColor: COLORS.border }}>
                  Maint. Req
                </th>
                <th className="px-4 py-2 border-b" style={{ borderColor: COLORS.border }} />
              </tr>
            </thead><tbody>
                {units.map((u) => {
                  const when =
                    u.unoccupiedSince
                      ? fmtDate(u.unoccupiedSince)
                      : u.leaseEndDate
                        ? fmtDate(u.leaseEndDate)
                        : "—";
                  const delinquent =
                    typeof u.delinquent === "boolean"
                      ? u.delinquent
                        ? "Yes"
                        : "No"
                      : "No";
                  const maint =
                    typeof u.maintReqOpenCount === "number"
                      ? u.maintReqOpenCount > 0
                        ? `${u.maintReqOpenCount}`
                        : "0"
                      : "0";

                  return (
                    <tr key={u.id ?? `virtual`} className="odd:bg-white even:bg-gray-50">
                      <td
                        className="px-4 py-2 border-b text-gray-900 whitespace-nowrap"
                        style={{ borderColor: COLORS.border }}
                      >
                        {u.unitNumber || "—"}
                      </td>
                      <td
                        className="px-4 py-2 border-b text-gray-900 whitespace-nowrap"
                        style={{ borderColor: COLORS.border }}
                      >
                        {fmtDate(u.tenantSince)}
                      </td>
                      <td
                        className="px-4 py-2 border-b text-gray-900 whitespace-nowrap"
                        style={{ borderColor: COLORS.border }}
                      >
                        {when}
                      </td>
                      <td className="px-4 py-2 border-b whitespace-nowrap" style={{ borderColor: COLORS.border }}>
                        {delinquent}
                      </td>
                      <td className="px-4 py-2 border-b whitespace-nowrap" style={{ borderColor: COLORS.border }}>
                        {maint}
                      </td>
                      <td className="px-4 py-2 border-b text-right" style={{ borderColor: COLORS.border }}>
                        {u.id ? (
                          <Link
                            href={`/admin/property/${prop.id}/unit/${u.id}`}
                            className="rounded border px-3 py-1 text-xs"
                            style={{ borderColor: COLORS.soft, color: COLORS.primary }}
                          >
                            Unit Detail
                          </Link>
                        ) : (
                          <button
                            className="rounded border px-3 py-1 text-xs opacity-50 cursor-not-allowed"
                            style={{ borderColor: COLORS.soft, color: COLORS.primary }}
                            disabled
                            title="Add a unit to enable details"
                          >
                            Unit Detail
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody></table>
          </div>
        </section>
      </main>
    </RoleGate>
  );
}
