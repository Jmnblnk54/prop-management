import Link from "next/link";

export default function HowItWorksPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-6 text-center">How Domatia Works</h1>

      <div className="space-y-6 text-lg">
        <p>
          Domatia is a modern solution for landlords and property managers to
          manage rentals, communicate with tenants, and collect rent online.
        </p>

        <p>
          Whether you own a single-family home or a multi-unit building, Domatia
          adapts to your needs. Assign tenants to specific units, track lease
          status, manage insurance, maintenance, and more — all from one simple
          dashboard.
        </p>

        <p>
          Each admin account is private and secure. Tenants are directly linked
          to their specific landlord only.
        </p>

        <p>
          <strong>Pricing:</strong> We offer tiered pricing based on the number
          of units you manage. Start small and scale up as you grow.
        </p>

        <p>
          After signing up, you’ll be able to:
        </p>

        <ul className="list-disc list-inside ml-4 space-y-2">
          <li>Add and organize properties (by address and units)</li>
          <li>Invite tenants via email or SMS</li>
          <li>Upload leases, track insurance, and manage payments</li>
          <li>Send and receive messages and maintenance requests</li>
        </ul>

        <p>
          It only takes a few minutes to get started.
        </p>

        <div className="mt-10 text-center">
          <Link
            href="/register"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-lg font-semibold"
          >
            Get Started
          </Link>
        </div>
      </div>

      <p className="mt-12 text-center text-sm text-gray-400">
        Domatia is a Chemmos company.
      </p>
    </div>
  );
}
