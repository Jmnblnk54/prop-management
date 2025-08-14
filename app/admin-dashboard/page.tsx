import UnitOverview from "../../admin-components/unit-detail/UnitOverview";
import InsuranceStatus from "@/admin-components/unit-detail/InsuranceStatus";
import LeaseStatus from "@/admin-components/unit-detail/LeaseStatus";
import MaintenanceRequestList from "../../admin-components/unit-detail/MaintenanceRequestList";
import PaymentStatus from "../../admin-components/unit-detail/PaymentStatus";
import NotificationBanner from "../../admin-components/unit-detail/NotificationBanner";

export default function AdminDashboard() {
  return (
    <main className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Welcome to Your Dashboard</h1>

      <NotificationBanner />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <UnitOverview />
        <PaymentStatus />
        <LeaseStatus />
        <InsuranceStatus />
        <MaintenanceRequestList />
      </div>
    </main>
  );
}
