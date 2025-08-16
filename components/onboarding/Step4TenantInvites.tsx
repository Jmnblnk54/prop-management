'use client';

import React from 'react';

interface Step4TenantInvitesProps {
  onNext: () => void;
  onSkip: () => void;
}

export default function Step4TenantInvites({ onNext, onSkip }: Step4TenantInvitesProps) {
  return (
    <div className="absolute top-0 left-0 z-50 flex items-center justify-center p-4 pointer-events-none">
      <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-sm w-full transform transition-all duration-300 scale-95 animate-pop">
        {/* Curved arrow placeholder – you’ll replace this with an actual SVG later */}
        <div className="absolute -top-6 right-4 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-white" />

        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
          <div className="bg-blue-500 text-white rounded-full px-4 py-1 text-sm font-semibold shadow-md">
            4 of 5
          </div>
        </div>

        <h2 className="text-xl font-bold mb-2 text-center">Invite Your Tenants</h2>
        <p className="text-gray-700 mb-4 text-sm text-center">
          You can send tenants a secure link so they can upload insurance, pay rent, and submit maintenance requests.
        </p>

        <div className="flex justify-between">
          <button
            onClick={onSkip}
            className="text-sm text-gray-500 hover:underline"
          >
            Skip
          </button>
          <button
            onClick={onNext}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
