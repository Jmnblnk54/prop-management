'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import {
    doc,
    getDoc,
    updateDoc,
    addDoc,
    collection,
    serverTimestamp,
} from 'firebase/firestore';
import { ensureAdminProfile } from '@/lib/ensureAdmin';
import { COLORS } from '@/lib/constants';

type UnitData = {
    unitNumber: string;
    notes?: string | null;
    hasLease?: boolean | null;
    // legacy (may exist in DB from before); we won't save these back:
    tenantEmail?: string | null;
    tenantName?: string | null;
    phone?: string | null;
};

function isValidEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export default function UnitDetailPage() {
    const { id, unitId } = useParams<{ id: string; unitId: string }>();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [role, setRole] = useState<string | null>(null); // 'admin' | 'admin2'
    const [editMode, setEditMode] = useState(false); // NOT in edit mode by default
    const [data, setData] = useState<UnitData | null>(null);

    // invite-only state (not persisted to unit doc)
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteName, setInviteName] = useState('');
    const [inviteSending, setInviteSending] = useState(false);
    const [inviteMsg, setInviteMsg] = useState<string | null>(null);
    const [emailError, setEmailError] = useState<string | null>(null);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (!u) {
                router.push('/login');
                return;
            }
            try {
                setLoading(true);
                await ensureAdminProfile(u);

                const adminSnap = await getDoc(doc(db, 'admins', u.uid));
                setRole((adminSnap.data() as any)?.role ?? null);

                const uRef = doc(db, 'properties', id, 'units', unitId);
                const snap = await getDoc(uRef);
                if (!snap.exists()) {
                    setErr('Unit not found.');
                    setData(null);
                    return;
                }
                const r = snap.data() as any;

                const initial: UnitData = {
                    unitNumber: r.unitNumber || '',
                    notes: r.notes ?? null,
                    hasLease: !!r.hasLease,
                    // legacy tenant fields (shown only to prefill invite; not saved back)
                    tenantEmail: r.tenantEmail ?? null,
                    tenantName: r.tenantName ?? null,
                    phone: r.phone ?? null,
                };
                setData(initial);

                // Pre-fill invite form from legacy values if present
                const preEmail = (initial.tenantEmail || '').trim();
                const preName = (initial.tenantName || '').trim();
                if (preEmail) setInviteEmail(preEmail);
                if (preName) setInviteName(preName);

                // initialize email error (only if invalid & non-empty)
                setEmailError(preEmail && !isValidEmail(preEmail) ? 'Enter a valid email (e.g., name@example.com)' : null);

                setErr(null);
            } catch (e: any) {
                setErr(e?.message || 'Failed to load unit.');
                setData(null);
            } finally {
                setLoading(false);
            }
        });
        return () => unsub();
    }, [id, unitId, router]);

    // Invite button enabled only for a valid email
    const canInvite = useMemo(() => {
        const v = (inviteEmail || '').trim();
        return v.length > 0 && isValidEmail(v);
    }, [inviteEmail]);

    const inviteDisabledReason = useMemo(() => {
        const v = (inviteEmail || '').trim();
        if (!v) return 'Add tenant email to enable Invite';
        if (!isValidEmail(v)) return 'Enter a valid email to enable Invite';
        return '';
    }, [inviteEmail]);

    async function sendInvite() {
        setInviteMsg(null);
        const email = (inviteEmail || '').trim();
        if (!email) {
            setEmailError('Tenant email is required.');
            return;
        }
        if (!isValidEmail(email)) {
            setEmailError('Enter a valid email (e.g., name@example.com)');
            return;
        }

        const u = auth.currentUser;
        if (!u) {
            router.push('/login');
            return;
        }

        try {
            setInviteSending(true);
            await addDoc(collection(db, 'tenantInvites'), {
                adminId: u.uid,
                propertyId: id,
                unitId,
                tenantEmail: email,
                tenantName: (inviteName || '').trim() || null,
                status: 'sent',
                invitedAt: serverTimestamp(),
            });
            setInviteMsg(`Invite recorded for ${email}.`);
        } catch (e: any) {
            setInviteMsg(e?.message || 'Failed to send invite.');
        } finally {
            setInviteSending(false);
        }
    }

    async function save() {
        if (!data) return;

        try {
            setSaving(true);

            // 🚫 Do not persist tenant fields here anymore.
            // Only unit-specific fields (unitNumber, notes). Keep hasLease untouched for now.
            await updateDoc(doc(db, 'properties', id, 'units', unitId), {
                unitNumber: (data.unitNumber || '').trim(),
                notes: (data.notes || '') ? (data.notes || '').trim() : null,
            });

            setEditMode(false);
        } catch (e: any) {
            setErr(e?.message || 'Failed to save.');
        } finally {
            setSaving(false);
        }
    }

    function ViewLeaseButton() {
        const disabled = !data?.hasLease;
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

    if (loading) {
        return (
            <main className="mx-auto w-full max-w-6xl p-6 space-y-6">
                <div className="animate-pulse space-y-3">
                    <div className="h-7 w-2/3 bg-gray-200 rounded" />
                    <div className="h-4 w-1/2 bg-gray-200 rounded" />
                </div>
                <div className="h-40 bg-gray-100 rounded" />
            </main>
        );
    }

    const roleAllowed = role === 'admin' || role === 'admin2';
    if (err || !roleAllowed) {
        return (
            <main className="mx-auto w-full max-w-6xl p-6 space-y-6">
                {err ? (
                    <div className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{err}</div>
                ) : (
                    <div className="rounded border border-amber-200 bg-amber-50 p-3 text-amber-800">
                        Insufficient permissions. Your role is <strong>{String(role || 'unknown')}</strong>.
                    </div>
                )}
                <Link href={`/admin/property/${id}`} className="text-sm underline hover:no-underline">
                    ← Back to Property
                </Link>
            </main>
        );
    }

    if (!data) return null;

    return (
        <main className="mx-auto w-full max-w-6xl p-6 space-y-6">
            <div className="flex items-center justify-between">
                <Link href={`/admin/property/${id}`} className="text-sm underline hover:no-underline">
                    ← Property
                </Link>

                <div className="flex items-center gap-2">
                    {/* Invite Tenant (writes to /tenantInvites) */}
                    <button
                        className={`rounded border px-3 py-2 text-sm ${!canInvite ? 'opacity-50 cursor-not-allowed' : ''}`}
                        style={{ borderColor: COLORS.soft, color: COLORS.primary }}
                        disabled={!canInvite || inviteSending}
                        title={inviteDisabledReason || undefined}
                        onClick={sendInvite}
                    >
                        {inviteSending ? 'Sending…' : 'Invite Tenant'}
                    </button>

                    <ViewLeaseButton />

                    {!editMode ? (
                        <button
                            className="rounded border px-3 py-2 text-sm"
                            style={{ borderColor: COLORS.soft, color: COLORS.primary }}
                            onClick={() => setEditMode(true)}
                        >
                            Edit
                        </button>
                    ) : (
                        <>
                            <button
                                className="rounded border px-3 py-2 text-sm"
                                style={{ borderColor: COLORS.soft, color: COLORS.primary }}
                                onClick={save}
                                disabled={saving}
                            >
                                {saving ? 'Saving…' : 'Save'}
                            </button>
                            <Link
                                href={`/admin/property/${id}`}
                                className="rounded border px-3 py-2 text-sm"
                                style={{ borderColor: COLORS.soft, color: COLORS.primary }}
                            >
                                Back
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {/* Unit details (unit-only fields get saved) */}
            <section className="rounded border bg-white" style={{ borderColor: COLORS.border }}>
                <div className="px-4 py-2 text-sm" style={{ backgroundColor: COLORS.cardHeaderBg }}>
                    Unit Details
                </div>
                <div className="p-4 space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                        <div className="grid grid-cols-1 gap-2">
                            <label className="text-xs text-gray-600">Unit Number</label>
                            <input
                                className="rounded border p-2 text-sm"
                                style={{ borderColor: COLORS.border }}
                                value={data.unitNumber}
                                disabled={!editMode}
                                onChange={(e) => setData({ ...data, unitNumber: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            <label className="text-xs text-gray-600">Notes (unit-related only)</label>
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
                </div>
            </section>

            {/* Invite block (tenant fields shown here but not saved to unit) */}
            <section className="rounded border bg-white" style={{ borderColor: COLORS.border }}>
                <div className="px-4 py-2 text-sm" style={{ backgroundColor: COLORS.cardHeaderBg }}>
                    Tenant Invitation
                </div>
                <div className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid grid-cols-1 gap-2">
                            <label className="text-xs text-gray-600">Tenant Email</label>
                            <input
                                type="email"
                                inputMode="email"
                                autoComplete="email"
                                className="rounded border p-2 text-sm"
                                style={{ borderColor: COLORS.border }}
                                value={inviteEmail}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setInviteEmail(v);
                                    const trimmed = v.trim();
                                    setEmailError(
                                        trimmed && !isValidEmail(trimmed)
                                            ? 'Enter a valid email (e.g., name@example.com)'
                                            : null
                                    );
                                }}
                                onBlur={(e) => {
                                    const trimmed = e.target.value.trim();
                                    setEmailError(
                                        trimmed && !isValidEmail(trimmed)
                                            ? 'Enter a valid email (e.g., name@example.com)'
                                            : null
                                    );
                                }}
                                placeholder="Add tenant email to enable Invite"
                            />
                            {emailError ? <p className="text-xs text-red-600">{emailError}</p> : null}
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            <label className="text-xs text-gray-600">Tenant Name (optional)</label>
                            <input
                                className="rounded border p-2 text-sm"
                                style={{ borderColor: COLORS.border }}
                                value={inviteName}
                                onChange={(e) => setInviteName(e.target.value)}
                                placeholder="Full name (optional)"
                            />
                        </div>
                    </div>

                    {inviteMsg ? (
                        <div className="rounded border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-800">
                            {inviteMsg}
                        </div>
                    ) : null}
                </div>
            </section>

            {/* Upload placeholders (disabled when not editing) */}
            <section className="space-y-4">
                <div className="rounded border p-4 space-y-2" style={{ borderColor: COLORS.border }}>
                    <div className="text-sm font-medium">Lease Agreement</div>
                    <input type="file" accept="application/pdf" disabled={!editMode} />
                    <div className="text-xs text-gray-600">PDF only. Max 10MB. (placeholder)</div>
                </div>

                <div className="rounded border p-4 space-y-2" style={{ borderColor: COLORS.border }}>
                    <div className="text-sm font-medium">Other Documents</div>
                    <input type="file" multiple disabled={!editMode} />
                    <div className="text-xs text-gray-600">
                        Examples: insurance proof, move-in checklist, ID, photos, inspection reports. (placeholder)
                    </div>
                </div>
            </section>
        </main>
    );
}
