"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Header from "@/components/ui/Header";

export default function UserPage() {
  const { appUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!appUser || appUser.role !== "user")) {
      router.push("/login");
    }
  }, [appUser, loading, router]);

  if (loading) return <p>Loading...</p>;

  return (
    <>
      <Header />
      <div className="p-6">
        <h2 className="text-2xl font-semibold">User Dashboard</h2>
        <p>Welcome, {appUser?.email}!</p>
      </div>
    </>
  );
}
