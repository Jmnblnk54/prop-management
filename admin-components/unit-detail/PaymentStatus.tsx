interface PaymentStatusProps {
  isPaid?: boolean;
  amountDue?: number;
  dueDate?: string;
}

export default function PaymentStatus({
  isPaid = false,
  amountDue = 0,
  dueDate = "N/A",
}: PaymentStatusProps) {
  return (
    <div className="border p-4 rounded shadow">
      <h2 className="text-lg font-semibold mb-2">Payment Status</h2>
      <p>Status: {isPaid ? "Paid" : "Unpaid"}</p>
      <p>Amount Due: ${amountDue.toFixed(2)}</p>
      <p>Due Date: {dueDate}</p>
    </div>
  );
}
