'use client';

import { useRouter } from 'next/navigation';

export default function AccessDenied() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-4xl font-bold mb-4">🚫 Access Denied</h1>
      <p className="text-lg mb-8">
        You do not have permission to view this page.
      </p>

      <div className="flex gap-4">
        <button
          onClick={() => router.back()}
          className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          ⬅️ Go Back
        </button>
        <button
          onClick={() => router.push('/login')}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500"
        >
          🔐 Login
        </button>
      </div>
    </div>
  );
}
