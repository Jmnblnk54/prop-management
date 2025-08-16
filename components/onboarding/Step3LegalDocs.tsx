'use client';

import React from 'react';

interface Step3NotificationsProps {
  onNext: () => void;
  onSkip: () => void;
}

export default function Step3Notifications({ onNext, onSkip }: Step3NotificationsProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:justify-end p-4 pointer-events-none">
      <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-xs w-full animate-pop pointer-events-auto">
        {/* Curved arrow (placeholder) */}
        <div className="absolute -right-12 top-1/2 transform -translate-y-1/2 w-20 h-20">
          <svg viewBox="0 0 100 100" className="w-full h-full text-blue-500">
            <path d="M0,0 Q50,50 100,100" stroke="currentColor" strokeWidth="4" fill="none" />
          </svg>
        </div>

        <h2 className="text-xl font-bold mb-2 text-center">Stay Updated</h2>
        <p className="text-gray-700 mb-4 text-sm text-center">
          This area will show notifications about lease renewals, insurance reminders, and tenant activity. We’ll make sure you never miss an important update.
        </p>

        <div className="flex justify-between">
          <button onClick={onSkip} className="text-sm text-gray-500 hover:underline">
            Skip
          </button>
          <button onClick={onNext} className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
