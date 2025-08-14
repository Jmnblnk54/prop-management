import React from "react";

interface LeaseStatusProps {
  leaseStart: string;  // ← changed from Date to string
  leaseEnd: string;
  isActive: boolean;
}

const LeaseStatus: React.FC<LeaseStatusProps> = ({ leaseStart, leaseEnd, isActive }) => {
  return (
    <div className="bg-white shadow rounded p-4">
      <h2 className="text-lg font-semibold mb-2">Lease Status</h2>
      <p>
        <strong>Start:</strong> {leaseStart}
      </p>
      <p>
        <strong>End:</strong> {leaseEnd}
      </p>
      <p>
        <strong>Status:</strong>{" "}
        <span className={isActive ? "text-green-600" : "text-red-600"}>
          {isActive ? "Active" : "Expired"}
        </span>
      </p>
    </div>
  );
};

export default LeaseStatus;
