"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import {
    collection,
    getDocs,
    query,
    where,
    doc,
    getDoc,
    orderBy,
    getCountFromServer,
} from "firebase/firestore";
import type { PropertyDoc } from "@/admin-interfaces/Property";
import UnitsSubtable from "@/admin-components/UnitsSubtable";

type Row = PropertyDoc & { unitsCount: number };

export default function PropertyTable() {
    const [rows, setRows] = useState<Row[]>([]);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);

    const uid = useMemo(() => auth.currentUser?.uid ?? null, []);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                // Ensure we have a user; if not (rare), wait a moment for auth to hydrate
                let userId = uid;
                if (!userId) {
                    // One cheap re-check; avoids wiring a full onAuthStateChanged for now
                    userId = auth.currentUser?.uid ?? null;
                }
                if (!userId) {
                    setRows([]);
                    return;
                }

                // Fetch all properties owned by this admin
                const propQ = query(
                    collection(db, "properties"),
                    where("adminId", "==", userId),
                    orderBy("addressLine1", "asc")
                );
                const propSnap = await getDocs(propQ);

                // Compute units count per property via subcollection count()
                const withCounts: Row[] = [];
                for (const p of propSnap.docs) {
                    const prop = { id: p.id, ...(p.data() as any) } as PropertyDoc;
                    const unitsColl = collection(db, "properties", p.id, "units");
                    let count = 0;
                    try {
                        const aggregate = await getCountFromServer(unitsColl);
                        count = aggregate.data().count;
                    } catch {
                        // Fallback: naive list (only if necessary)
                        const uSnap = await getDocs(unitsColl);
                        count = uSnap.size;
                    }
                    withCounts.push({ ...prop, unitsCount: count });
                }

                if (!alive) return;
                setRows(withCounts);
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
        // We intentionally run once on mount; dashboard will refetch on re-mount / back nav
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (loading) {
        return <div className="text-sm text-gray-500">Loading your properties…</div>;
    }

    return (
        <div className="overflow-x-auto rounded border">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-gray-50 text-left text-gray-600">
                        <th className="px-3 py-2 w-10"></th>
                        <th className="px-3 py-2">Property</th>
                        <th className="px-3 py-2">Address</th>
                        <th className="px-3 py-2">Units</th>
                        <th className="px-3 py-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {!rows.length ? (
                        <tr>
                            <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                                No properties yet. Click <strong>Add Property</strong> to get started.
                            </td>
                        </tr>
                    ) : (
                        rows.map((r) => {
                            const isOpen = !!expanded[r.id];
                            const toggle = () =>
                                setExpanded((e) => ({ ...e, [r.id]: !e[r.id] }));

                            const line1 = r.addressLine1;
                            const ad2 = r.addressLine2 ? `, ${r.addressLine2}` : "";
                            const full = `${line1}${ad2}, ${r.city}, ${r.state} ${r.zip}`;

                            return (
                                <tr key={r.id} className="border-t align-top">
                                    <td className="px-3 py-2">
                                        <button
                                            type="button"
                                            onClick={toggle}
                                            className="rounded border px-2 py-1 text-xs"
                                            aria-expanded={isOpen}
                                            aria-controls={`units-${r.id}`}
                                        >
                                            {isOpen ? "Hide" : "Show"} units
                                        </button>
                                    </td>
                                    <td className="px-3 py-2">
                                        {r.name ? <span className="font-medium">{r.name}</span> : <span>—</span>}
                                    </td>
                                    <td className="px-3 py-2">{full}</td>
                                    <td className="px-3 py-2">{r.unitsCount}</td>
                                    <td className="px-3 py-2">
                                        <Link
                                            href={`/admin/properties/${r.id}`}
                                            className="mr-2 underline"
                                        >
                                            View property
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>

            {/* Expanded unit subtables */}
            {rows.map((r) =>
                expanded[r.id] ? (
                    <div key={`expand-${r.id}`} id={`units-${r.id}`} className="border-t bg-white">
                        <div className="px-3 py-2 text-xs text-gray-600">Units for {r.addressLine1}</div>
                        <UnitsSubtable propertyId={r.id} />
                    </div>
                ) : null
            )}
        </div>
    );
}
