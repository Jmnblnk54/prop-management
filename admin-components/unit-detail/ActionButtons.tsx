import React from "react";

interface ActionButtonsProps {
  onMessage: () => void;
  onViewLease: () => void;
  onViewInsurance: () => void;
  onRemoveTenant: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onMessage,
  onViewLease,
  onViewInsurance,
  onRemoveTenant,
}) => (
  <div className="space-x-2 mt-4">
    <button onClick={onMessage} className="btn-primary">Message Tenant</button>
    <button onClick={onViewLease} className="btn-secondary">View Lease</button>
    <button onClick={onViewInsurance} className="btn-secondary">View Insurance</button>
    <button onClick={onRemoveTenant} className="btn-danger">Remove Tenant</button>
  </div>
);

export default ActionButtons;
