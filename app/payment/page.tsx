"use client";

import { useRouter } from "next/navigation";

export default function PaymentPage() {
  const router = useRouter();

  const handleBypass = () => {
    router.push("/admin-dashboard");
  };

  return (
    <div className="max-w-xl mx-auto py-16 px-6 text-center">
      <h1 className="text-3xl font-bold mb-4">Payment Coming Soon</h1>
      <p className="mb-8 text-gray-600">
        This is where payment integration will go. Once set up, admins will be able to securely enter billing info and complete setup.
      </p>

      <button
        onClick={handleBypass}
        className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded font-semibold"
      >
        Hi Josh! Click through here
      </button>
    </div>
  );
}
