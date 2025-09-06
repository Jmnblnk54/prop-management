import React from "react";
import { formatDate } from "../../lib/constants";
interface LeaseStatusProps {
  leaseStart: string;
  leaseLengthMonths: number;
}

const LeaseStatus: React.FC<LeaseStatusProps> = ({ leaseStart, leaseLengthMonths }) => {
  const start = new Date(leaseStart);
  const end = new Date(start);
  end.setMonth(end.getMonth() + leaseLengthMonths);

  const now = new Date();
  const isActive = now <= end;



  return (
    <div className="bg-white shadow rounded p-4">
      <h2 className="text-lg font-semibold mb-2">Lease Status</h2>
      <p>
        <strong>Start:</strong> {formatDate(start)}
      </p>
      <p>
        <strong>End:</strong> {formatDate(end)}
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
