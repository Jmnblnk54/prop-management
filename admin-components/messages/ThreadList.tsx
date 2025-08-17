"use client";

export type Thread = {
    id: string;
    adminId: string;
    tenantId: string;
    lastMessage?: string;
    lastMessageAt?: any;
    unreadCountAdmin?: number;
    unreadCountTenant?: number;
    // you can add tenant display name/email later
};

export default function ThreadList({
    threads,
    activeId,
    onSelect,
}: {
    threads: Thread[];
    activeId: string | null;
    onSelect: (t: Thread) => void;
}) {
    if (!threads.length) {
        return <div className="p-3 text-sm text-gray-500">No conversations yet.</div>;
    }
    return (
        <ul className="divide-y">
            {threads.map((t) => {
                const unread = t.unreadCountAdmin ?? 0; // admin inbox
                const active = t.id === activeId;
                return (
                    <li
                        key={t.id}
                        className={`px-3 py-2 cursor-pointer ${active ? "bg-gray-50" : ""}`}
                        onClick={() => onSelect(t)}
                    >
                        <div className="flex items-center justify-between">
                            <div className="font-medium text-sm">Tenant {t.tenantId.slice(0, 6)}…</div>
                            {unread > 0 && (
                                <span className="rounded bg-gray-900 text-white text-xs px-2 py-0.5">
                                    {unread}
                                </span>
                            )}
                        </div>
                        <div className="text-xs text-gray-600 truncate">
                            {t.lastMessage || "New conversation"}
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
