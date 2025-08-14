
interface PropertySummaryCardProps {
  property: {
    id: string;
    name: string;
    address: string;
    totalUnits: number;
    leasedUnits: number;
  };
}

export default function PropertySummaryCard({ property }: PropertySummaryCardProps) {
  const { name, address, totalUnits, leasedUnits } = property;

  const occupancy = Math.round((leasedUnits / totalUnits) * 100);

  return (
    <div className="border rounded-lg p-4 shadow hover:shadow-md transition cursor-pointer bg-white">
      <h2 className="text-xl font-semibold">{name}</h2>
      <p className="text-sm text-gray-600">{address}</p>
      <div className="mt-2 text-sm text-gray-800">
        <p>Units Leased: {leasedUnits} / {totalUnits}</p>
        <p>Occupancy: {occupancy}%</p>
      </div>
    </div>
  );
}
