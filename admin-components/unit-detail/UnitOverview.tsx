import React from "react";

interface UnitOverviewProps {
  unitNumber: string;
  squareFeet?: number;
  bedrooms?: number;
  bathrooms?: number;
}

const UnitOverview: React.FC<UnitOverviewProps> = ({
  unitNumber,
  squareFeet,
  bedrooms,
  bathrooms,
}) => {
  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-lg font-bold mb-2">Unit {unitNumber}</h2>
      <ul className="text-sm space-y-1">
        {squareFeet && <li>Size: {squareFeet} sq ft</li>}
        {bedrooms && <li>Bedrooms: {bedrooms}</li>}
        {bathrooms && <li>Bathrooms: {bathrooms}</li>}
      </ul>
    </div>
  );
};

export default UnitOverview;
