import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { User } from "firebase/auth";

export async function ensureAdminProfile(u: User) {
  const ref = doc(db, "admins", u.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      role: "admin",
      email: u.email ?? "",
      displayName: u.displayName || (u.email?.split("@")[0] ?? "Admin"),
      onboardingCompleted: false,
      createdAt: serverTimestamp(),
    });
  }
}
