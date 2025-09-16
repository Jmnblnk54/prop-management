'use client';

import { useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { usePathname, useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function AuthBoot() {
    const router = useRouter();
    const path = usePathname();

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (!u) return;

            try {
                if (path === '/' || path === '/login') {
                    const last = localStorage.getItem('lastDashboard');
                    if (last) {
                        router.replace(last);
                        return;
                    }

                    const adminSnap = await getDoc(doc(db, 'admins', u.uid));
                    if (adminSnap.exists()) {
                        localStorage.setItem('lastDashboard', '/admin');
                        router.replace('/admin');
                        return;
                    }

                    const tenantSnap = await getDoc(doc(db, 'tenants', u.uid));
                    if (tenantSnap.exists()) {
                        localStorage.setItem('lastDashboard', '/tenant');
                        router.replace('/tenant');
                        return;
                    }

                    await signOut(auth);
                }
            } catch {
                /* no-op */
            }
        });
        return () => unsub();
    }, [path, router]);

    return null;
}
