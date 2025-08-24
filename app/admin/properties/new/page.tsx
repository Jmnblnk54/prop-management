"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
    addDoc,
    collection,
    getCountFromServer,
    getDocs,
    query,
    serverTimestamp,
    where,
} from "firebase/firestore";
import { ensureAdminProfile } from "@/lib/ensureAdmin";

type Option = { value: string; label: string };

const isFiveDigitZip = (v: string) => /^\d{5}$/.test(v);
const trim = (v: any) => (typeof v === "string" ? v.trim() : "");

function normalizeRow(r: any, id?: string) {
    const a = r?.address || {};
    return {
        id,
        name: trim(r?.name) || null,
        addressLine1: trim(r?.addressLine1) || trim(a?.line1) || "",
        city: trim(r?.city) || trim(a?.city) || "",
        state: trim(r?.state) || trim(a?.state) || "",
        zip: trim(r?.zip) || trim(a?.postalCode) || "",
        createdAt: r?.createdAt || null,
    };
}

function tsSeconds(t: any): number {
    if (!t) return 0;
    if (typeof t?.seconds === "number") return t.seconds;
    if (typeof t?._seconds === "number") return t._seconds;
    return 0;
}

function useReactFormState(fields: {
    addressLine1: string;
    zip: string;
    city: string;
    stateVal: string;
    attemptedSubmit: boolean;
}) {
    const { addressLine1, zip, city, stateVal, attemptedSubmit } = fields;

    const invalid = useMemo(
        () => ({
            addressLine1: attemptedSubmit && !trim(addressLine1),
            zip:
                attemptedSubmit &&
                (!trim(zip) || !isFiveDigitZip(zip)),
            city: attemptedSubmit && !trim(city),
            stateVal:
                attemptedSubmit &&
                (!trim(stateVal) || trim(stateVal).length !== 2),
        }),
        [addressLine1, zip, city, stateVal, attemptedSubmit]
    );

    const messages = {
        addressLine1:
            invalid.addressLine1 ? "Address Line 1 is required." : "",
        zip: invalid.zip
            ? "ZIP must be a 5-digit code."
            : "",
        city: invalid.city ? "City is required." : "",
        stateVal:
            invalid.stateVal ? "State must be a 2-letter code." : "",
    };

    const isValid =
        !invalid.addressLine1 && !invalid.zip && !invalid.city && !invalid.stateVal;

    return { invalid, messages, isValid };
}

