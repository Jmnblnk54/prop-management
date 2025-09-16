'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { COLORS } from '@/lib/constants';

type TenantDoc = {
    adminId: string;
    propertyId: string;
    unitId: string;
    email: string;
    name?: string | null;
};

type PropertyLite = {
    addressLine1: string;
    city: string;
    state: string;
    zip: string;
    name?: string | null;
};

type UnitLite = {
    unitNumber?: string | null;
    rentMonthly?: number | null;
    rentDueDay?: number | null;
    monthToMonth?: boolean | null;
    leaseStartDate?: any | null;
    leaseEndDate?: any | null;
};

function nextDueDate(dueDay: number) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();
    const thisMonth = new Date(year, month, Math.min(dueDay, 28));
    if (day <= dueDay) return thisMonth;
    return new Date(year, month + 1, Math.min(dueDay, 28));
}

function fmtDate(d: Date | null) {
    if (!d) return '—';
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function TenantHomePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [tenant, setTenant] = useState<TenantDoc | null>(null);
    const [property, setProperty] = useState<PropertyLite | null>(null);
    const [unit, setUnit] = useState<UnitLite | null>(null);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (!u) {
                router.push('/login?next=/tenant');
                return;
            }
            try {
                setLoading(true);
                const tSnap = await getDoc(doc(db, 'tenants', u.uid));
                if (!tSnap.exists()) {
                    setErr('No tenant record found for this account.');
                    setTenant(null);
                    setProperty(null);
                    setUnit(null);
                    return;
                }
                const t = tSnap.data() as any;
                const tenantDoc: TenantDoc = {
                    adminId: t.adminId,
                    propertyId: t.propertyId,
                    unitId: t.unitId,
                    email: t.email,
                    name: t.name ?? u.displayName ?? null,
                };
                setTenant(tenantDoc);

                const pSnap = await getDoc(doc(db, 'properties', tenantDoc.propertyId));
                setProperty(
                    pSnap.exists()
                        ? {
                            addressLine1: (pSnap.data() as any).addressLine1 || '',
                            city: (pSnap.data() as any).city || '',
                            state: (pSnap.data() as any).state || '',
                            zip: (pSnap.data() as any).zip || '',
                            name: (pSnap.data() as any).name ?? null,
                        }
                        : null
                );

                const uSnap = await getDoc(doc(db, 'properties', tenantDoc.propertyId, 'units', tenantDoc.unitId));
                setUnit(
                    uSnap.exists()
                        ? {
                            unitNumber: (uSnap.data() as any).unitNumber ?? null,
                            rentMonthly: typeof (uSnap.data() as any).rentMonthly === 'number' ? (uSnap.data() as any).rentMonthly : null,
                            rentDueDay: typeof (uSnap.data() as any).rentDueDay === 'number' ? (uSnap.data() as any).rentDueDay : null,
                            monthToMonth: typeof (uSnap.data() as any).monthToMonth === 'boolean' ? (uSnap.data() as any).monthToMonth : null,
                            leaseStartDate: (uSnap.data() as any).leaseStartDate ?? null,
                            leaseEndDate: (uSnap.data() as any).leaseEndDate ?? null,
                        }
                        : null
                );
            } catch (e: any) {
                setErr(e?.message || 'Failed to load tenant dashboard.');
                setTenant(null);
                setProperty(null);
                setUnit(null);
            } finally {
                setLoading(false);
            }
        });
        return () => unsub();
    }, [router]);

    const headerTitle = useMemo(() => {
        if (property?.name?.trim()) return property.name!.trim();
        if (!property) return 'Tenant Portal';
        return property.addressLine1 || 'Tenant Portal';
    }, [property]);

    const rentBlock = useMemo(() => {
        if (!unit?.rentMonthly || !unit?.rentDueDay) return null;
        const due = nextDueDate(unit.rentDueDay);
        const today = new Date();
        const isOverdue = today > due;
        return { amount: unit.rentMonthly, dueDate: due, statusLabel: isOverdue ? 'Overdue' : 'Due' };
    }, [unit]);

    if (loading) {
        return (
            <main className="mx-auto w-full max-w-2xl p-6 space-y-6">
                <div className="animate-pulse space-y-3">
                    <div className="h-7 w-2/3 bg-gray-200 rounded" />
                    <div className="h-4 w-1/2 bg-gray-200 rounded" />
                </div>
                <div className="h-40 bg-gray-100 rounded" />
            </main>
        );
    }

    if (err) {
        return (
            <main className="mx-auto w-full max-w-2xl p-6 space-y-6">
                <div className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{err}</div>
            </main>
        );
    }

    return (
        <main className="mx-auto w-full max-w-2xl p-6 space-y-6">
            <header className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{headerTitle}</h1>
                {property ? (
                    <div className="text-gray-900">
                        {property.addressLine1}
                        {unit?.unitNumber ? `, Unit ${unit.unitNumber}` : ''} — {property.city}, {property.state} {property.zip}
                    </div>
                ) : null}
                {tenant?.name ? <div className="text-sm text-gray-600">Welcome, {tenant.name}</div> : null}
            </header>

            <section className="rounded border bg-white" style={{ borderColor: COLORS.border }}>
                <div className="px-4 py-2 text-sm" style={{ backgroundColor: COLORS.cardHeaderBg, color: '#000' }}>
                    Rent
                </div>
                <div className="p-4">
                    {rentBlock ? (
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm text-gray-600">{rentBlock.statusLabel}</div>
                                <div className="text-lg font-semibold text-gray-900">${rentBlock.amount?.toFixed(2)}</div>
                                <div className="text-sm text-gray-700">by {fmtDate(rentBlock.dueDate)}</div>
                            </div>
                            <button
                                className="rounded border px-3 py-2 text-sm"
                                style={{ borderColor: COLORS.soft, color: COLORS.primary }}
                                disabled
                                title="Payments coming soon"
                            >
                                Pay Rent
                            </button>
                        </div>
                    ) : (
                        <div className="text-sm text-gray-700">Your rent details are not available yet.</div>
                    )}
                </div>
            </section>

            <section className="grid gap-3 md:grid-cols-2">
                <div className="rounded border bg-white" style={{ borderColor: COLORS.border }}>
                    <div className="px-4 py-2 text-sm" style={{ backgroundColor: COLORS.cardHeaderBg }}>Lease</div>
                    <div className="p-4 space-y-2">
                        <button
                            className="rounded border px-3 py-2 text-sm"
                            style={{ borderColor: COLORS.soft, color: COLORS.primary }}
                            disabled
                            title="Lease view coming soon"
                        >
                            View Lease (PDF)
                        </button>
                    </div>
                </div>

                <div className="rounded border bg-white" style={{ borderColor: COLORS.border }}>
                    <div className="px-4 py-2 text-sm" style={{ backgroundColor: COLORS.cardHeaderBg }}>Maintenance</div>
                    <div className="p-4">
                        <button
                            className="rounded border px-3 py-2 text-sm"
                            style={{ borderColor: COLORS.soft, color: COLORS.primary }}
                            disabled
                            title="Maintenance requests coming soon"
                        >
                            Report an Issue
                        </button>
                    </div>
                </div>

                <div className="rounded border bg-white" style={{ borderColor: COLORS.border }}>
                    <div className="px-4 py-2 text-sm" style={{ backgroundColor: COLORS.cardHeaderBg }}>Messages</div>
                    <div className="p-4">
                        <button
                            className="rounded border px-3 py-2 text-sm"
                            style={{ borderColor: COLORS.soft, color: COLORS.primary }}
                            disabled
                            title="Messaging coming soon"
                        >
                            Open Messages
                        </button>
                    </div>
                </div>

                <div className="rounded border bg-white" style={{ borderColor: COLORS.border }}>
                    <div className="px-4 py-2 text-sm" style={{ backgroundColor: COLORS.cardHeaderBg }}>Profile</div>
                    <div className="p-4">
                        <button
                            className="rounded border px-3 py-2 text-sm"
                            style={{ borderColor: COLORS.soft, color: COLORS.primary }}
                            disabled
                            title="Profile coming soon"
                        >
                            View Profile
                        </button>
                    </div>
                </div>
            </section>
        </main>
    );
}
