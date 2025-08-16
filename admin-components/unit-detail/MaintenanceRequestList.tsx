interface MaintenanceRequest {
  id: string;
  description: string;
  status: string;
  submittedAt: string;
}

interface MaintenanceRequestListProps {
  requests: MaintenanceRequest[];
}

export default function MaintenanceRequestList({ requests }: MaintenanceRequestListProps) {
  return (
    <div className="border p-4 rounded shadow col-span-1 md:col-span-2">
      <h2 className="text-lg font-semibold mb-2">Maintenance Requests</h2>
      {requests.length === 0 ? (
        <p>No maintenance requests.</p>
      ) : (
        <ul className="space-y-2">
          {requests.map((req) => (
            <li key={req.id} className="border rounded p-2">
              <p>{req.description}</p>
              <p>Status: {req.status}</p>
              <p>Submitted: {req.submittedAt}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
