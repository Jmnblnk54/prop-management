'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import RoleGate from '@/components/auth/RoleGate';

type PropertyDoc = {
  id: string;
  name?: string | null;
  adminId: string;
  address: {
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
  };
  type?: string;
};

const NEW_NAME = '__NEW_NAME__';
const NO_NAME = '__NO_NAME__';
const NEW_ADDR = '__NEW_ADDR__';

export default function NewPropertyPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Source data (existing props for this admin)
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [source, setSource] = useState<PropertyDoc[]>([]);

  // Form state
  const [nameSelect, setNameSelect] = useState<string>(NO_NAME);
  const [nameInput, setNameInput] = useState('');
  const [addrSelect, setAddrSelect] = useState<string>(NEW_ADDR);
  const [addrLine1Input, setAddrLine1Input] = useState('');
  const [addrLine2, setAddrLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateProv, setStateProv] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('USA');
  const [ptype, setPtype] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [inlineMsg, setInlineMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load existing properties for this admin (names & addresses)
  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoadingOptions(true);
      try {
        const qRef = query(collection(db, 'properties'), where('adminId', '==', user.uid));
        const snap = await getDocs(qRef);
        const list: PropertyDoc[] = [];
        snap.forEach((d) => {
          const v = d.data() as any;
          list.push({
            id: d.id,
            name: v?.name ?? null,
            adminId: v?.adminId,
            address: {
              line1: v?.address?.line1 || '',
              line2: v?.address?.line2 ?? null,
              city: v?.address?.city || '',
              state: v?.address?.state || '',
              postalCode: v?.address?.postalCode || '',
              country: v?.address?.country || '',
            },
            type: v?.type || '',
          });
        });
        setSource(list);
      } finally {
        setLoadingOptions(false);
      }
    };
    load();
  }, [user]);

  const nameOptions = useMemo(() => {
    const set = new Set<string>();
    source.forEach((p) => {
      if (p.name && p.name.trim().length > 0) set.add(p.name.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [source]);

  const isExistingNameSelected =
    nameSelect !== NEW_NAME && nameSelect !== NO_NAME && nameSelect.trim().length > 0;

  // Addresses filtered by selected name (only if a real existing name is selected)
  const addressOptions = useMemo(() => {
    const all = source.map((p) => p.address.line1).filter(Boolean);
    if (isExistingNameSelected) {
      const filtered = source
        .filter((p) => (p.name || '').trim() === nameSelect)
        .map((p) => p.address.line1)
        .filter(Boolean);
      return Array.from(new Set(filtered)).sort((a, b) => a.localeCompare(b));
    }
    // Otherwise, show all addresses
    return Array.from(new Set(all)).sort((a, b) => a.localeCompare(b));
  }, [source, isExistingNameSelected, nameSelect]);

  // If user chooses an existing address, auto-fill property name when that address has a name
  useEffect(() => {
    if (addrSelect === NEW_ADDR) return;
    const match = source.find((p) => p.address.line1 === addrSelect);
    if (match) {
      if (match.name && match.name.trim().length > 0) {
        setNameSelect(match.name.trim());
        setNameInput('');
      } else {
        // The matched property previously had no name
        setNameSelect(NO_NAME);
        setNameInput('');
      }
    }
  }, [addrSelect, source]);

  // If user chooses an existing name and that name maps to only one address, auto-select it
  useEffect(() => {
    if (!isExistingNameSelected) return;
    const addrs = source
      .filter((p) => (p.name || '').trim() === nameSelect)
      .map((p) => p.address.line1);
    const unique = Array.from(new Set(addrs));
    if (unique.length === 1) {
      setAddrSelect(unique[0]);
      setAddrLine1Input('');
    } else {
      // multiple addresses with same name → force selection
      setAddrSelect(NEW_ADDR);
    }
  }, [isExistingNameSelected, nameSelect, source]);

  // Resolve final values
  const resolvedName =
    nameSelect === NEW_NAME ? nameInput.trim() : nameSelect === NO_NAME ? '' : nameSelect;
  const resolvedLine1 = addrSelect === NEW_ADDR ? addrLine1Input.trim() : addrSelect;

  const canSubmit =
    !!user &&
    !submitting &&
    resolvedLine1.length > 0 &&
    city.trim().length > 0 &&
    stateProv.trim().length > 0 &&
    postalCode.trim().length > 0;

  const resetForm = () => {
    setNameSelect(NO_NAME);
    setNameInput('');
    setAddrSelect(NEW_ADDR);
    setAddrLine1Input('');
    setAddrLine2('');
    setCity('');
    setStateProv('');
    setPostalCode('');
    setCountry('USA');
    setPtype('');
    setError(null);
  };

  const refreshOptions = async () => {
    if (!user) return;
    try {
      const qRef = query(collection(db, 'properties'), where('adminId', '==', user.uid));
      const snap = await getDocs(qRef);
      const next: PropertyDoc[] = [];
      snap.forEach((d) => {
        const v = d.data() as any;
        next.push({
          id: d.id,
          name: v?.name ?? null,
          adminId: v?.adminId,
          address: {
            line1: v?.address?.line1 || '',
            line2: v?.address?.line2 ?? null,
            city: v?.address?.city || '',
            state: v?.address?.state || '',
            postalCode: v?.address?.postalCode || '',
            country: v?.address?.country || '',
          },
          type: v?.type || '',
        });
      });
      setSource(next);
    } catch {
      // ignore
    }
  };

  const saveProperty = async (): Promise<string | null> => {
    if (!user) return null;
    setSubmitting(true);
    setInlineMsg(null);
    setError(null);
    try {
      const docRef = await addDoc(collection(db, 'properties'), {
        adminId: user.uid,
        name: resolvedName.length > 0 ? resolvedName : null, 
        type: ptype || null,
        address: {
          line1: resolvedLine1,
          line2: addrLine2.trim() || null,
          city: city.trim(),
          state: stateProv.trim(),
          postalCode: postalCode.trim(),
          country: country.trim() || null,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (e: any) {
      setError(e?.message || 'Failed to save property.');
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  const handleSave = async () => {
    const id = await saveProperty();
    if (id) {
      router.push(`/admin/property/${id}`);
    }
  };

  const handleSaveAndAddMore = async () => {
    const id = await saveProperty();
    if (id) {
      await refreshOptions();
      resetForm();
      setInlineMsg('Property saved. You can add another now.');
    }
  };

  return (
    <RoleGate allowed={['admin']}>
      <main className="max-w-3xl mx-auto p-4 md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold">Add Property</h1>
          <Link href="/admin-dashboard" className="text-sm underline hover:no-underline">
            Back to dashboard
          </Link>
        </div>

        {inlineMsg && (
          <div className="mb-4 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {inlineMsg}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-6"
        >
          {/* Property Name (optional) */}
          <div>
            <label className="mb-1 block text-sm font-medium">Property Name (optional)</label>
            <select
              className="w-full rounded border px-3 py-2"
              value={nameSelect}
              onChange={(e) => setNameSelect(e.target.value)}
              disabled={loading || loadingOptions || submitting}
            >
              <option value={NO_NAME}>No Property Name</option>
              <option value={NEW_NAME}>New Property Name…</option>
              {nameOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            {nameSelect === NEW_NAME && (
              <input
                className="mt-2 w-full rounded border px-3 py-2"
                placeholder="e.g., Maple Court Apartments"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                disabled={submitting}
              />
            )}
          </div>

          {/* Address Line 1 (dependent on name selection only if an existing name chosen) */}
          <div>
            <label className="mb-1 block text-sm font-medium">Address Line 1</label>
            <select
              className="w-full rounded border px-3 py-2"
              value={addrSelect}
              onChange={(e) => setAddrSelect(e.target.value)}
              disabled={loading || loadingOptions || submitting}
            >
              <option value={NEW_ADDR}>New Address Line 1…</option>
              {addressOptions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            {addrSelect === NEW_ADDR && (
              <input
                className="mt-2 w-full rounded border px-3 py-2"
                placeholder="e.g., 123 Main St"
                value={addrLine1Input}
                onChange={(e) => setAddrLine1Input(e.target.value)}
                disabled={submitting}
              />
            )}
          </div>

          {/* Address Line 2 (unit/suite), City/State/Postal/Country */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Address Line 2 (Unit/Suite)</label>
              <input
                className="w-full rounded border px-3 py-2"
                placeholder="Optional (e.g., Apt 2B)"
                value={addrLine2}
                onChange={(e) => setAddrLine2(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">City</label>
              <input
                className="w-full rounded border px-3 py-2"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">State/Province</label>
              <input
                className="w-full rounded border px-3 py-2"
                value={stateProv}
                onChange={(e) => setStateProv(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Postal Code</label>
              <input
                className="w-full rounded border px-3 py-2"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Country</label>
              <input
                className="w-full rounded border px-3 py-2"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                disabled={submitting}
                placeholder="USA"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Type (optional)</label>
              <input
                className="w-full rounded border px-3 py-2"
                placeholder="e.g., apartment, duplex, single-family"
                value={ptype}
                onChange={(e) => setPtype(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Save Property
            </button>
            <button
              type="button"
              onClick={handleSaveAndAddMore}
              disabled={!canSubmit}
              className="rounded border px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
            >
              Save & Add More
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin-dashboard')}
              className="ml-auto rounded border px-4 py-2 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </RoleGate>
  );
}
