"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
    collection, doc, onSnapshot, orderBy, query, where,
    addDoc, serverTimestamp, updateDoc, runTransaction,
} from "firebase/firestore";
import ThreadList, { Thread } from "@/admin-components/messages/ThreadList";
import MessageWindow, { Message } from "@/admin-components/messages/MessageWindow";

export default function AdminMessagesPage() {
    const [uid, setUid] = useState<string | null>(null);
    const [threads, setThreads] = useState<Thread[]>([]);
    const [active, setActive] = useState<Thread | null>(null);

    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null));
        return () => unsubAuth();
    }, []);

    useEffect(() => {
        if (!uid) return;
        const q = query(
            collection(db, "threads"),
            where("adminId", "==", uid),
            orderBy("lastMessageAt", "desc")
        );
        const unsub = onSnapshot(q, (snap) => {
            const t: Thread[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
            setThreads(t);
            if (!active && t.length) setActive(t[0]);
        });
        return () => unsub();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uid]);

    const send = async (body: string) => {
        if (!uid || !active) return;
        const threadRef = doc(db, "threads", active.id);
        // 1) add message
        await addDoc(collection(threadRef, "messages"), {
            adminId: active.adminId,
            tenantId: active.tenantId,
            authorId: uid,
            body,
            createdAt: serverTimestamp(),
            readBy: { [uid]: true },
        });
        // 2) update thread atomically (last message + unread for tenant)
        await runTransaction(db, async (tx) => {
            const snap = await tx.get(threadRef);
            if (!snap.exists()) return;
            const isAdminAuthor = uid === snap.data().adminId;
            const unreadField = isAdminAuthor ? "unreadCountTenant" : "unreadCountAdmin";
            tx.update(threadRef, {
                lastMessage: body,
                lastMessageAt: serverTimestamp(),
                [unreadField]: (snap.data()[unreadField] ?? 0) + 1,
            });
        });
    };

    const markRead = async (thread: Thread) => {
        if (!uid) return;
        const isAdmin = uid === thread.adminId;
        const update: any = isAdmin
            ? { lastReadAtAdmin: serverTimestamp(), unreadCountAdmin: 0 }
            : { lastReadAtTenant: serverTimestamp(), unreadCountTenant: 0 };
        await updateDoc(doc(db, "threads", thread.id), update);
    };

    return (
        <div className="p-6 grid gap-4 md:grid-cols-[280px_1fr]">
            <div className="rounded border bg-white">
                <div className="px-3 py-2 border-b font-semibold">Messages</div>
                <ThreadList
                    threads={threads}
                    activeId={active?.id ?? null}
                    onSelect={(t) => { setActive(t); markRead(t); }}
                />
            </div>

            <div className="rounded border bg-white min-h-[60vh]">
                {active ? (
                    <MessageWindow thread={active} onSend={send} onFocus={() => markRead(active)} />
                ) : (
                    <div className="p-6 text-sm text-gray-600">Select a conversation</div>
                )}
            </div>
        </div>
    );
}
