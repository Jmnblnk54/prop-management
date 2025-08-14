import React from "react";

interface InsuranceStatusProps {
  verified: boolean;
}

const InsuranceStatus: React.FC<InsuranceStatusProps> = ({ verified }) => (
  <p className="mb-4">
    Insurance Status:{" "}
    <span className={verified ? "text-green-600" : "text-red-600"}>
      {verified ? "Verified" : "Not Verified"}
    </span>
  </p>
);

export default InsuranceStatus;
