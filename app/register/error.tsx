"use client";

export default function RegisterError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="min-h-[50vh] flex items-center justify-center px-4">
            <div className="w-full max-w-md rounded-lg border border-amber-300 bg-amber-50 p-6 text-amber-900">
                <h2 className="text-lg font-semibold">We hit a snag creating your account.</h2>
                <p className="mt-2 text-sm">
                    {error?.message?.includes("email-already-in-use")
                        ? "That email is already registered. Please log in, or click “Forgot password” on the login page to reset it."
                        : "Please try again. If this continues, contact support."}
                </p>
                <div className="mt-4 flex gap-3">
                    <button
                        onClick={() => reset()}
                        className="rounded border border-amber-400 px-3 py-1 text-sm hover:bg-amber-100"
                    >
                        Try again
                    </button>
                    <a
                        href="/login"
                        className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
                    >
                        Go to Login
                    </a>
                </div>
            </div>
        </div>
    );
}
