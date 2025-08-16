'use client';

import React from 'react';

interface Step1AddPropertyProps {
  onNext: () => void;
  onSkip: () => void;
}

export default function Step1AddProperty({ onNext, onSkip }: Step1AddPropertyProps) {
  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="absolute top-[100px] left-[40px] flex flex-col items-start pointer-events-auto animate-pop">
        {/* Modal */}
        <div className="bg-white p-5 rounded-lg shadow-lg w-[280px] max-w-xs">
          <h2 className="text-lg font-bold mb-2">Add Your First Property</h2>
          <p className="text-sm text-gray-700 mb-4">
            <strong>Congratulations on taking the first step toward better property management!</strong> Click “Add Property” to get started.
          </p>
          <div className="flex justify-between items-center text-sm">
            <button onClick={onSkip} className="text-gray-500 hover:underline">
              Skip
            </button>
            <button onClick={onNext} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
              Next
            </button>
          </div>
        </div>

        {/* Arrow */}
        <img
          src="/assets/arrows/arrow-step1.svg"
          alt="Arrow pointing to Add Property"
          className="w-24 mt-2"
        />
      </div>
    </div>
  );
}
