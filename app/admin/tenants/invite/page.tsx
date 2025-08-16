'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import RoleGate from '@/components/auth/RoleGate';

interface PropertyOption {
  id: string;
  name: string;
  type?: string;
}

export default function InviteTenantPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading } = useAuth();

  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [unitLabel, setUnitLabel] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  // Load admin properties
  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, 'properties'), where('adminId', '==', user.uid));
        const snap = await getDocs(q);
        const opts: PropertyOption[] = [];
        snap.forEach((doc) => {
          const d = doc.data() as any;
          opts.push({ id: doc.id, name: d?.name || 'Untitled', type: d?.type });
        });
        setProperties(opts);

        // Preselect from ?property=
        const hint = params.get('property');
        if (hint && opts.some((o) => o.id === hint)) {
          setSelectedPropertyId(hint);
        } else if (!hint && opts.length === 1) {
          // UX nicety: single property auto-select
          setSelectedPropertyId(opts[0].id);
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load properties.');
      }
    };
    load();
  }, [user, params]);

  const canSubmit = useMemo(() => {
    const emailOk = /\S+@\S+\.\S+/.test(tenantEmail);
    return !!selectedPropertyId && emailOk && !sending;
  }, [selectedPropertyId, tenantEmail, sending]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !canSubmit) return;

    setSending(true);
    setError(null);
    try {
      await addDoc(collection(db, 'tenantInvites'), {
        adminId: user.uid,
        propertyId: selectedPropertyId,
        unit: unitLabel.trim() || null,
        tenantEmail: tenantEmail.trim().toLowerCase(),
        message: message.trim() || null,
        status: 'sent',
        createdAt: serverTimestamp(),
      });
      router.push(`/admin/property/${selectedPropertyId}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to send invite.');
    } finally {
      setSending(false);
    }
  };

  return (
    <RoleGate allowed={['admin']}>
      <main className="max-w-3xl mx-auto p-4 md:p-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-4">Invite Tenant</h1>

        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {properties.length === 0 ? (
          <div className="rounded border p-4">
            <p className="mb-3 text-sm text-gray-700">
              You don’t have any properties yet. Add a property before inviting tenants.
            </p>
            <Link
              href="/admin/properties/new"
              className="inline-flex items-center rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              + Add Property
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSendInvite} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1">Property</label>
              <select
                className="w-full rounded border px-3 py-2"
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
              >
                <option value="">Select a property…</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Tenant email</label>
                <input
                  type="email"
                  className="w-full rounded border px-3 py-2"
                  value={tenantEmail}
                  onChange={(e) => setTenantEmail(e.target.value)}
                  placeholder="tenant@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Unit (optional)</label>
                <input
                  className="w-full rounded border px-3 py-2"
                  value={unitLabel}
                  onChange={(e) => setUnitLabel(e.target.value)}
                  placeholder="e.g., A-3"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Message (optional)</label>
              <textarea
                rows={3}
                className="w-full rounded border px-3 py-2"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Include a note with move-in instructions or expectations."
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex items-center rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {sending ? 'Sending…' : 'Send invite'}
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
        )}
      </main>
    </RoleGate>
  );
}
