'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import RoleGate from '@/components/auth/RoleGate';

type PropertyType = 'single-family' | 'multi-unit' | 'mixed-use' | 'commercial' | 'other';

export default function NewPropertyPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [name, setName] = useState('');
  const [type, setType] = useState<PropertyType>('single-family');
  const [unitsCount, setUnitsCount] = useState<number>(1);
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('US');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;
    if (!address1.trim() || !city.trim() || !state.trim() || !postalCode.trim()) return false;
    if (type === 'multi-unit' && (!unitsCount || unitsCount < 1)) return false;
    return true;
  }, [name, address1, city, state, postalCode, type, unitsCount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !canSubmit || saving) return;

    setSaving(true);
    setError(null);
    try {
      const docRef = await addDoc(collection(db, 'properties'), {
        adminId: user.uid,
        name: name.trim(),
        type,
        unitsCount: type === 'multi-unit' ? Number(unitsCount) : 1,
        address: {
          line1: address1.trim(),
          line2: address2.trim() || null,
          city: city.trim(),
          state: state.trim(),
          postalCode: postalCode.trim(),
          country: country.trim(),
        },
        notes: notes.trim() || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // ➜ Go to property detail
      router.push(`/admin/property/${docRef.id}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to save property.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <RoleGate allowed={['admin']}>
    <main className="max-w-3xl mx-auto p-4 md:p-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-4">Add Property</h1>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Property name</label>
          <input
            className="w-full rounded border px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Maple Court Apartments"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              className="w-full rounded border px-3 py-2"
              value={type}
              onChange={(e) => setType(e.target.value as PropertyType)}
            >
              <option value="single-family">Single family</option>
              <option value="multi-unit">Multi-unit</option>
              <option value="mixed-use">Mixed-use</option>
              <option value="commercial">Commercial</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className={`${type === 'multi-unit' ? '' : 'opacity-50'}`}>
            <label className="block text-sm font-medium mb-1"># Units</label>
            <input
              type="number"
              min={1}
              className="w-full rounded border px-3 py-2"
              value={unitsCount}
              onChange={(e) => setUnitsCount(Number(e.target.value))}
              disabled={type !== 'multi-unit'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Country</label>
            <input
              className="w-full rounded border px-3 py-2"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="US"
            />
          </div>
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold">Address</legend>
          <input
            className="w-full rounded border px-3 py-2"
            value={address1}
            onChange={(e) => setAddress1(e.target.value)}
            placeholder="Address line 1"
          />
          <input
            className="w-full rounded border px-3 py-2"
            value={address2}
            onChange={(e) => setAddress2(e.target.value)}
            placeholder="Address line 2 (optional)"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              className="w-full rounded border px-3 py-2"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
            />
            <input
              className="w-full rounded border px-3 py-2"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="State"
            />
            <input
              className="w-full rounded border px-3 py-2"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="Postal code"
            />
          </div>
        </fieldset>

        <div>
          <label className="block text-sm font-medium mb-1">Notes (optional)</label>
          <textarea
            className="w-full rounded border px-3 py-2"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Owner portal URL, lockbox info, etc."
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={!canSubmit || saving}
            className="inline-flex items-center rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save property'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin-dashboard')}
            className="rounded border px-4 py-2 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </main>
    </RoleGate>
  );
}
