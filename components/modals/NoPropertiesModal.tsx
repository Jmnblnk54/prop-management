'use client';

import React from 'react';

interface NoPropertiesModalProps {
  onClose: () => void;
  onAddProperty: () => void;
}

export default function NoPropertiesModal({ onClose, onAddProperty }: NoPropertiesModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-2 text-xl font-bold">No properties yet</h2>
        <p className="mb-4 text-sm text-gray-700">
          You have not added any properties yet. Please add properties before inviting tenants.
        </p>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onAddProperty}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Add Property
          </button>
        </div>
      </div>
    </div>
  );
}
