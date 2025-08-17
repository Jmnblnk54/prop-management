"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
    addDoc,
    collection,
    collectionGroup,
    getCountFromServer,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    where,
    limit,
} from "firebase/firestore";

type Option = { value: string; label: string };

export default function NewPropertyPage() {
    const router = useRouter();

    // auth
    const [uid, setUid] = useState<string | null>(null);

    // existing state
    const [propCount, setPropCount] = useState<number | null>(null);
    const [nameOptions, setNameOptions] = useState<Option[]>([]);
    const [addr1Options, setAddr1Options] = useState<Option[]>([]);
    const isFirstProperty = useMemo(() => (propCount ?? 0) === 0, [propCount]);

    // form state
    const [name, setName] = useState("");
    const [addressLine1, setAddressLine1] = useState("");
    const [addressLine2, setAddressLine2] = useState("");
    const [city, setCity] = useState("");
    const [stateVal, setStateVal] = useState("");
    const [zip, setZip] = useState("");
    // Optional: create first unit right away (leave blank to skip)
    const [firstUnit, setFirstUnit] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // hydrate auth and fetch counts/options
    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, async (user) => {
            setUid(user?.uid ?? null);

            if (!user) {
                // redirect to login if unauthenticated
                router.push("/login?next=/admin/properties/new");
                return;
            }

            try {
                // Count properties for this admin (no index needed)
                const countSnap = await getCountFromServer(
                    query(collection(db, "properties"), where("adminId", "==", user.uid))
                );
                const count = countSnap.data().count;
                setPropCount(count);

                // If there are existing properties, fetch up to 50 to build dropdowns
                if (count > 0) {
                    const listSnap = await getDocs(
                        query(
                            collection(db, "properties"),
                            where("adminId", "==", user.uid),
                            orderBy("addressLine1", "asc"),
                            limit(50)
                        )
                    );

                    const names = new Set<string>();
                    const addr1s = new Set<string>();
                    listSnap.forEach((d) => {
                        const data = d.data() as any;
                        if (typeof data.name === "string" && data.name.trim()) names.add(data.name.trim());
                        if (typeof data.addressLine1 === "string" && data.addressLine1.trim())
                            addr1s.add(data.addressLine1.trim());
                    });

                    setNameOptions(Array.from(names).map((v) => ({ value: v, label: v })));
                    setAddr1Options(Array.from(addr1s).map((v) => ({ value: v, label: v })));
                } else {
                    setNameOptions([]);
                    setAddr1Options([]);
                }
            } catch {
                // Don’t crash UI on permission/index hiccups in dev
                setPropCount(0);
                setNameOptions([]);
                setAddr1Options([]);
            }
        });

        return () => unsubAuth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            if (!uid) {
                router.push("/login?next=/admin/properties/new");
                return;
            }

            if (!addressLine1.trim() || !city.trim() || !stateVal.trim() || !zip.trim()) {
                setError("Please fill Address Line 1, City, State, and ZIP.");
                return;
            }

            // Create property
            const propRef = await addDoc(collection(db, "properties"), {
                adminId: uid,
                name: name.trim() || null,
                addressLine1: addressLine1.trim(),
                addressLine2: addressLine2.trim() || null,
                city: city.trim(),
                state: stateVal.trim(),
                zip: zip.trim(),
                createdAt: serverTimestamp(),
            });

            // Optional: create first unit if provided
            if (firstUnit.trim()) {
                await addDoc(collection(db, "properties", propRef.id, "units"), {
                    adminId: uid,
                    propertyId: propRef.id,
                    unitNumber: firstUnit.trim(),
                    createdAt: serverTimestamp(),
                });
            }

            router.push("/admin-dashboard");
        } catch (err: any) {
            setError(err?.message || "Something went wrong while saving the property.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Add Property</h1>
            </div>

            <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
                {/* Property Name */}
                <div>
                    <label className="block text-sm text-gray-700">Property Name (optional)</label>

                    {/* Only show dropdown if there are existing properties */}
                    {isFirstProperty ? null : nameOptions.length ? (
                        <div className="mt-1 flex gap-2">
                            <select
                                className="w-1/2 rounded border px-3 py-2 text-sm"
                                onChange={(e) => setName(e.target.value)}
                                defaultValue=""
                            >
                                <option value="" disabled>
                                    Use previous name…
                                </option>
                                {nameOptions.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                            <input
                                className="w-1/2 rounded border px-3 py-2 text-sm"
                                placeholder="Or enter a new name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                    ) : (
                        <input
                            className="mt-1 w-full rounded border px-3 py-2 text-sm"
                            placeholder="e.g., Maple Grove Apartments"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    )}
                </div>

                {/* Address Line 1 */}
                <div>
                    <label className="block text-sm text-gray-700">Address Line 1</label>
                    {/* Only show dropdown if there are existing properties */}
                    {isFirstProperty ? null : addr1Options.length ? (
                        <div className="mt-1 flex gap-2">
                            <select
                                className="w-1/2 rounded border px-3 py-2 text-sm"
                                onChange={(e) => setAddressLine1(e.target.value)}
                                defaultValue=""
                            >
                                <option value="" disabled>
                                    Use previous address line 1…
                                </option>
                                {addr1Options.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                            <input
                                className="w-1/2 rounded border px-3 py-2 text-sm"
                                placeholder="Enter Address Line 1"
                                value={addressLine1}
                                onChange={(e) => setAddressLine1(e.target.value)}
                                required
                            />
                        </div>
                    ) : (
                        <input
                            className="mt-1 w-full rounded border px-3 py-2 text-sm"
                            placeholder="Enter Address Line 1"
                            value={addressLine1}
                            onChange={(e) => setAddressLine1(e.target.value)}
                            required
                        />
                    )}
                </div>

                {/* Address Line 2 (Suite / Unit) */}
                <div>
                    <label className="block text-sm text-gray-700">Address Line 2 (optional)</label>
                    <input
                        className="mt-1 w-full rounded border px-3 py-2 text-sm"
                        placeholder="Apt / Suite / Unit"
                        value={addressLine2}
                        onChange={(e) => setAddressLine2(e.target.value)}
                    />
                </div>

                {/* City / State / Zip */}
                <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                        <label className="block text-sm text-gray-700">City</label>
                        <input
                            className="mt-1 w-full rounded border px-3 py-2 text-sm"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-700">State</label>
                        <input
                            className="mt-1 w-full rounded border px-3 py-2 text-sm"
                            value={stateVal}
                            onChange={(e) => setStateVal(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-700">ZIP</label>
                        <input
                            className="mt-1 w-full rounded border px-3 py-2 text-sm"
                            value={zip}
                            onChange={(e) => setZip(e.target.value)}
                            required
                        />
                    </div>
                </div>

                {/* Optional: create a first Unit immediately */}
                <div>
                    <label className="block text-sm text-gray-700">Create First Unit (optional)</label>
                    <input
                        className="mt-1 w-full rounded border px-3 py-2 text-sm"
                        placeholder="e.g., Unit 1, Apt A, Suite 200"
                        value={firstUnit}
                        onChange={(e) => setFirstUnit(e.target.value)}
                    />
                    <div className="mt-1 text-xs text-gray-500">
                        If provided, this will create a unit under the property right away.
                    </div>
                </div>

                {error ? (
                    <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                        {error}
                    </div>
                ) : null}

                <div className="flex gap-2">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="rounded bg-gray-900 px-4 py-2 text-white hover:bg-black disabled:opacity-50"
                    >
                        {isSubmitting ? "Saving…" : "Save Property"}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.push("/admin-dashboard")}
                        className="rounded border px-4 py-2 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
