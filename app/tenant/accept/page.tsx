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
    const [switching, setSwitching] = useState(false);

    const emailMatches = useMemo(() => {
        if (!invite?.tenantEmail || !userEmail) return false;
        return invite.tenantEmail.trim().toLowerCase() === userEmail.trim().toLowerCase();
    }, [invite, userEmail]);

    // Ready means we have an invite loaded and the user is signed in (match may be true/false)
    const ready = useMemo(() => Boolean(inviteId && code && invite && userEmail), [inviteId, code, invite, userEmail]);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            setUserEmail(u?.email || null);

            // Try loading the invite once we know current auth state
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

                // Verify code
                const hash = await sha256Base64Url(code);
                if (d.codeHash !== hash) {
                    setErr('Invalid or expired invite code.');
                    setInvite(null);
                    return;
                }

                // Invite status gate
                if (d.status && d.status !== 'sent') {
                    setErr('This invite is no longer valid.');
                    setInvite(null);
                    return;
                }

                setInvite({ ...d, id: inviteId });
                setErr(null);
            } catch (e: any) {
                // If read is blocked by rules (e.g., signed into wrong account),
                // surface a helpful message but keep going—user can switch accounts below.
                setErr(e?.message || 'Failed to load invite.');
                setInvite(null);
            } finally {
                setLoading(false);
            }

            // If not signed in at all, send to login with return URL back here.
            if (!u) {
                const next = `/tenant/accept?invite=${encodeURIComponent(inviteId)}&code=${encodeURIComponent(code)}`;
                router.replace(`/login?next=${encodeURIComponent(next)}`);
            }
        });

        return () => unsub();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inviteId, code]);

    async function accept() {
        const u = auth.currentUser;
        if (!u || !invite) return;
        if (!agreed || !emailMatches) return;

        try {
            setSubmitting(true);

            // Create tenant doc if missing
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

            // Mark invite accepted (best-effort; tenant may be allowed by rules)
            try {
                const iRef = doc(db, 'tenantInvites', invite.id);
                await updateDoc(iRef, {
                    status: 'accepted',
                    acceptedAt: serverTimestamp(),
                    tenantId: u.uid,
                });
            } catch {
                // ignore if rules prevent write here
            }

            // Remember tenant dashboard and go
            try {
                localStorage.setItem('lastDashboard', '/tenant');
            } catch { }
            router.replace('/tenant');
        } catch (e: any) {
            setErr(e?.message || 'Could not accept invite.');
        } finally {
            setSubmitting(false);
        }
    }

    async function switchAccount() {
        try {
            setSwitching(true);
            const next = `/tenant/accept?invite=${encodeURIComponent(inviteId)}&code=${encodeURIComponent(code)}`;
            try {
                localStorage.removeItem('lastDashboard');
            } catch { }
            await signOut(auth).catch(() => { });
            router.replace(`/login?next=${encodeURIComponent(next)}`);
        } finally {
            setSwitching(false);
        }
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

    // If we couldn't load the invite, show error and (if signed in as someone) offer to switch
    if (err && !invite) {
        return (
            <main className="mx-auto w-full max-w-2xl p-6 space-y-6">
                <div className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{err}</div>
                {userEmail ? (
                    <button
                        className="rounded border px-4 py-2 text-sm"
                        style={{ borderColor: COLORS.soft, color: COLORS.primary }}
                        onClick={switchAccount}
                        disabled={switching}
                    >
                        {switching ? 'Working…' : 'Switch account'}
                    </button>
                ) : null}
            </main>
        );
    }

    // Normal UI
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
                    <div className="space-y-2">
                        <div className="text-sm text-amber-700 rounded border border-amber-300 bg-amber-50 p-2">
                            You’re signed in as <strong>{userEmail}</strong>. Please switch to <strong>{invite?.tenantEmail || 'the invited email'}</strong>.
                        </div>
                        <button
                            className="rounded border px-3 py-2 text-sm"
                            style={{ borderColor: COLORS.soft, color: COLORS.primary }}
                            onClick={switchAccount}
                            disabled={switching}
                            title="Sign out and sign in with the invited email"
                        >
                            {switching ? 'Working…' : `Switch to ${invite?.tenantEmail || 'invited email'}`}
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
                    title={
                        !userEmail
                            ? 'Please sign in'
                            : !invite
                                ? 'Invite not loaded'
                                : !agreed
                                    ? 'Please accept the terms'
                                    : !emailMatches
                                        ? 'Sign in with the invited email'
                                        : undefined
                    }
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
