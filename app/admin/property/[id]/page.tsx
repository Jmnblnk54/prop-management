'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

import RoleGate from '@/components/auth/RoleGate';

type Property = {
  adminId: string;
  name: string;
  type?: string;
  unitsCount?: number;
  address?: {
    line1?: string;
    line2?: string | null;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  notes?: string | null;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

type Unit = {
  id: string;
  unitNumber?: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  rent?: number;
  status?: 'vacant' | 'occupied' | 'notice' | string;
};

type Invite = {
  id: string;
  tenantEmail?: string;
  status?: 'sent' | 'accepted' | 'expired' | string;
  createdAt?: Timestamp;
};

export default function PropertyDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { user, loading } = useAuth();

  const propertyId = params?.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [unitsLoading, setUnitsLoading] = useState(true);
  const [invitesLoading, setInvitesLoading] = useState(true);

  const [property, setProperty] = useState<Property | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  // Load property
  useEffect(() => {
    const run = async () => {
      if (!user || !propertyId) return;
      setIsLoading(true);
      setError(null);
      try {
        const ref = doc(db, 'properties', propertyId);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          setError('Property not found.');
          setProperty(null);
          return;
        }
        const data = snap.data() as Property;
        // Gate: only owner can view (adjust when team roles exist)
        if (data.adminId && data.adminId !== user.uid) {
          router.push('/access-denied');
          return;
        }
        setProperty(data);
      } catch (e: any) {
        setError(e?.message || 'Failed to load property.');
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, [user, propertyId, router]);

  // Load units & invites (after we know the property id is valid)
  useEffect(() => {
    const load = async () => {
      if (!user || !propertyId) return;

      setUnitsLoading(true);
      setInvitesLoading(true);
      try {
        // Units (top-level 'units' with propertyId reference)
        const uq = query(collection(db, 'units'), where('propertyId', '==', propertyId));
        const usnap = await getDocs(uq);
        const u: Unit[] = [];
        usnap.forEach((d) => {
          const v = d.data() as any;
          u.push({
            id: d.id,
            unitNumber: v?.unitNumber,
            bedrooms: v?.bedrooms,
            bathrooms: v?.bathrooms,
            squareFeet: v?.squareFeet,
            rent: v?.rent,
            status: v?.status,
          });
        });
        setUnits(u);
      } catch {
        // soft-fail units
      } finally {
        setUnitsLoading(false);
      }

      try {
        // Invites (top-level 'tenantInvites' against this propertyId)
        const iq = query(collection(db, 'tenantInvites'), where('propertyId', '==', propertyId));
        const isnap = await getDocs(iq);
        const arr: Invite[] = [];
        isnap.forEach((d) => {
          const v = d.data() as any;
          arr.push({
            id: d.id,
            tenantEmail: v?.tenantEmail,
            status: v?.status,
            createdAt: v?.createdAt,
          });
        });
        setInvites(arr);
      } catch {
        // soft-fail invites
      } finally {
        setInvitesLoading(false);
      }
    };
    load();
  }, [user, propertyId]);

  const addressLine = useMemo(() => {
    if (!property?.address) return '';
    const a = property.address;
    const line1 = [a.line1, a.line2].filter(Boolean).join(', ');
    const line2 = [a.city, a.state, a.postalCode].filter(Boolean).join(', ');
    const country = a.country ? ` ${a.country}` : '';
    return [line1, line2].filter(Boolean).join(' • ') + country;
  }, [property]);

  // Loading skeleton
  if (isLoading) {
    return (
      <main className="p-4 md:p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="h-8 w-64 bg-gray-100 rounded animate-pulse" />
          <div className="mt-2 h-4 w-80 bg-gray-100 rounded animate-pulse" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded border p-4">
            <div className="h-5 w-32 bg-gray-100 rounded animate-pulse mb-3" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-2/3 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>

          <div className="rounded border p-4 lg:col-span-2">
            <div className="h-5 w-40 bg-gray-100 rounded animate-pulse mb-3" />
            {/* table header */}
            <div className="grid grid-cols-5 gap-2 text-sm font-medium border-b py-2">
              <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
            </div>
            {/* rows */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="grid grid-cols-5 gap-2 text-sm py-2">
                <div className="h-4 w-14 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-12 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-12 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="p-4 md:p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Property</h1>
        <p className="text-red-600">{error}</p>
        <div className="mt-4">
          <Link href="/admin-dashboard" className="rounded border px-3 py-2 hover:bg-gray-50">
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <RoleGate allowed={['admin']}>
     
    <main className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header + actions */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl md:text-3xl font-bold">{property?.name || 'Property'}</h1>
          <p className="mt-1 text-sm text-gray-600">
            {addressLine || 'No address provided'}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* Optional future: /admin/property/[id]/units/new */}
          <button
            type="button"
            disabled
            title="Coming soon"
            className="inline-flex cursor-not-allowed items-center rounded border px-3 py-1.5 text-sm font-medium text-gray-400"
          >
            + Add Unit
          </button>
          <Link
            href={`/admin/tenants/invite?property=${propertyId}`}
            className="inline-flex items-center rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Invite Tenant
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Summary card */}
        <section className="rounded border p-4">
          <h2 className="mb-2 font-semibold">Summary</h2>
          <dl className="text-sm space-y-1">
            <div className="flex justify-between gap-3">
              <dt className="text-gray-600">Type</dt>
              <dd>{property?.type || '—'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-gray-600">Units (planned)</dt>
              <dd>{property?.unitsCount ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-gray-600">Notes</dt>
              <dd className="text-right text-gray-800 max-w-[18ch] truncate" title={property?.notes || ''}>
                {property?.notes || '—'}
              </dd>
            </div>
          </dl>
        </section>

        {/* Units table */}
        <section className="rounded border p-4 lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">Units</h2>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-5 gap-2 border-b py-2 text-sm font-medium">
            <div>Unit</div>
            <div>Beds</div>
            <div>Baths</div>
            <div>Sq Ft</div>
            <div>Rent</div>
          </div>

          {/* Loading state for units */}
          {unitsLoading && (
            <div className="py-4 space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="grid grid-cols-5 gap-2 text-sm">
                  <div className="h-4 w-12 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-8 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-8 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-14 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!unitsLoading && units.length === 0 && (
            <div className="py-6 text-sm text-gray-600">
              No units yet. You can add them later.
            </div>
          )}

          {/* Rows */}
          {!unitsLoading && units.length > 0 && (
            <div className="divide-y">
              {units.map((u) => (
                <div key={u.id} className="grid grid-cols-5 gap-2 py-2 text-sm">
                  <div>{u.unitNumber || '—'}</div>
                  <div>{u.bedrooms ?? '—'}</div>
                  <div>{u.bathrooms ?? '—'}</div>
                  <div>{u.squareFeet ?? '—'}</div>
                  <div>{typeof u.rent === 'number' ? `$${u.rent.toFixed(2)}` : '—'}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Invites panel */}
        <section className="rounded border p-4 lg:col-span-3">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">Tenant Invites</h2>
            <Link
              href={`/admin/tenants/invite?property=${propertyId}`}
              className="text-sm underline hover:no-underline"
            >
              Send another invite
            </Link>
          </div>

          {/* Loading */}
          {invitesLoading && (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {!invitesLoading && invites.length === 0 && (
            <p className="text-sm text-gray-600 py-4">No invites yet.</p>
          )}

          {/* List */}
          {!invitesLoading && invites.length > 0 && (
            <ul className="divide-y">
              {invites.map((inv) => (
                <li key={inv.id} className="flex items-center justify-between py-2 text-sm">
                  <span>{inv.tenantEmail || '—'}</span>
                  <span className="rounded bg-gray-100 px-2 py-0.5">{inv.status || '—'}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
    </RoleGate>
  );
}
