import Link from "next/link";

export default function Footer() {
  return (
    <footer className="text-center text-sm py-6 border-t mt-12 text-gray-600">
      <p className="mb-2">
        <Link href="/legal/terms" className="hover:underline mx-2">
          Terms of Service
        </Link>
        |
        <Link href="/legal/privacy" className="hover:underline mx-2">
          Privacy Policy
        </Link>
        |
        <Link href="/legal/fair-housing" className="hover:underline mx-2">
          Fair Housing Notice
        </Link>
      </p>
      <p className="text-xs italic">Domatia is a Chemmo company.</p>
    </footer>
  );
}
