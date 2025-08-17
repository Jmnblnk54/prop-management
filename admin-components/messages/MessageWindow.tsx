"use client";

import { useEffect, useRef, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import type { Thread } from "./ThreadList";

export type Message = {
    id: string;
    authorId: string;
    body: string;
    createdAt?: any;
};

export default function MessageWindow({
    thread,
    onSend,
    onFocus,
}: {
    thread: Thread;
    onSend: (body: string) => Promise<void>;
    onFocus: () => void;
}) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const q = query(
            collection(db, "threads", thread.id, "messages"),
            orderBy("createdAt", "asc"),
            limit(200)
        );
        const unsub = onSnapshot(q, (snap) => {
            const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
            setMessages(rows);
            // scroll down after new messages arrive
            setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
        });
        return () => unsub();
    }, [thread.id]);

    return (
        <div className="flex h-full flex-col">
            <div className="px-4 py-2 border-b">
                <div className="font-semibold text-sm">Chat with Tenant {thread.tenantId.slice(0, 6)}…</div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2" onFocus={onFocus}>
                {messages.map((m) => (
                    <div key={m.id} className="text-sm">
                        <div className="inline-block rounded border px-3 py-1">
                            {m.body}
                        </div>
                    </div>
                ))}
                <div ref={scrollRef} />
            </div>

            <form
                onSubmit={async (e) => {
                    e.preventDefault();
                    const body = input.trim();
                    if (!body) return;
                    await onSend(body);
                    setInput("");
                }}
                className="border-t p-3 flex gap-2"
            >
                <input
                    className="flex-1 rounded border px-3 py-2 outline-none focus:border-gray-800"
                    placeholder="Type a message…"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onFocus={onFocus}
                />
                <button className="rounded bg-gray-900 text-white px-4 py-2 hover:bg-black" type="submit">
                    Send
                </button>
            </form>
        </div>
    );
}
