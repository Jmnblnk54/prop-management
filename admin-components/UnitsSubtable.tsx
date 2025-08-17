"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UnitDoc } from "@/admin-interfaces/Unit";

export default function UnitsSubtable({ propertyId }: { propertyId: string }) {
    const [units, setUnits] = useState<UnitDoc[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const q = query(
                    collection(db, "properties", propertyId, "units"),
                    orderBy("unitNumber", "asc")
                );
                const snap = await getDocs(q);
                if (!alive) return;
                const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as UnitDoc[];
                setUnits(rows);
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [propertyId]);

    if (loading) {
        return <div className="p-3 text-sm text-gray-500">Loading units…</div>;
    }

    if (!units.length) {
        return (
            <div className="p-3 text-sm text-gray-500">
                No units yet.{" "}
                <Link href={`/admin/properties/${propertyId}`} className="underline">
                    Add a unit
                </Link>
                .
            </div>
        );
    }

    return (
        <div className="overflow-x-auto border-t">
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-left text-gray-600">
                        <th className="px-3 py-2">Unit</th>
                        <th className="px-3 py-2">Tenant</th>
                        <th className="px-3 py-2">Insurance</th>
                        <th className="px-3 py-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {units.map((u) => (
                        <tr key={u.id} className="border-t">
                            <td className="px-3 py-2">{u.unitNumber || "—"}</td>
                            <td className="px-3 py-2">{u.tenantId ? "Assigned" : "Vacant"}</td>
                            <td className="px-3 py-2">{u.insuranceStatus ?? "—"}</td>
                            <td className="px-3 py-2">
                                <Link href={`/admin/properties/${propertyId}`} className="underline">
                                    View property
                                </Link>
                                {/* You can add a dedicated unit detail route later */}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
