'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { COLORS } from '@/lib/constants';

export default function TenantGate({
    children,
    allowUnlinked = false,
}: {
    children: React.ReactNode;
    allowUnlinked?: boolean;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [ok, setOk] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (!u) {
                router.push('/login?next=/tenant');
                return;
            }
            try {
                setLoading(true);
                const snap = await getDoc(doc(db, 'tenants', u.uid));
                if (!snap.exists()) {
                    if (allowUnlinked) {
                        setOk(true);
                    } else {
                        setErr('No tenant record found for this account.');
                        setOk(false);
                    }
                } else {
                    setOk(true);
                    setErr(null);
                }
            } catch (e: any) {
                setErr(e?.message || 'Failed to verify tenant access.');
                setOk(false);
            } finally {
                setLoading(false);
            }
        });
        return () => unsub();
    }, [router, allowUnlinked]);

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

    if (!ok) {
        return (
            <main className="mx-auto w-full max-w-2xl p-6 space-y-6">
                <div className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{err || 'Access denied.'}</div>
            </main>
        );
    }

    return <>{children}</>;
}
