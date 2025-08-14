"use client";

import UnitHeader from "@/admin-components/unit-detail/UnitHeader";
import LeaseStatus from "../../admin-components/unit-detail/LeaseStatus";
import InsuranceStatus from "@/admin-components/unit-detail/InsuranceStatus";
import ActionButtons from "@/admin-components/unit-detail/ActionButtons";

const UnitDetailPage = () => {
  const mockUnit = {
    unitName: "Unit 2B",
    isLeased: true,
    leaseExpiration: "2025-12-31",
    insuranceVerified: false,
  };

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded shadow">
      <UnitHeader unitName={mockUnit.unitName} />
      <LeaseStatus
        isLeased={mockUnit.isLeased}
        leaseExpiration={mockUnit.leaseExpiration}
      />
      <InsuranceStatus verified={mockUnit.insuranceVerified} />
      <ActionButtons
        onMessage={() => alert("Messaging tenant...")}
        onViewLease={() => alert("Viewing lease...")}
        onViewInsurance={() => alert("Viewing insurance...")}
        onRemoveTenant={() => alert("Removing tenant...")}
      />
    </div>
  );
};

export default UnitDetailPage;
