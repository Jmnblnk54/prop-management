import React from "react";

interface LeaseStatusProps {
  isLeased: boolean;
  leaseExpiration: string | null;
}

const LeaseStatus: React.FC<LeaseStatusProps> = ({ isLeased, leaseExpiration }) => (
  <div className="mb-4">
    <p>
      Lease Status:{" "}
      <span className={isLeased ? "text-green-600" : "text-red-600"}>
        {isLeased ? "Active" : "Vacant"}
      </span>
    </p>
    {leaseExpiration && (
      <p>Lease Expires: {new Date(leaseExpiration).toLocaleDateString()}</p>
    )}
  </div>
);

export default LeaseStatus;
