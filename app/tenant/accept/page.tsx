'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { COLORS } from '@/lib/constants';

function toBase64Url(bytes: Uint8Array) {
    const bin = String.fromCharCode(...bytes);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
async function sha256Base64Url(s: string) {
    const enc = new TextEncoder().encode(s);
    const digest = await crypto.subtle.digest('SHA-256', enc);
    return toBase64Url(new Uint8Array(digest));
}

export default function TenantAcceptPage() {
    const router = useRouter();
    const sp = useSearchParams();
    const inviteId = sp.get('invite') || '';
    const code = sp.get('code') || '';

    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [invite, setInvite] = useState<any | null>(null);
    const [agreed, setAgreed] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const ready = useMemo(() => Boolean(inviteId && code && userEmail && invite), [inviteId, code, userEmail, invite]);
    const emailMatches = useMemo(() => {
        if (!invite?.tenantEmail || !userEmail) return false;
        return invite.tenantEmail.trim().toLowerCase() === userEmail.trim().toLowerCase();
    }, [invite, userEmail]);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (!u) {
                const next = encodeURIComponent(`/tenant/accept?invite=${encodeURIComponent(inviteId)}&code=${encodeURIComponent(code)}`);
                router.push(`/login?next=${next}`);
                return;
            }
            setUserEmail(u.email || null);
            try {
                setLoading(true);
                const iRef = doc(db, 'tenantInvites', inviteId);
                const snap = await getDoc(iRef);
                if (!snap.exists()) {
                    setErr('Invite not found.');
                    setInvite(null);
                    return;
                }
                const d = snap.data() as any;
                const hash = await sha256Base64Url(code);
                if (d.codeHash !== hash) {
                    setErr('Invalid or expired invite code.');
                    setInvite(null);
                    return;
                }
                if (d.status && d.status !== 'sent') {
                    setErr('This invite is no longer valid.');
                    setInvite(null);
                    return;
                }
                setInvite({ ...d, id: inviteId });
            } catch (e: any) {
                setErr(e?.message || 'Failed to load invite.');
                setInvite(null);
            } finally {
                setLoading(false);
            }
        });
        return () => unsub();
    }, [inviteId, code, router]);

    async function accept() {
        const u = auth.currentUser;
        if (!u || !invite) return;
        if (!agreed || !emailMatches) return;
        try {
            setSubmitting(true);
            const tRef = doc(db, 'tenants', u.uid);
            const tSnap = await getDoc(tRef);
            if (!tSnap.exists()) {
                await setDoc(tRef, {
                    adminId: invite.adminId,
                    propertyId: invite.propertyId,
                    unitId: invite.unitId,
                    email: u.email || '',
                    name: u.displayName || null,
                    currentlyLiving: true,
                    createdAt: serverTimestamp(),
                });
            }
            try {
                const iRef = doc(db, 'tenantInvites', invite.id);
                await updateDoc(iRef, {
                    status: 'accepted',
                    acceptedAt: serverTimestamp(),
                    tenantId: u.uid,
                });
            } catch {
                // ignore if rules prevent tenant from updating invites
            }
            router.replace('/tenant');
        } catch (e: any) {
            setErr(e?.message || 'Could not accept invite.');
        } finally {
            setSubmitting(false);
        }
    }

    async function switchAccount() {
        const next = `/tenant/accept?invite=${encodeURIComponent(inviteId)}&code=${encodeURIComponent(code)}`;
        await signOut(auth);
        router.push(`/login?next=${encodeURIComponent(next)}`);
    }

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
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Accept Invite</h1>
                {invite?.tenantEmail ? (
                    <div className="text-sm text-gray-600">
                        This invite is for <strong>{invite.tenantEmail}</strong>
                    </div>
                ) : null}
                {userEmail && !emailMatches ? (
                    <div className="flex items-center gap-3 text-sm">
                        <div className="text-amber-700 rounded border border-amber-300 bg-amber-50 p-2">
                            You’re signed in as {userEmail}. Please switch to {invite?.tenantEmail}.
                        </div>
                        <button
                            className="rounded border px-3 py-1"
                            style={{ borderColor: COLORS.soft, color: COLORS.primary }}
                            onClick={switchAccount}
                        >
                            Switch account
                        </button>
                    </div>
                ) : null}
            </header>

            <section className="rounded border bg-white" style={{ borderColor: COLORS.border }}>
                <div className="px-4 py-2 text-sm" style={{ backgroundColor: COLORS.cardHeaderBg, color: '#000' }}>
                    Terms & Consent
                </div>
                <div className="p-4 space-y-3 text-sm text-gray-800">
                    <label className="flex items-start gap-2">
                        <input
                            type="checkbox"
                            className="mt-1 h-4 w-4"
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                        />
                        <span>
                            I agree to the Terms of Service, Privacy Policy, and consent to receive electronic communications.
                        </span>
                    </label>
                </div>
            </section>

            <div className="flex items-center gap-2">
                <button
                    className="rounded border px-4 py-2 text-sm"
                    style={{ borderColor: COLORS.soft, color: COLORS.primary }}
                    onClick={accept}
                    disabled={!ready || !agreed || !emailMatches || submitting}
                    title={!agreed ? 'Please accept the terms' : !emailMatches ? 'Sign in with the invited email' : undefined}
                >
                    {submitting ? 'Working…' : 'Accept Invite'}
                </button>
                <button
                    className="rounded border px-4 py-2 text-sm"
                    style={{ borderColor: COLORS.soft, color: COLORS.primary }}
                    onClick={() => router.push('/tenant')}
                    disabled={submitting}
                >
                    Go to Tenant Portal
                </button>
            </div>
        </main>
    );
}
