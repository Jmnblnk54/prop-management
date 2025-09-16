'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import RoleGate from '@/components/auth/RoleGate';
import { COLORS } from '@/lib/constants';
import type { UnitDetails } from '@/admin-interfaces/Unit';
import { createInviteAndSendEmail } from '@/lib/TenantInviteEmail';

function tsToDateInput(v: any): string {
    if (!v) return '';
    const ms =
        typeof v?.toDate === 'function'
            ? v.toDate().getTime()
            : typeof v?.seconds === 'number'
                ? v.seconds * 1000
                : v instanceof Date
                    ? v.getTime()
                    : Number(v);
    if (!ms || Number.isNaN(ms)) return '';
    const d = new Date(ms);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}
function dateInputToDate(s: string): Date | null {
    if (!s) return null;
    const d = new Date(`${s}T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
}
function isValidEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export default function UnitDetailPage() {
    const { id, unitId } = useParams<{ id: string; unitId: string }>();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [data, setData] = useState<UnitDetails | null>(null);
    const [leaseStartStr, setLeaseStartStr] = useState('');
    const [leaseEndStr, setLeaseEndStr] = useState('');
    const [admin, setAdmin] = useState<{ uid: string; email: string | null; name: string | null } | null>(null);

    const validation = useMemo(() => {
        const issues: string[] = [];
        if (data?.rentDueDay != null) {
            const v = Number(data.rentDueDay);
            if (!Number.isInteger(v) || v < 1 || v > 28) issues.push('Rent due day must be between 1 and 28.');
        }
        if (data?.rentMonthly != null) {
            const v = Number(data.rentMonthly);
            if (Number.isNaN(v) || v < 0) issues.push('Rent must be a non-negative number.');
        }
        const start = leaseStartStr ? dateInputToDate(leaseStartStr) : null;
        const end = leaseEndStr ? dateInputToDate(leaseEndStr) : null;
        if (!data?.monthToMonth && start && end && end < start) issues.push('Lease end date must be after start date.');
        return issues;
    }, [data?.rentDueDay, data?.rentMonthly, data?.monthToMonth, leaseStartStr, leaseEndStr]);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (!u) {
                router.push('/login');
                return;
            }
            setAdmin({ uid: u.uid, email: u.email ?? null, name: u.displayName ?? null });
            try {
                setLoading(true);
                const uRef = doc(db, 'properties', id, 'units', unitId);
                const snap = await getDoc(uRef);
                if (!snap.exists()) {
                    setErr('Unit not found.');
                    setData(null);
                    return;
                }
                const r = snap.data() as any;
                const next: UnitDetails = {
                    id: unitId,
                    unitNumber: r.unitNumber || '',
                    tenantEmail: r.tenantEmail ?? null,
                    tenantName: r.tenantName ?? null,
                    phone: r.phone ?? null,
                    notes: r.notes ?? null,
                    rentMonthly:
                        typeof r.rentMonthly === 'number'
                            ? r.rentMonthly
                            : r.rentMonthly
                                ? Number(r.rentMonthly)
                                : null,
                    rentDueDay:
                        typeof r.rentDueDay === 'number'
                            ? r.rentDueDay
                            : r.rentDueDay
                                ? Number(r.rentDueDay)
                                : null,
                    leaseStartDate: r.leaseStartDate ?? null,
                    leaseEndDate: r.leaseEndDate ?? null,
                    monthToMonth: typeof r.monthToMonth === 'boolean' ? r.monthToMonth : null,
                    noticeTimeframeMonths:
                        typeof r.noticeTimeframeMonths === 'number'
                            ? r.noticeTimeframeMonths
                            : r.noticeTimeframeMonths
                                ? Number(r.noticeTimeframeMonths)
                                : null,
                    leaseOnFile: typeof r.leaseOnFile === 'boolean' ? r.leaseOnFile : null,
                    createdAt: r.createdAt ?? null,
                };
                setData(next);
                setLeaseStartStr(tsToDateInput(next.leaseStartDate));
                setLeaseEndStr(tsToDateInput(next.leaseEndDate));
            } catch (e: any) {
                setErr(e?.message || 'Failed to load unit.');
                setData(null);
            } finally {
                setLoading(false);
            }
        });
        return () => unsub();
    }, [id, unitId, router]);

    async function save() {
        if (!data) return;
        if (validation.length) {
            setErr(validation[0]);
            return;
        }
        try {
            setSaving(true);
            const uRef = doc(db, 'properties', id, 'units', unitId);
            const payload: any = {
                unitNumber: data.unitNumber || '',
                tenantEmail: data.tenantEmail || null,
                tenantName: data.tenantName || null,
                phone: data.phone || null,
                notes: data.notes || null,
                rentMonthly:
                    data.rentMonthly == null || (data.rentMonthly as any) === ''
                        ? null
                        : Number(data.rentMonthly),
                rentDueDay:
                    data.rentDueDay == null || (data.rentDueDay as any) === ''
                        ? null
                        : Number(data.rentDueDay),
                monthToMonth: !!data.monthToMonth,
                noticeTimeframeMonths:
                    data.noticeTimeframeMonths == null || (data.noticeTimeframeMonths as any) === ''
                        ? null
                        : Number(data.noticeTimeframeMonths),
                leaseOnFile: !!data.leaseOnFile,
            };
            if (data.monthToMonth) {
                payload.leaseStartDate = null;
                payload.leaseEndDate = null;
            } else {
                payload.leaseStartDate = leaseStartStr ? dateInputToDate(leaseStartStr) : null;
                payload.leaseEndDate = leaseEndStr ? dateInputToDate(leaseEndStr) : null;
            }
            await updateDoc(uRef, payload);
            setEditMode(false);
            setErr(null);
        } catch (e: any) {
            setErr(e?.message || 'Failed to save.');
        } finally {
            setSaving(false);
        }
    }

    function ViewLeaseButton() {
        const disabled = !data?.leaseOnFile;
        return (
            <button
                className={`rounded border px-3 py-2 text-sm ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ borderColor: COLORS.soft, color: COLORS.primary }}
                disabled={disabled}
                title={disabled ? 'Upload a lease to enable' : 'Open PDF'}
            >
                View Lease (PDF)
            </button>
        );
    }

    function InviteTenantButton() {
        const disabled = !isValidEmail(data?.tenantEmail || '') || !admin?.uid;
        const [sending, setSending] = useState(false);
        const [msg, setMsg] = useState<string | null>(null);
        const [ok, setOk] = useState<boolean | null>(null);

        const sendInvite = async () => {
            if (disabled || !data?.tenantEmail || !admin?.uid) return;
            setMsg(null);
            setOk(null);
            try {
                setSending(true);
                await createInviteAndSendEmail({
                    adminId: admin.uid,
                    propertyId: id,
                    unitId,
                    tenantEmail: data.tenantEmail.trim(),
                    tenantName: data.tenantName ?? null,
                    unitNumber: data.unitNumber ?? null,
                    propertyLabel: null,
                    managerName: admin.name ?? null,
                    managerEmail: admin.email ?? null,
                });
                setOk(true);
                setMsg('Invite sent');
            } catch (e: any) {
                setOk(false);
                setMsg(e?.message || 'Failed to send invite.');
            } finally {
                setSending(false);
            }
        };

        return (
            <div className="flex items-center gap-2">
                <button
                    className={`rounded border px-3 py-2 text-sm ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    style={{ borderColor: COLORS.soft, color: COLORS.primary }}
                    disabled={disabled || sending}
                    title={
                        disabled
                            ? 'Enter a valid email to enable'
                            : sending
                                ? 'Sending…'
                                : 'Send invite to tenant'
                    }
                    onClick={sendInvite}
                >
                    {sending ? 'Sending…' : 'Invite Tenant'}
                </button>
                {msg && <span className={`text-xs ${ok ? 'text-green-600' : 'text-red-600'}`}>{msg}</span>}
            </div>
        );
    }

    if (loading) {
        return (
            <RoleGate allowed={['admin']}>
                <main className="mx-auto w-full max-w-3xl p-6 space-y-6">
                    <div className="animate-pulse space-y-3">
                        <div className="h-7 w-2/3 bg-gray-200 rounded" />
                        <div className="h-4 w-1/2 bg-gray-200 rounded" />
                    </div>
                    <div className="h-40 bg-gray-100 rounded" />
                </main>
            </RoleGate>
        );
    }

    if (err) {
        return (
            <RoleGate allowed={['admin']}>
                <main className="mx-auto w-full max-w-3xl p-6 space-y-6">
                    <div className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{err}</div>
                    <Link href={`/admin/property/${id}`} className="text-sm underline hover:no-underline">
                        ← Back to Property
                    </Link>
                </main>
            </RoleGate>
        );
    }

    if (!data) return null;

    return (
        <RoleGate allowed={['admin']}>
            <main className="mx-auto w-full max-w-3xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <Link href={`/admin/property/${id}`} className="text-sm underline hover:no-underline">
                        ← Property
                    </Link>
                    <div className="flex items-center gap-2">
                        <ViewLeaseButton />
                        <InviteTenantButton />
                        {!editMode ? (
                            <button
                                className="rounded border px-3 py-2 text-sm"
                                style={{ borderColor: COLORS.soft, color: COLORS.primary }}
                                onClick={() => setEditMode(true)}
                            >
                                Edit
                            </button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    className="rounded border px-3 py-2 text-sm"
                                    style={{ borderColor: COLORS.soft, color: COLORS.primary }}
                                    onClick={save}
                                    disabled={saving || validation.length > 0}
                                    title={validation[0] || undefined}
                                >
                                    {saving ? 'Saving…' : 'Save'}
                                </button>
                                <button
                                    className="rounded border px-3 py-2 text-sm"
                                    style={{ borderColor: COLORS.soft, color: COLORS.primary }}
                                    onClick={() => {
                                        setEditMode(false);
                                        setErr(null);
                                    }}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <section className="rounded border bg-white" style={{ borderColor: COLORS.border }}>
                    <div className="px-4 py-2 text-sm" style={{ backgroundColor: COLORS.cardHeaderBg }}>
                        Unit & Tenant
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <label className="text-xs text-gray-600">Unit Number</label>
                            <input
                                className="rounded border p-2 text-sm"
                                style={{ borderColor: COLORS.border }}
                                value={data.unitNumber}
                                disabled={!editMode}
                                onChange={(e) => setData({ ...data, unitNumber: e.target.value })}
                            />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-xs text-gray-600">Tenant Name</label>
                            <input
                                className="rounded border p-2 text-sm"
                                style={{ borderColor: COLORS.border }}
                                value={data.tenantName || ''}
                                disabled={!editMode}
                                onChange={(e) => setData({ ...data, tenantName: e.target.value })}
                            />
                            <button
                                type="button"
                                className="self-start text-xs underline hover:no-underline disabled:opacity-50"
                                style={{ color: COLORS.primary }}
                                onClick={(e) => e.preventDefault()}
                                disabled
                                title="Co-tenant invites coming soon"
                            >
                                Add another tenant…
                            </button>
                        </div>

                        <div className="grid gap-2">
                            <label className="text-xs text-gray-600">Tenant Email</label>
                            <input
                                type="email"
                                inputMode="email"
                                className="rounded border p-2 text-sm"
                                style={{ borderColor: COLORS.border }}
                                placeholder="Add email to enable invites"
                                value={data.tenantEmail || ''}
                                disabled={!editMode}
                                onChange={(e) => setData({ ...data, tenantEmail: e.target.value })}
                            />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-xs text-gray-600">Phone</label>
                            <input
                                className="rounded border p-2 text-sm"
                                style={{ borderColor: COLORS.border }}
                                value={data.phone || ''}
                                disabled={!editMode}
                                onChange={(e) => setData({ ...data, phone: e.target.value })}
                            />
                        </div>

                        <div className="md:col-span-2 grid gap-2">
                            <label className="text-xs text-gray-600">Notes</label>
                            <textarea
                                className="rounded border p-2 text-sm"
                                style={{ borderColor: COLORS.border }}
                                rows={4}
                                value={data.notes || ''}
                                disabled={!editMode}
                                onChange={(e) => setData({ ...data, notes: e.target.value })}
                            />
                        </div>
                    </div>
                </section>

                <section className="rounded border bg-white" style={{ borderColor: COLORS.border }}>
                    <div className="px-4 py-2 text-sm" style={{ backgroundColor: COLORS.cardHeaderBg }}>
                        Lease & Rent
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <label className="text-xs text-gray-600">Monthly Rent</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="rounded border p-2 text-sm"
                                style={{ borderColor: COLORS.border }}
                                value={data.rentMonthly ?? ''}
                                disabled={!editMode}
                                onChange={(e) =>
                                    setData({
                                        ...data,
                                        rentMonthly: e.target.value === '' ? null : Number(e.target.value),
                                    })
                                }
                            />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-xs text-gray-600">Rent Due Day (1–28)</label>
                            <input
                                type="number"
                                min="1"
                                max="28"
                                className="rounded border p-2 text-sm"
                                style={{ borderColor: COLORS.border }}
                                value={data.rentDueDay ?? ''}
                                disabled={!editMode}
                                onChange={(e) =>
                                    setData({
                                        ...data,
                                        rentDueDay: e.target.value === '' ? null : Number(e.target.value),
                                    })
                                }
                            />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-xs text-gray-600">Month-to-Month</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4"
                                    checked={!!data.monthToMonth}
                                    disabled={!editMode}
                                    onChange={(e) => setData({ ...data, monthToMonth: e.target.checked })}
                                />
                                <span className="text-sm text-gray-700">No fixed end date</span>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <label className="text-xs text-gray-600">Notice Timeframe (months)</label>
                            <input
                                type="number"
                                min="0"
                                max="12"
                                className="rounded border p-2 text-sm"
                                style={{ borderColor: COLORS.border }}
                                value={data.noticeTimeframeMonths ?? ''}
                                disabled={!editMode}
                                onChange={(e) =>
                                    setData({
                                        ...data,
                                        noticeTimeframeMonths: e.target.value === '' ? null : Number(e.target.value),
                                    })
                                }
                            />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-xs text-gray-600">Lease Start</label>
                            <input
                                type="date"
                                className="rounded border p-2 text-sm"
                                style={{ borderColor: COLORS.border }}
                                value={leaseStartStr}
                                disabled={!editMode || !!data.monthToMonth}
                                onChange={(e) => setLeaseStartStr(e.target.value)}
                            />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-xs text-gray-600">Lease End</label>
                            <input
                                type="date"
                                className="rounded border p-2 text-sm"
                                style={{ borderColor: COLORS.border }}
                                value={leaseEndStr}
                                disabled={!editMode || !!data.monthToMonth}
                                onChange={(e) => setLeaseEndStr(e.target.value)}
                            />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-xs text-gray-600">Lease On File (PDF)</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4"
                                    checked={!!data.leaseOnFile}
                                    disabled={!editMode}
                                    onChange={(e) => setData({ ...data, leaseOnFile: e.target.checked })}
                                />
                                <span className="text-sm text-gray-700">Toggle when you’ve uploaded it</span>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </RoleGate>
    );
}
