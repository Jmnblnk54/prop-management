import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white text-gray-800 px-4 text-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to Domatia</h1>
      <p className="text-lg max-w-xl mb-8">
        Streamlined property management for owners, tenants, and landlords.
        Whether you manage a single unit or an entire building, Domatia gives
        you the tools to stay organized and efficient.
      </p>

      <Link
        href="/login"
        className="bg-black text-white px-6 py-3 rounded-md hover:bg-gray-900 transition"
      >
        Log In to Your Dashboard
      </Link>

      <footer className="mt-16 text-sm text-gray-500">
        Domatia is a Chemmos company.
      </footer>
    </main>
  );
}
