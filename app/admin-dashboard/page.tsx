'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

import UnitOverview from '@/admin-components/unit-detail/UnitOverview';
import InsuranceStatus from '@/admin-components/unit-detail/InsuranceStatus';
import LeaseStatus from '@/admin-components/unit-detail/LeaseStatus';
import MaintenanceRequestList from '@/admin-components/unit-detail/MaintenanceRequestList';
import PaymentStatus from '@/admin-components/unit-detail/PaymentStatus';
import NotificationBanner from '@/admin-components/unit-detail/NotificationBanner';

export default function UnitDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, appUser, loading } = useAuth();
  const [unit, setUnit] = useState<any>(null);

  // 🚫 Role check (enable once Firebase is wired)
  /*
  useEffect(() => {
    if (!loading && appUser?.role !== 'admin') {
      router.push('/access-denied');
    }
  }, [appUser, loading]);
  */

  useEffect(() => {
    if (!id) return;

    const fetchUnit = async () => {
      try {
        const unitRef = doc(db, 'units', id as string);
        const unitSnap = await getDoc(unitRef);

        if (unitSnap.exists()) {
          setUnit(unitSnap.data());
        } else {
          console.warn('No such unit exists.');
        }
      } catch (err) {
        console.error('Error fetching unit:', err);
      }
    };

    fetchUnit();
  }, [id]);

  return (
    <main className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Unit Detail</h1>

      <NotificationBanner message="Your monthly report is ready." type="info" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <UnitOverview
          unitNumber={unit?.unitNumber}
          squareFeet={unit?.squareFeet}
          bedrooms={unit?.bedrooms}
          bathrooms={unit?.bathrooms}
        />

        <PaymentStatus
          isPaid={unit?.isPaid}
          amountDue={unit?.amountDue}
          dueDate={unit?.dueDate}
        />

        <LeaseStatus
          leaseStart={unit?.leaseStart}
          leaseLengthMonths={unit?.leaseLengthMonths}
        />

        <InsuranceStatus
          status={unit?.insuranceStatus}
          lastUpdated={unit?.insuranceLastUpdated}
        />

        <MaintenanceRequestList requests={unit?.maintenanceRequests || []} />
      </div>
    </main>
  );
}
