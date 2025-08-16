'use client';

import React from 'react';

interface Step2DashboardSummaryProps {
  onNext: () => void;
  onSkip: () => void;
}

export default function Step2DashboardSummary({ onNext, onSkip }: Step2DashboardSummaryProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end p-4 pointer-events-none">
      {/* Balloon-like modal near the dashboard summary */}
      <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-xs w-full animate-pop pointer-events-auto">
        {/* Curved arrow pointing to summary box (placeholder) */}
        <div className="absolute -left-10 top-1/2 transform -translate-y-1/2 w-20 h-20">
          {/* Replace with SVG or real curved arrow as needed */}
          <svg viewBox="0 0 100 100" className="w-full h-full text-blue-500">
            <path d="M100,0 Q50,50 0,100" stroke="currentColor" strokeWidth="4" fill="none" />
          </svg>
        </div>

        <h2 className="text-xl font-bold mb-2 text-center">Dashboard Overview</h2>
        <p className="text-gray-700 mb-4 text-sm text-center">
          Here’s where you’ll see an overview of your properties, lease status, payments, maintenance, and more.
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
