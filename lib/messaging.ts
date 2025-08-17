import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function openOrCreateThread(adminId: string, tenantId: string) {
  const threadId = `${adminId}__${tenantId}`;
  const ref = doc(db, "threads", threadId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      adminId,
      tenantId,
      lastMessage: "",
      lastMessageAt: serverTimestamp(),
      unreadCountAdmin: 0,
      unreadCountTenant: 0,
      lastReadAtAdmin: null,
      lastReadAtTenant: null,
    });
  }
  return { id: threadId };
}
