import React from "react";

interface NotificationBannerProps {
  message: string;
  type?: "success" | "info" | "warning" | "error";
}

const typeColors = {
  success: "bg-green-100 text-green-800",
  info: "bg-blue-100 text-blue-800",
  warning: "bg-yellow-100 text-yellow-800",
  error: "bg-red-100 text-red-800",
};

const NotificationBanner: React.FC<NotificationBannerProps> = ({
  message,
  type = "info",
}) => {
  return (
    <div className={`p-3 rounded shadow ${typeColors[type]}`}>
      <p className="text-sm">{message}</p>
    </div>
  );
};

export default NotificationBanner;
