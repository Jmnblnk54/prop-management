"use client";

import Sidebar from "@/admin-components/navigation/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen grid grid-cols-[var(--sidebar-w,_16rem)_1fr]">
            <Sidebar collapsed={false} />
            <main className="bg-gray-50">{children}</main>
        </div>
    );
}
