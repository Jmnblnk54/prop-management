'use client';

import React from 'react';

interface StepProps {
  onNext: () => void;
  onSkip?: () => void;
}

export default function Step3LegalDocs({ onNext, onSkip }: StepProps) {
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

        {/* pointer aimed toward footer legal links */}
        <div className="pointer-events-none absolute -bottom-4 left-1/2 -translate-x-1/2 h-0 w-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white" />

        <h2 className="mb-2 text-center text-xl font-bold">Legal & Policies</h2>
        <p className="mb-4 text-center text-sm text-gray-700">
          You’ll find Terms, Privacy, and compliance info in the footer whenever you need it.
        </p>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => { console.log('[Step3] Skip clicked'); onSkip?.(); }}
            className="text-sm text-gray-600 hover:underline"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={() => { console.log('[Step3] Next clicked'); onNext(); }}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
