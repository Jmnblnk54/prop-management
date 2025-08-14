"use client";

import { useParams } from "next/navigation";
import UnitTable from "@/admin-components/UnitTable";
import { PropertyDetails } from "@/admin-interfaces/Unit";

// 🔧 Dummy data until Firestore is connected
const dummyProperties: Record<string, PropertyDetails> = {
  "sunset-apts": {
    id: "sunset-apts",
    name: "Sunset Apartments",
    address: "123 Main St, Tampa, FL",
    units: [
      {
        unitId: "1A",
        leased: true,
        leaseExpiration: "2025-09-01",
        tenantEmail: "jane@example.com",
        insuranceStatus: "verified",
        leaseFileUrl: "#",
      },
      {
        unitId: "1B",
        leased: false,
        leaseExpiration: "",
        insuranceStatus: "unverified",
      },
    ],
  },
  "oakwood-villas": {
    id: "oakwood-villas",
    name: "Oakwood Villas",
    address: "456 Oak Ave, St. Pete, FL",
    units: [
      {
        unitId: "A",
        leased: true,
        leaseExpiration: "2025-12-15",
        tenantEmail: "bob@example.com",
        insuranceStatus: "pending",
        leaseFileUrl: "#",
      },
    ],
  },
};

export default function PropertyPage() {
  const { id } = useParams();
  const propertyId = id as string;

  const property = dummyProperties[propertyId];

  if (!property) return <div className="p-6">Property not found.</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1">{property.name}</h1>
      <p className="text-gray-600 mb-4">{property.address}</p>

      <UnitTable units={property.units} />
    </div>
  );
}
