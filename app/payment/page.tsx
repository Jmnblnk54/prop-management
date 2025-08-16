'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function PaymentPage() {
  const router = useRouter();
  const { user, appUser, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  return (
    <main className="max-w-xl mx-auto p-8 text-center">
      <h1 className="text-3xl font-bold mb-6">Choose a Plan</h1>
      <p className="mb-6 text-gray-600">
        Payments will be handled here in the future. For now, click below to continue setup.
      </p>

      <div className="mb-10">
        {/* Replace with actual pricing UI when ready */}
        <p className="text-lg font-medium">Starter Plan: $15/month</p>
        <p className="text-sm text-gray-500">For up to 20 rental units</p>
      </div>

      <button
        onClick={() => router.push('/admin-dashboard')}
        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
      >
        Hi Josh! Click here to continue →
      </button>
    </main>
  );
}
