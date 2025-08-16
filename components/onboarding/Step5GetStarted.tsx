'use client';

import React from 'react';

interface Step5GetStartedProps {
  onFinish: () => void;
}

export default function Step5GetStarted({ onFinish }: Step5GetStartedProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-sm w-full animate-pop">
        <h2 className="text-xl font-bold mb-2 text-center">You’re All Set!</h2>
        <p className="text-gray-700 mb-4 text-sm text-center">
          You've completed the walkthrough. Click below to explore your new dashboard and start managing your properties.
        </p>

        <div className="flex justify-center">
          <button
            onClick={onFinish}
            className="bg-green-600 text-white text-sm px-4 py-2 rounded hover:bg-green-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
