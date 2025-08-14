import React from "react";

type InsuranceStatusType = "verified" | "unverified" | "pending";

interface InsuranceStatusProps {
  status: InsuranceStatusType;
  lastUpdated: string;
}

const InsuranceStatus: React.FC<InsuranceStatusProps> = ({ status, lastUpdated }) => {
  const getStatusColor = (status: InsuranceStatusType) => {
    switch (status) {
      case "verified":
        return "text-green-600";
      case "unverified":
        return "text-red-600";
      case "pending":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="bg-white shadow rounded p-4">
      <h2 className="text-lg font-semibold mb-2">Insurance Status</h2>
      <p>
        <strong>Status:</strong>{" "}
        <span className={getStatusColor(status)}>{status}</span>
      </p>
      <p>
        <strong>Last Updated:</strong> {lastUpdated}
      </p>
    </div>
  );
};

export default InsuranceStatus;
