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

export default function Sidebar({
    collapsed,
    onToggle,
}: {
    collapsed: boolean;
    onToggle: () => void;
}) {
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
        // No composite index needed (equality on adminId only).
        const q = query(collection(db, 'threads'), where('adminId', '==', uid));
        const unsub = onSnapshot(
            q,
            (snap) => {
                let total = 0;
                snap.forEach((d) => {
                    const n = (d.data() as any)?.unreadCountAdmin;
                    total += typeof n === 'number' ? n : 0;
                });
                setUnreadMessages(total);
            },
            () => setUnreadMessages(0) // swallow permission/index errors in dev
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

    // Drawer widths
    const OPEN_W = 'w-64';
    const CLOSED_W = 'w-0'; // fully hidden; we render a tiny handle separately

    return (
        <>
            {/* Drawer panel (fixed overlay so main stays centered across VIEWPORT) */}
            <aside
                className={`fixed left-0 top-0 z-40 h-screen border-r bg-white shadow-sm transition-[width] duration-200 ease-out overflow-hidden ${collapsed ? CLOSED_W : OPEN_W}`}
                aria-label="Admin Sidebar"
            >
                {/* Header with collapse control */}
                <div className="flex items-center justify-between px-3 py-3 border-b">
                    <div className="text-sm font-semibold">Admin</div>
                    <button
                        type="button"
                        onClick={onToggle}
                        className="inline-flex h-7 w-7 items-center justify-center rounded hover:bg-gray-100"
                        title="Collapse sidebar"
                        aria-label="Collapse sidebar"
                    >
                        {/* Chevron-left */}
                        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" fill="none" />
                        </svg>
                    </button>
                </div>

                {/* Nav */}
                <nav className="h-[calc(100vh-49px)] overflow-y-auto">
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
                                    >
                                        <span className="flex items-center gap-3">
                                            <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
                                                <path d={item.icon} stroke="currentColor" strokeWidth="2" fill="none" />
                                            </svg>
                                            <span>{item.label}</span>
                                        </span>

                                        {/* Unread badge for Messages (admin only) */}
                                        {isMessages && unreadMessages > 0 ? (
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
            </aside>

            {/* Collapse/expand HANDLE: always visible at the very left edge */}
            {collapsed ? (
                <button
                    type="button"
                    onClick={onToggle}
                    className="fixed left-0 top-24 z-50 inline-flex items-center gap-2 rounded-r border border-l-0 bg-white px-2 py-2 shadow-sm hover:bg-gray-50"
                    title="Open sidebar"
                    aria-label="Open sidebar"
                >
                    {/* Chevron-right */}
                    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                        <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" fill="none" />
                    </svg>
                    <span className="text-xs font-medium">Menu</span>
                </button>
            ) : null}
        </>
    );
}