export default function NewPropertyPage() {
    const router = useRouter();

    const [propCount, setPropCount] = useState<number | null>(null);
    const [nameOptions, setNameOptions] = useState<Option[]>([]);
    const [addr1Options, setAddr1Options] = useState<Option[]>([]);
    const [prevProps, setPrevProps] = useState<any[]>([]);
    const isFirstProperty = useMemo(() => (propCount ?? 0) === 0, [propCount]);

    const [name, setName] = useState("");
    const [addressLine1, setAddressLine1] = useState("");
    const [zip, setZip] = useState("");
    const [unitOrSuite, setUnitOrSuite] = useState("");
    const [city, setCity] = useState("");
    const [stateVal, setStateVal] = useState("");

    const [cityDirty, setCityDirty] = useState(false);
    const [stateDirty, setStateDirty] = useState(false);
    const [zipStatus, setZipStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
    const lastFetchedZip = useRef<string>("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [attemptedSubmit, setAttemptedSubmit] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.push("/login?next=/admin/properties/new");
                return;
            }
            try {
                await ensureAdminProfile(user);

                const countSnap = await getCountFromServer(
                    query(collection(db, "properties"), where("adminId", "==", user.uid))
                );
                const count = countSnap.data().count;
                setPropCount(count);

                if (count > 0) {
                    const listSnap = await getDocs(
                        query(collection(db, "properties"), where("adminId", "==", user.uid))
                    );
                    const rows = listSnap.docs.map((d) => normalizeRow(d.data(), d.id));

                    const nameOpts = Array.from(new Set(rows.map((x) => x.name || "").filter(Boolean))).sort();
                    const addr1Opts = Array.from(new Set(rows.map((x) => x.addressLine1 || "").filter(Boolean))).sort();

                    setPrevProps(rows);
                    setNameOptions(nameOpts.map((v) => ({ value: v, label: v })));
                    setAddr1Options(addr1Opts.map((v) => ({ value: v, label: v })));
                } else {
                    setPrevProps([]);
                    setNameOptions([]);
                    setAddr1Options([]);
                }
            } catch (e: any) {
                setError(e?.message || "Could not initialize the form.");
                setPropCount(0);
                setPrevProps([]);
                setNameOptions([]);
                setAddr1Options([]);
            }
        });
        return () => unsub();
    }, [router]);

    const fetchCityStateFromZip = async (zip5: string) => {
        if (!isFiveDigitZip(zip5)) return;
        if (lastFetchedZip.current === zip5) return;
        try {
            setZipStatus("loading");
            const res = await fetch(`https://api.zippopotam.us/us/${zip5}`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            const place = Array.isArray(data?.places) && data.places.length > 0 ? data.places[0] : null;
            const cityName = place?.["place name"] ?? "";
            const stateAbbr = (place?.["state abbreviation"] ?? "").toUpperCase();
            if (!cityDirty && cityName) setCity(cityName);
            if (!stateDirty && stateAbbr) setStateVal(stateAbbr);
            lastFetchedZip.current = zip5;
            setZipStatus("done");
        } catch {
            setZipStatus("error");
        }
    };

    useEffect(() => {
        if (isFiveDigitZip(zip)) fetchCityStateFromZip(zip);
        else {
            setZipStatus("idle");
            lastFetchedZip.current = "";
        }
    }, [zip]);

    const applyFromProp = (p: any) => {
        setCityDirty(true);
        setStateDirty(true);
        setAddressLine1(p.addressLine1 || "");
        setCity(p.city || "");
        setStateVal((p.state || "").toUpperCase());
        setZip(p.zip || "");
    };

    const latestBy = (rows: any[], field: "name" | "addressLine1", value: string) => {
        const v = value.trim();
        const matches = rows.filter((r) => trim(r?.[field]) === v);
        if (!matches.length) return null;
        matches.sort((a, b) => tsSeconds(b?.createdAt) - tsSeconds(a?.createdAt));
        return matches[0];
    };

    useEffect(() => {
        if (!prevProps.length) return;
        let pick: any = null;

        if (name && addressLine1) {
            pick = prevProps.find(
                (r) => trim(r.name || "") === trim(name) && trim(r.addressLine1 || "") === trim(addressLine1)
            );
        }
        if (!pick && name) pick = latestBy(prevProps, "name", name);
        if (!pick && addressLine1) pick = latestBy(prevProps, "addressLine1", addressLine1);

        if (pick) applyFromProp(pick);
    }, [name, addressLine1, prevProps]); // <-- key fix kept

    const resetForm = () => {
        setName("");
        setAddressLine1("");
        setZip("");
        setUnitOrSuite("");
        setCity("");
        setStateVal("");
        setCityDirty(false);
        setStateDirty(false);
        setSuccess(null);
        setError(null);
        setAttemptedSubmit(false);
    };

    const createPropertyAndOptionalUnit = async () => {
        const u = auth.currentUser!;
        const propRef = await addDoc(collection(db, "properties"), {
            adminId: u.uid,
            name: trim(name) || null,
            addressLine1: trim(addressLine1),
            city: trim(city),
            state: trim(stateVal),
            zip: trim(zip),
            createdAt: serverTimestamp(),
        });
        if (trim(unitOrSuite)) {
            await addDoc(collection(db, "properties", propRef.id, "units"), {
                adminId: u.uid,
                propertyId: propRef.id,
                unitNumber: trim(unitOrSuite),
                createdAt: serverTimestamp(),
            });
        }
        return propRef.id;
    };

    const { invalid, messages, isValid } = useReactFormState({
        addressLine1,
        zip,
        city,
        stateVal,
        attemptedSubmit,
    });

    const persist = async (mode: "save" | "more") => {
        const u = auth.currentUser;
        if (!u) {
            router.push("/login?next=/admin/properties/new");
            return;
        }
        setAttemptedSubmit(true);
        setIsSubmitting(true);
        setError(null);
        setSuccess(null);
        try {
            await ensureAdminProfile(u);
            // keep your existing guard
            if (!trim(addressLine1) || !trim(zip) || !trim(city) || !trim(stateVal)) {
                setError("Please fill Address Line 1, ZIP, City, and State.");
                return;
            }
            if (!isValid) {
                setError("Please fix the highlighted fields.");
                return;
            }

            const newId = await createPropertyAndOptionalUnit();

            // make the just-saved property available for immediate autofill on the next entry
            setPrevProps((rows) => [
                ...rows,
                normalizeRow(
                    {
                        name: trim(name) || null,
                        addressLine1: trim(addressLine1),
                        city: trim(city),
                        state: trim(stateVal),
                        zip: trim(zip),
                        createdAt: { seconds: Math.floor(Date.now() / 1000) },
                    },
                    newId
                ),
            ]);

            setPropCount((c) => (c ?? 0) + 1);
            if (trim(name)) {
                setNameOptions((prev) =>
                    prev.some((o) => o.value === trim(name)) ? prev : [...prev, { value: trim(name), label: trim(name) }]
                );
            }
            if (trim(addressLine1)) {
                setAddr1Options((prev) =>
                    prev.some((o) => o.value === trim(addressLine1))
                        ? prev
                        : [...prev, { value: trim(addressLine1), label: trim(addressLine1) }]
                );
            }

            if (mode === "save") {
                router.push(`/admin-dashboard?waitFor=${encodeURIComponent(newId)}`);
            } else {
                resetForm();
                setSuccess("Property saved. You can add another.");
            }
        } catch (e: any) {
            setError(e?.message || "Something went wrong while saving the property.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-56px)] w-full">
            <div className="mx-auto w-full max-w-2xl p-6">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-semibold">Add Property</h1>
                </div>

                <form
                    noValidate
                    onSubmit={(e) => {
                        e.preventDefault();
                        persist("save");
                    }}
                    className="space-y-5"
                    aria-describedby={error ? "form-error" : undefined}
                >
                    <div>
                        <label htmlFor="prop-name" className="block text-sm text-gray-700">
                            Property Name (optional)
                        </label>
                        {isFirstProperty ? (
                            <input
                                id="prop-name"
                                className="mt-1 w-full rounded border px-3 py-2 text-sm"
                                placeholder="e.g., Maple Grove Apartments"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        ) : nameOptions.length ? (
                            <div className="mt-1 flex gap-2">
                                <select
                                    aria-label="Use previous property name"
                                    className="w-1/2 rounded border px-3 py-2 text-sm"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                >
                                    <option value="">Use previous name…</option>
                                    {nameOptions.map((o) => (
                                        <option key={o.value} value={o.value}>
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    id="prop-name"
                                    className="w-1/2 rounded border px-3 py-2 text-sm"
                                    placeholder="Or enter a new name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        ) : (
                            <input
                                id="prop-name"
                                className="mt-1 w-full rounded border px-3 py-2 text-sm"
                                placeholder="e.g., Maple Grove Apartments"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        )}
                    </div>

                    <div>
                        <label htmlFor="addr1" className="block text-sm text-gray-700">
                            Address Line 1
                        </label>
                        {isFirstProperty ? (
                            <input
                                id="addr1"
                                className="mt-1 w-full rounded border px-3 py-2 text-sm"
                                placeholder="Enter Address Line 1"
                                value={addressLine1}
                                onChange={(e) => setAddressLine1(e.target.value)}
                                required
                                aria-required="true"
                                aria-invalid={invalid.addressLine1 || undefined}
                                aria-describedby={invalid.addressLine1 ? "addr1-help" : undefined}
                            />
                        ) : addr1Options.length ? (
                            <div className="mt-1 flex gap-2">
                                <select
                                    aria-label="Use previous address line 1"
                                    className="w-1/2 rounded border px-3 py-2 text-sm"
                                    value={addressLine1}
                                    onChange={(e) => setAddressLine1(e.target.value)}
                                    aria-invalid={invalid.addressLine1 || undefined}
                                    aria-describedby={invalid.addressLine1 ? "addr1-help" : undefined}
                                >
                                    <option value="">Use previous address line 1…</option>
                                    {addr1Options.map((o) => (
                                        <option key={o.value} value={o.value}>
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    id="addr1"
                                    className="w-1/2 rounded border px-3 py-2 text-sm"
                                    placeholder="Enter Address Line 1"
                                    value={addressLine1}
                                    onChange={(e) => setAddressLine1(e.target.value)}
                                    required
                                    aria-required="true"
                                    aria-invalid={invalid.addressLine1 || undefined}
                                    aria-describedby={invalid.addressLine1 ? "addr1-help" : undefined}
                                />
                            </div>
                        ) : (
                            <input
                                id="addr1"
                                className="mt-1 w-full rounded border px-3 py-2 text-sm"
                                placeholder="Enter Address Line 1"
                                value={addressLine1}
                                onChange={(e) => setAddressLine1(e.target.value)}
                                required
                                aria-required="true"
                                aria-invalid={invalid.addressLine1 || undefined}
                                aria-describedby={invalid.addressLine1 ? "addr1-help" : undefined}
                            />
                        )}
                        {invalid.addressLine1 ? (
                            <p id="addr1-help" className="mt-1 text-xs text-red-600">
                                {messages.addressLine1}
                            </p>
                        ) : null}
                    </div>

                    <div>
                        <label htmlFor="zip" className="block text-sm text-gray-700">
                            ZIP
                        </label>
                        <div className="mt-1 flex gap-2">
                            <input
                                id="zip"
                                className="w-full rounded border px-3 py-2 text-sm"
                                placeholder="e.g., 10001"
                                value={zip}
                                onChange={(e) => {
                                    const v = e.target.value.replace(/[^\d]/g, "").slice(0, 5);
                                    setZip(v);
                                }}
                                onBlur={() => isFiveDigitZip(zip) && fetchCityStateFromZip(zip)}
                                required
                                inputMode="numeric"
                                pattern="\d{5}"
                                aria-required="true"
                                aria-invalid={invalid.zip || undefined}
                                aria-describedby={
                                    invalid.zip
                                        ? "zip-help"
                                        : zipStatus === "error"
                                            ? "zip-lookup-error"
                                            : zipStatus === "done"
                                                ? "zip-lookup-done"
                                                : undefined
                                }
                            />
                            <button
                                type="button"
                                onClick={() => isFiveDigitZip(zip) && fetchCityStateFromZip(zip)}
                                className="shrink-0 rounded border px-3 py-2 text-sm hover:bg-gray-50"
                                title="Auto-fill City & State from ZIP"
                            >
                                {zipStatus === "loading" ? "Looking…" : "Auto-fill"}
                            </button>
                        </div>
                        {invalid.zip ? (
                            <p id="zip-help" className="mt-1 text-xs text-red-600">
                                {messages.zip}
                            </p>
                        ) : null}
                        {zipStatus === "error" ? (
                            <p id="zip-lookup-error" className="mt-1 text-xs text-red-600">
                                Couldn’t look up that ZIP.
                            </p>
                        ) : zipStatus === "done" ? (
                            <p id="zip-lookup-done" className="mt-1 text-xs text-gray-500">
                                City/State auto-filled.
                            </p>
                        ) : null}
                    </div>

                    <div>
                        <label htmlFor="unit" className="block text-sm text-gray-700">
                            Unit / Apt / Ste (optional)
                        </label>
                        <input
                            id="unit"
                            className="mt-1 w-full rounded border px-3 py-2 text-sm"
                            placeholder="Unit/Apt/Ste #"
                            value={unitOrSuite}
                            onChange={(e) => setUnitOrSuite(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <label htmlFor="city" className="block text-sm text-gray-700">
                                City
                            </label>
                            <input
                                id="city"
                                className="mt-1 w-full rounded border px-3 py-2 text-sm"
                                value={city}
                                onChange={(e) => {
                                    setCity(e.target.value);
                                    setCityDirty(true);
                                }}
                                required
                                aria-required="true"
                                aria-invalid={invalid.city || undefined}
                                aria-describedby={invalid.city ? "city-help" : undefined}
                            />
                            {invalid.city ? (
                                <p id="city-help" className="mt-1 text-xs text-red-600">
                                    {messages.city}
                                </p>
                            ) : null}
                        </div>
                        <div>
                            <label htmlFor="state" className="block text-sm text-gray-700">
                                State
                            </label>
                            <input
                                id="state"
                                className="mt-1 w-full rounded border px-3 py-2 text-sm uppercase"
                                value={stateVal}
                                onChange={(e) => {
                                    setStateVal(e.target.value.toUpperCase());
                                    setStateDirty(true);
                                }}
                                placeholder="e.g., CA"
                                maxLength={2}
                                required
                                aria-required="true"
                                aria-invalid={invalid.stateVal || undefined}
                                aria-describedby={invalid.stateVal ? "state-help" : undefined}
                            />
                            {invalid.stateVal ? (
                                <p id="state-help" className="mt-1 text-xs text-red-600">
                                    {messages.stateVal}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    {error ? (
                        <div
                            id="form-error"
                            role="alert"
                            className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
                        >
                            {error}
                        </div>
                    ) : null}
                    {success ? (
                        <div
                            role="status"
                            aria-live="polite"
                            className="rounded border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900"
                        >
                            {success}
                        </div>
                    ) : null}

                    <div className="flex items-center justify-center gap-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded bg-gray-900 px-4 py-2 text-white hover:bg-black disabled:opacity-50"
                            aria-disabled={isSubmitting || undefined}
                        >
                            {isSubmitting ? "Saving…" : "Save"}
                        </button>
                        <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => {
                                setAttemptedSubmit(true);
                                persist("more");
                            }}
                            className="rounded border px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
                            aria-disabled={isSubmitting || undefined}
                        >
                            {isSubmitting ? "Saving…" : "Save & Add More"}
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
        </div>
    );
}
