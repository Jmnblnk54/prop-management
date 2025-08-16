'use client';

import React from 'react';

interface StepProps {
  onNext: () => void;
  onSkip?: () => void;
}

export default function Step4TenantInvites({ onNext, onSkip }: StepProps) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-sm rounded-lg bg-white p-6 shadow-xl animate-[balloon_280ms_ease-out]">
        <style jsx>{`
          @keyframes balloon {
            0%   { transform: translateY(8px) scale(0.96); opacity: 0; }
            60%  { transform: translateY(-2px) scale(1.02); opacity: 1; }
            100% { transform: translateY(0) scale(1); }
          }
        `}</style>

        {/* pointer aimed toward “Invite Tenant” button in header actions */}
        <div className="pointer-events-none absolute -top-4 right-6 h-0 w-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-white" />

        <h2 className="mb-2 text-center text-xl font-bold">Invite Tenants</h2>
        <p className="mb-4 text-center text-sm text-gray-700">
          When you’re ready, use
          <span className="mx-1 rounded bg-gray-100 px-1 py-0.5">Invite Tenant</span>
          to send a sign-up link for rent payments and messaging.
        </p>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => { console.log('[Step4] Skip clicked'); onSkip?.(); }}
            className="text-sm text-gray-600 hover:underline"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={() => { console.log('[Step4] Next clicked'); onNext(); }}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
