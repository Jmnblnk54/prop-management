'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

import RoleGate from '@/components/auth/RoleGate';
import NoPropertiesModal from '@/components/modals/NoPropertiesModal';

import Step1AddProperty from '@/components/onboarding/Step1AddProperty';
import Step2DashboardSummary from '@/components/onboarding/Step2DashboardSummary';
import Step3LegalDocs from '@/components/onboarding/Step3LegalDocs';
import Step4TenantInvites from '@/components/onboarding/Step4TenantInvites';
import Step5GetStarted from '@/components/onboarding/Step5GetStarted';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [propCountLoading, setPropCountLoading] = useState(true);
  const [propertyCount, setPropertyCount] = useState(0);
  const [showNoPropsModal, setShowNoPropsModal] = useState(false);

  const [onboardingStep, setOnboardingStep] = useState(0);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  // Load property count for this admin
  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setPropCountLoading(true);
      try {
        const q = query(collection(db, 'properties'), where('adminId', '==', user.uid));
        const snap = await getDocs(q);
        setPropertyCount(snap.size);
      } finally {
        setPropCountLoading(false);
      }
    };
    load();
  }, [user]);

  // Fetch onboarding flags
  useEffect(() => {
    const run = async () => {
      if (!user) return;
      try {
        const ref = doc(db, 'admins', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const d = snap.data() as any;
          if (d?.onboardingCompleted) setOnboardingCompleted(true);
          if (typeof d?.onboardingStep === 'number') setOnboardingStep(d.onboardingStep);
        }
      } catch (e) {
        // non-blocking
      }
    };
    run();
  }, [user]);

  const persistStep = async (val: number) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'admins', user.uid), { onboardingStep: val });
    } catch {}
  };

  const handleNextStep = async () => {
    const next = onboardingStep + 1;
    if (next > 4) {
      await handleFinishOnboarding();
    } else {
      setOnboardingStep(next);
      await persistStep(next);
    }
  };

  const handleSkipStep = () => handleNextStep();

  const handleFinishOnboarding = async () => {
    setOnboardingCompleted(true);
    if (user) {
      await updateDoc(doc(db, 'admins', user.uid), {
        onboardingCompleted: true,
        onboardingStep: 5,
      });
    }
  };

  const handleInviteClick = () => {
    if (propCountLoading) return;
    if (propertyCount === 0) {
      setShowNoPropsModal(true);
    } else {
      router.push('/admin/tenants/invite');
    }
  };

  return (
    <RoleGate allowed={['admin']}>
      <main className="p-4 md:p-6 max-w-6xl mx-auto relative">
        {/* Header + actions */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/admin/properties/new"
              className="inline-flex items-center rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              + Add Property
            </Link>
            <button
              type="button"
              onClick={handleInviteClick}
              className="inline-flex items-center rounded border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              disabled={propCountLoading}
            >
              Invite Tenant
            </button>
          </div>
        </div>

        {/* Visible dashboard sections (empty states) */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded border p-4">
            <div className="mb-2 font-semibold">Properties</div>
            <p className="text-sm text-gray-600">
              {propCountLoading
                ? 'Loading…'
                : propertyCount === 0
                ? 'No properties yet. Click “Add Property” to create one.'
                : `${propertyCount} propert${propertyCount === 1 ? 'y' : 'ies'} managed.`}
            </p>
          </div>

          <div className="rounded border p-4">
            <div className="mb-2 font-semibold">Tenants</div>
            <p className="text-sm text-gray-600">
              Invite tenants to start collecting rent via online payments.
            </p>
          </div>

          <div className="rounded border p-4">
            <div className="mb-2 font-semibold">Maintenance</div>
            <p className="text-sm text-gray-600">Track requests and work orders here.</p>
          </div>

          <div className="rounded border p-4 lg:col-span-2">
            <div className="mb-2 font-semibold">Payments</div>
            <p className="text-sm text-gray-600">Recent activity will appear once payments start.</p>
          </div>

          <div className="rounded border p-4">
            <div className="mb-2 font-semibold">Lease Expirations</div>
            <p className="text-sm text-gray-600">Upcoming expirations will show here.</p>
          </div>

          <div className="rounded border p-4">
            <div className="mb-2 font-semibold">Messages</div>
            <p className="text-sm text-gray-600">Landlord–tenant messages will appear here.</p>
          </div>

          <div className="rounded border p-4">
            <div className="mb-2 font-semibold">Compliance</div>
            <p className="text-sm text-gray-600">Insurance/status items will be summarized here.</p>
          </div>
        </section>

        {/* Onboarding overlays */}
        {!onboardingCompleted && onboardingStep === 0 && (
          <Step1AddProperty onNext={handleNextStep} onSkip={handleSkipStep} />
        )}
        {!onboardingCompleted && onboardingStep === 1 && (
          <Step2DashboardSummary onNext={handleNextStep} onSkip={handleSkipStep} />
        )}
        {!onboardingCompleted && onboardingStep === 2 && (
          <Step3LegalDocs onNext={handleNextStep} onSkip={handleSkipStep} />
        )}
        {!onboardingCompleted && onboardingStep === 3 && (
          <Step4TenantInvites onNext={handleNextStep} onSkip={handleSkipStep} />
        )}
        {!onboardingCompleted && onboardingStep === 4 && (
          <Step5GetStarted onFinish={handleFinishOnboarding} />
        )}

        {/* No properties modal */}
        {showNoPropsModal && (
          <NoPropertiesModal
            onClose={() => setShowNoPropsModal(false)}
            onAddProperty={() => router.push('/admin/properties/new')}
          />
        )}
      </main>
    </RoleGate>
  );
}
