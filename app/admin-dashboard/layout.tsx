"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Sidebar from "@/admin-components/navigation/Sidebar";
import MobileNav from "@/admin-components/navigation/MobileNav";
import AccountMenu from "@/admin-components/navigation/AccountMenu";
import AccessGate from "@/admin-components/AccessGate";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("admin.sidebar.collapsed");
        if (saved === "true") setSidebarCollapsed(true);
    }, []);

    const toggleSidebar = useCallback(() => {
        setSidebarCollapsed((v) => {
            const next = !v;
            localStorage.setItem("admin.sidebar.collapsed", String(next));
            return next;
        });
    }, []);

    return (
        <div className="min-h-screen bg-white text-gray-900">
            <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
                <div className="flex h-14 items-center gap-3 px-3 md:px-5">
                    <button
                        className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded hover:bg-gray-100"
                        aria-label="Open menu"
                        aria-controls="mobile-drawer"
                        aria-expanded={mobileOpen}
                        onClick={() => setMobileOpen(true)}
                    >
                        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>

                    <Link href="/admin-dashboard" className="font-semibold tracking-tight">
                        Domatia
                    </Link>

                    <div className="ml-4 hidden md:flex items-center gap-2">
                        <Link
                            href="/admin/properties/new"
                            className="inline-flex items-center rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                        >
                            + Add Property
                        </Link>
                        <Link
                            href="/admin/tenants/invite"
                            className="inline-flex items-center rounded border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
                        >
                            Invite Tenant
                        </Link>
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        <button
                            className="hidden md:inline-flex h-9 w-9 items-center justify-center rounded hover:bg-gray-100"
                            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                            onClick={toggleSidebar}
                        >
                            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                                <path
                                    d={sidebarCollapsed ? "M9 6l6 6-6 6" : "M15 6l-6 6 6 6"}
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                        <AccountMenu />
                    </div>
                </div>
            </header>

            <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
            <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />

            <main className="min-h-[calc(100vh-56px)] w-full px-4 md:px-64">
                <AccessGate requiredRole="admin">
                    <div className="mx-auto w-full max-w-2xl p-6">{children}</div>
                </AccessGate>
            </main>
        </div>
    );
}
