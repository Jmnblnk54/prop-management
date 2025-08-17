'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

type NavItem = {
    href: string;
    label: string;
    icon: string;
};

export default function Sidebar({ collapsed }: { collapsed: boolean }) {
    const pathname = usePathname();

    // Unread message count for the admin (sum of unreadCountAdmin across threads)
    const [uid, setUid] = useState<string | null>(null);
    const [unreadMessages, setUnreadMessages] = useState<number>(0);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null));
        return () => unsub();
    }, []);

    useEffect(() => {
        if (!uid) {
            setUnreadMessages(0);
            return;
        }
        // NOTE: No composite index required here — only equality on adminId.
        const q = query(collection(db, 'threads'), where('adminId', '==', uid));

        // Use the error callback to avoid Next.js runtime overlay on permission issues
        const unsub = onSnapshot(
            q,
            (snap) => {
                let total = 0;
                snap.forEach((d) => {
                    const data = d.data() as any;
                    const n = typeof data.unreadCountAdmin === 'number' ? data.unreadCountAdmin : 0;
                    total += n;
                });
                setUnreadMessages(total);
            },
            (_err) => {
                // Permission denied or other issues should not crash the UI
                setUnreadMessages(0);
            }
        );
        return () => unsub();
    }, [uid]);

    const NAV: NavItem[] = useMemo(
        () => [
            { href: '/admin-dashboard', label: 'Dashboard', icon: 'M4 6h16M4 12h16M4 18h16' },
            { href: '/admin/properties', label: 'Properties', icon: 'M4 7h16v10H4z M8 7V5h8v2' },
            { href: '/admin/tenants', label: 'Tenants', icon: 'M12 12a4 4 0 100-8 4 4 0 000 8 M4 20a8 8 0 0116 0' },
            { href: '/admin/maintenance', label: 'Maintenance', icon: 'M7 7l10 10M7 17L17 7' },
            { href: '/admin/messages', label: 'Messages', icon: 'M4 6h16v12H4z M4 6l8 6 8-6' },
            { href: '/admin/payments', label: 'Payments', icon: 'M4 7h16v10H4z' },
            { href: '/admin/reports', label: 'Reports', icon: 'M7 7h10v10H7z M7 12h10' },
            { href: '/admin/settings', label: 'Settings', icon: 'M12 8a4 4 0 100 8 4 4 0 000-8' },
        ],
        []
    );

    return (
        <nav
            aria-label="Sidebar"
            className={`h-[calc(100vh-56px)] sticky top-14 border-r bg-white transition-all ${collapsed ? 'w-16' : 'w-64'
                }`}
            style={{ ['--sidebar-w' as any]: collapsed ? '4rem' : '16rem' }}
        >
            <ul className="py-3">
                {NAV.map((item) => {
                    const active = pathname === item.href || pathname?.startsWith(item.href + '/');
                    const isMessages = item.label === 'Messages';
                    return (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                className={`mx-2 my-0.5 flex items-center justify-between rounded px-2 py-2 text-sm hover:bg-gray-100 ${active ? 'bg-gray-100 font-medium' : ''
                                    }`}
                                title={collapsed ? item.label : undefined}
                            >
                                <span className="flex items-center gap-3">
                                    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
                                        <path d={item.icon} stroke="currentColor" strokeWidth="2" fill="none" />
                                    </svg>
                                    <span className={collapsed ? 'sr-only' : ''}>{item.label}</span>
                                </span>

                                {/* Unread badge for Messages (admin only), hidden when collapsed */}
                                {!collapsed && isMessages && unreadMessages > 0 ? (
                                    <span className="ml-2 inline-flex min-w-[1.25rem] justify-center rounded-full bg-gray-900 px-1 text-xs font-medium text-white">
                                        {unreadMessages}
                                    </span>
                                ) : null}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
