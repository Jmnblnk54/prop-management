"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, appUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user || !appUser) {
      router.push("/login");
    } else if (appUser.role === "admin") {
      router.push("/admin");
    } else {
      router.push("/user");
    }
  }, [user, appUser, loading, router]);

  return <p className="text-center mt-20">Loading...</p>;
}
