'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [propertyName, setPropertyName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordValid = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!passwordValid) {
      setError(
        'Password must be at least 8 characters long and include uppercase, lowercase, and a number.'
      );
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      await setDoc(doc(db, 'admins', user.uid), {
        uid: user.uid,
        email,
        fullName,
        propertyName,
        role: 'admin',
        onboardingCompleted: false,
      });

      router.push('/admin-dashboard');
    } catch (err: any) {
      console.error('Registration error:', err.message);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form
        onSubmit={handleRegister}
        className="bg-white p-6 rounded-lg shadow-md w-full max-w-md"
      >
        <h1 className="text-2xl font-bold mb-4 text-center">Create Your Account</h1>

        <label className="block mb-2 text-sm font-medium">Full Name or Business Name</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="w-full p-2 border border-gray-300 rounded mb-4"
        />

        <label className="block mb-2 text-sm font-medium">Your Property Name (Optional)</label>
        <input
          type="text"
          value={propertyName}
          onChange={(e) => setPropertyName(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mb-4"
        />

        <label className="block mb-2 text-sm font-medium">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-2 border border-gray-300 rounded mb-4"
        />

        <label className="block mb-2 text-sm font-medium">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-2 border border-gray-300 rounded mb-2"
        />

        {!passwordValid && password.length > 0 && (
          <div className="text-red-600 text-sm mb-2">
            Must be at least 8 characters, include upper and lowercase, and a number.
          </div>
        )}

        <label className="block mb-2 text-sm font-medium">Confirm Password</label>
        <div className="relative">
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full p-2 border border-gray-300 rounded"
          />
          {confirmPassword.length > 0 && (
            <span className="absolute right-3 top-2 text-xl">
              {passwordsMatch && passwordValid ? (
                <span className="text-green-600">✔️</span>
              ) : (
                <span className="text-red-600">❌</span>
              )}
            </span>
          )}
        </div>

        {!passwordsMatch && confirmPassword.length > 0 && (
          <div className="text-red-600 text-sm mt-1">Passwords do not match.</div>
        )}

        {error && <div className="text-red-600 text-sm mt-4">{error}</div>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-6 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          {isSubmitting ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>
    </main>
  );
}
