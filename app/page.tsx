import Link from "next/link";

export default function PublicLandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full flex items-center justify-between px-6 py-4 border-b bg-white shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">Domatia</h1>
        <Link
          href="/login"
          className="text-sm font-medium text-white bg-black px-4 py-2 rounded hover:bg-gray-800 transition"
        >
          Log In
        </Link>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center flex-grow text-center px-4 py-20 bg-gradient-to-b from-white to-gray-50">
        <h2 className="text-4xl md:text-5xl font-bold max-w-3xl mb-6 leading-tight">
          Modern Property Management for Landlords
        </h2>
        <p className="text-lg text-gray-600 max-w-xl mb-8">
          Collect rent, manage maintenance, and communicate with tenants — all from one simple dashboard.
        </p>
        <Link
          href="/how-it-works"
          className="bg-black text-white px-6 py-3 rounded text-lg font-medium hover:bg-gray-800 transition"
        >
          Get Started – See How It Works
        </Link>
      </section>

      {/* Placeholder Sections (Optional for Now) */}
      <section className="px-6 py-12 text-center">
        <h3 className="text-2xl font-semibold mb-4">Why Domatia?</h3>
        <p className="text-gray-600 max-w-2xl mx-auto">
          We built Domatia to make property management easy — whether you manage 5 units or 500.
        </p>
        {/* Add features, screenshots, etc. here later */}
      </section>


    </main>
  );
}
