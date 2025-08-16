'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function AccountMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // click outside
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded px-2 py-1.5 hover:bg-gray-100"
      >
        <span className="inline-block h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600" />
        <span className="hidden sm:inline text-sm font-medium">Account</span>
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-52 overflow-hidden rounded border bg-white shadow-lg z-50"
        >
          <Link href="/account" role="menuitem" className="block px-3 py-2 text-sm hover:bg-gray-50">
            Manage account
          </Link>
          <Link href="/admin/settings/team" role="menuitem" className="block px-3 py-2 text-sm hover:bg-gray-50">
            Invite admin
          </Link>
          <div className="border-t my-1" />
          <button
            role="menuitem"
            className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
            onClick={async () => {
              try {
                await signOut(auth);
              } catch {
                // no-op
              }
              window.location.href = '/login';
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
