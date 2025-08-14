"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Header from "@/components/ui/Header";

export default function AdminPage() {
  const { appUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!appUser || appUser.role !== "admin")) {
      router.push("/login");
    }
  }, [appUser, loading, router]);

  if (loading) return <p>Loading...</p>;

  return (
    <>
      <Header />
      <div className="p-6">
        <h2 className="text-2xl font-semibold">Admin Dashboard</h2>
        <p>Welcome Admin: {appUser?.email}</p>
      </div>
    </>
  );
}
