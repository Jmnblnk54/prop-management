'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

import Step1AddProperty from '@/components/onboarding/Step1AddProperty';
import Step2DashboardSummary from '@/components/onboarding/Step2DashboardSummary';
import Step3LegalDocs from '@/components/onboarding/Step3LegalDocs';
import Step4TenantInvites from '@/components/onboarding/Step4TenantInvites';
import Step5GetStarted from '@/components/onboarding/Step5GetStarted';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, appUser, loading } = useAuth();
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  // Optional role gate (enable when roles are wired)
  /*
  useEffect(() => {
    if (!loading && appUser && appUser.role !== 'admin') {
      router.push('/access-denied');
    }
  }, [appUser, loading, router]);
  */

  // Redirect unauthenticated users to login once loading finishes
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  // Fetch admin onboarding state
  useEffect(() => {
    if (!user) return;

    const fetchAdminData = async () => {
      try {
        const adminRef = doc(db, 'admins', user.uid);
        const adminSnap = await getDoc(adminRef);
        if (adminSnap.exists()) {
          const data = adminSnap.data() as any;
          if (data?.onboardingCompleted) setOnboardingCompleted(true);
          if (typeof data?.onboardingStep === 'number') {
            setOnboardingStep(data.onboardingStep);
          }
        }
      } catch (err) {
        console.error('Error fetching admin data:', err);
      }
    };

    fetchAdminData();
  }, [user]);

  const persistStep = async (stepValue: number) => {
    if (!user) return;
    try {
      const adminRef = doc(db, 'admins', user.uid);
      await updateDoc(adminRef, { onboardingStep: stepValue });
    } catch {
      // non-blocking
    }
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

  const handleSkipStep = () => {
    handleNextStep();
  };

  const handleFinishOnboarding = async () => {
    setOnboardingCompleted(true);
    if (user) {
      const adminRef = doc(db, 'admins', user.uid);
      await updateDoc(adminRef, { onboardingCompleted: true, onboardingStep: 5 });
    }
  };

  // Basic loading fallback
  if (loading) {
    return (
      <main className="p-6 max-w-6xl mx-auto">
        <div className="h-6 w-40 rounded bg-gray-100 mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="h-32 rounded bg-gray-100" />
          <div className="h-32 rounded bg-gray-100" />
          <div className="h-32 rounded bg-gray-100" />
        </div>
      </main>
    );
  }

  return (
    <main className="p-4 md:p-6 max-w-6xl mx-auto relative">
      {/* Page header with quick actions */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/admin/properties/new"
            className="inline-flex items-center rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Add Property
          </Link>
          <Link
            href="/admin/tenants/invite"
            className="inline-flex items-center rounded border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
          >
            Invite Tenant
          </Link>
        </div>
      </div>

      {/* Visible dashboard sections (empty states so onboarding can point to them) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded border p-4">
          <div className="mb-2 font-semibold">Properties</div>
          <p className="text-sm text-gray-600">
            No properties yet. Click <span className="font-medium">“Add Property”</span> to create one.
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
          <p className="text-sm text-gray-600">Recent activity will appear here once payments start.</p>
        </div>

        <div className="rounded border p-4">
          <div className="mb-2 font-semibold">Lease Expirations</div>
          <p className="text-sm text-gray-600">Upcoming expirations will show here.</p>
        </div>

        <div className="rounded border p-4">
          <div className="mb-2 font-semibold">Messages</div>
          <p className="text-sm text-gray-600">Centralized landlord–tenant messages will appear here.</p>
        </div>

        <div className="rounded border p-4">
          <div className="mb-2 font-semibold">Compliance</div>
          <p className="text-sm text-gray-600">Insurance/status items will be summarized here.</p>
        </div>
      </section>

      {/* Onboarding overlays (rendered above content) */}
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
        // Ensure Step4 does NOT dim the background inside its own component
        <Step4TenantInvites onNext={handleNextStep} onSkip={handleSkipStep} />
      )}
      {!onboardingCompleted && onboardingStep === 4 && (
        // Step 5 can dim; uses onFinish so it actually closes
        <Step5GetStarted onFinish={handleFinishOnboarding} />
      )}
    </main>
  );
}
