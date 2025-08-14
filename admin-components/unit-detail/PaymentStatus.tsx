import React from "react";

interface PaymentStatusProps {
  isPaid: boolean;
  dueDate: string;
  amountDue: number;
}

const PaymentStatus: React.FC<PaymentStatusProps> = ({
  isPaid,
  dueDate,
  amountDue,
}) => {
  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-lg font-bold mb-2">Payment Status</h2>
      {isPaid ? (
        <p className="text-green-600 font-medium">Paid in full</p>
      ) : (
        <div className="text-red-600 font-medium">
          <p>Amount Due: ${amountDue.toFixed(2)}</p>
          <p>Due Date: {dueDate}</p>
        </div>
      )}
    </div>
  );
};

export default PaymentStatus;
