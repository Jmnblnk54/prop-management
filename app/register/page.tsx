"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    propertyName: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // TODO: Replace this with actual Firebase Auth registration
    console.log("Registering admin:", form);
    router.push("/payment"); // Go to payment step next
  };

  const handleBypass = () => {
    router.push("/admin-dashboard");
  };

  return (
    <div className="max-w-lg mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-8 text-center">Create Your Admin Account</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="name">Full Name</label>
          <input
            name="name"
            id="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="email">Email Address</label>
          <input
            name="email"
            id="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="password">Password</label>
          <input
            name="password"
            id="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="propertyName">Property Name (optional)</label>
          <input
            name="propertyName"
            id="propertyName"
            type="text"
            value={form.propertyName}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded font-semibold"
        >
          Continue to Payment
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          Just testing?{" "}
          <button onClick={handleBypass} className="underline text-blue-600 hover:text-blue-800">
            Hi Josh! Click through here
          </button>
        </p>
      </div>
    </div>
  );
}
