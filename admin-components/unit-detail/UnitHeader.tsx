import React from "react";

interface UnitHeaderProps {
  unitName: string;
}

const UnitHeader: React.FC<UnitHeaderProps> = ({ unitName }) => (
  <h2 className="text-xl font-semibold mb-4">{unitName}</h2>
);

export default UnitHeader;
