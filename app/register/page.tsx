"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ensureAdminProfile } from "@/lib/ensureAdmin";

export default function RegisterPage() {
  const router = useRouter();

  const [fullNameOrBusinessName, setFullNameOrBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agree, setAgree] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [errorCode, setErrorCode] = useState<string>("");

  const passwordChecks = useMemo(() => {
    const len = password.length >= 8;
    const upper = /[A-Z]/.test(password);
    const lower = /[a-z]/.test(password);
    const num = /[0-9]/.test(password);
    const special = /[^A-Za-z0-9]/.test(password);
    return { len, upper, lower, num, special };
  }, [password]);

  const passwordValid = useMemo(() => {
    const { len, upper, lower, num, special } = passwordChecks;
    return len && upper && lower && num && special;
  }, [passwordChecks]);

  const matches = useMemo(
    () => confirm.length > 0 && password === confirm,
    [password, confirm]
  );

  const canSubmit =
    fullNameOrBusinessName.trim().length > 0 &&
    email.trim().length > 0 &&
    passwordValid &&
    matches &&
    agree &&
    !isSubmitting;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setErrorMsg("");
    setErrorCode("");

    try {
      const normalizedEmail = email.trim();

      // If the email already exists, jump to Login with context.
      const methods = await fetchSignInMethodsForEmail(auth, normalizedEmail);
      if (methods.length > 0) {
        router.push(`/login?email=${encodeURIComponent(normalizedEmail)}&notice=existing`);
        return;
      }

      const cred = await createUserWithEmailAndPassword(auth, normalizedEmail, password);

      if (fullNameOrBusinessName.trim()) {
        await updateProfile(cred.user, { displayName: fullNameOrBusinessName.trim() });
      }

      await ensureAdminProfile(cred.user);
      router.push("/admin-dashboard");
    } catch (err: any) {
      const code = err?.code || "";
      let friendly = "Registration failed. Please try again.";

      if (code === "auth/invalid-email") {
        friendly = "That email address looks invalid. Please check and try again.";
      } else if (code === "auth/weak-password") {
        friendly = "Your password is too weak. Please use a stronger password.";
      } else if (code === "auth/operation-not-allowed") {
        friendly = "Email/password sign-up is disabled for this project.";
      } else {
        friendly = err?.message || friendly;
      }

      setErrorCode(code);
      setErrorMsg(friendly);
      if (code !== "auth/email-already-in-use") {
        console.error("Registration error:", code || err); // avoid noisy dev overlay for known flow
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const Check = ({ ok }: { ok: boolean }) => (
    <span className={`ml-2 text-sm ${ok ? "text-green-600" : "text-red-600"}`}>{ok ? "✓" : "✗"}</span>
  );

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="mb-6 text-2xl font-semibold">Create your admin account</h1>

        {errorMsg ? (
          <div className="mb-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900" role="alert">
            <p>{errorMsg}</p>
            {errorCode === "auth/email-already-in-use" && (
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <Link href={`/login?email=${encodeURIComponent(email.trim())}&notice=existing`}
                  className="inline-block rounded border border-gray-300 px-3 py-1 text-xs font-medium hover:bg-gray-50">
                  Go to Login
                </Link>
                <span className="text-xs">On the login page, click <strong>Forgot password</strong> to reset.</span>
              </div>
            )}
          </div>
        ) : null}

        <form onSubmit={handleRegister} className="space-y-4" noValidate>
          <div>
            <label className="mb-1 block text-sm font-medium">Full name or Business name</label>
            <input
              type="text"
              value={fullNameOrBusinessName}
              onChange={(e) => setFullNameOrBusinessName(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-gray-800"
              placeholder="e.g., Joshua Smith or Domatia LLC"
              autoComplete="name"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-gray-800"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-gray-800"
              placeholder="Create a strong password"
              autoComplete="new-password"
              required
            />
            <ul className="mt-2 space-y-1 text-xs">
              <li className="flex items-center">At least 8 characters <Check ok={passwordChecks.len} /></li>
              <li className="flex items-center">Uppercase letter <Check ok={passwordChecks.upper} /></li>
              <li className="flex items-center">Lowercase letter <Check ok={passwordChecks.lower} /></li>
              <li className="flex items-center">Number <Check ok={passwordChecks.num} /></li>
              <li className="flex items-center">Special character <Check ok={passwordChecks.special} /></li>
            </ul>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={`w-full rounded border px-3 py-2 outline-none focus:border-gray-800 ${confirm.length ? (matches && passwordValid ? "border-green-500" : "border-red-500") : "border-gray-300"
                }`}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              required
            />
            {confirm.length > 0 && (
              <p className={`mt-1 text-xs ${matches && passwordValid ? "text-green-700" : "text-red-700"}`}>
                {matches && passwordValid
                  ? "Passwords match and meet requirements ✓"
                  : "Passwords do not match or fail requirements ✗"}
              </p>
            )}
          </div>

          <div className="flex items-start gap-2">
            <input
              id="agree"
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-1 h-4 w-4"
              required
            />
            <label htmlFor="agree" className="text-sm">
              I agree to the <a href="/terms" className="underline hover:no-underline">Terms of Service</a> and{" "}
              <a href="/privacy" className="underline hover:no-underline">Privacy Policy</a>.
            </label>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full rounded px-4 py-2 font-medium text-white ${canSubmit ? "bg-gray-900 hover:bg-black" : "bg-gray-400"
              }`}
          >
            {isSubmitting ? "Creating account…" : "Create account"}
          </button>

          <div className="pt-1 text-center text-xs text-gray-500">
            <a href="/payment?skip=1" className="underline hover:no-underline">Hi Josh! click through here</a>
          </div>
        </form>

        <div className="mt-6 text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="underline hover:no-underline">Log in</Link>
        </div>
      </div>
    </div>
  );
}
