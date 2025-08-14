import { Unit } from "../admin-interfaces/Unit";

interface UnitTableProps {
  units: Unit[];
}

export default function UnitTable({ units }: UnitTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Unit</th>
            <th className="p-2 border">Leased?</th>
            <th className="p-2 border">Lease Expiration</th>
            <th className="p-2 border">Tenant</th>
            <th className="p-2 border">Insurance</th>
            <th className="p-2 border">Lease File</th>
            <th className="p-2 border">Maintenance</th>
          </tr>
        </thead>
        <tbody>
          {units.map((unit) => (
            <tr key={unit.unitId} className="border-t">
              <td className="p-2 border">{unit.unitId}</td>
              <td className="p-2 border">{unit.leased ? "Yes" : "No"}</td>
              <td className="p-2 border">{unit.leaseExpiration}</td>
              <td className="p-2 border">{unit.tenantEmail || "—"}</td>
              <td className="p-2 border">
                {unit.insuranceStatus === "verified" && "✅"}
                {unit.insuranceStatus === "unverified" && "❌"}
                {unit.insuranceStatus === "pending" && "⏳"}
              </td>
              <td className="p-2 border">
                {unit.leaseFileUrl ? (
                  <a href={unit.leaseFileUrl} className="text-blue-600 underline" target="_blank">
                    View
                  </a>
                ) : (
                  "—"
                )}
              </td>
              <td className="p-2 border">
                <button className="text-blue-600 underline">View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
