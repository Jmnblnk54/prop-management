'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect } from 'react';

const NAV = [
  { href: '/admin-dashboard', label: 'Dashboard' },
  { href: '/admin/properties', label: 'Properties' },
  { href: '/admin/tenants', label: 'Tenants' },
  { href: '/admin/maintenance', label: 'Maintenance' },
  { href: '/admin/payments', label: 'Payments' },
  { href: '/admin/reports', label: 'Reports' },
  { href: '/admin/settings', label: 'Settings' },
];

export default function MobileNav({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <div
      id="mobile-drawer"
      role="dialog"
      aria-modal="true"
      aria-label="Navigation"
      className={`fixed inset-0 z-50 md:hidden ${open ? '' : 'pointer-events-none'}`}
    >
      {/* overlay */}
      <button
        aria-label="Close menu"
        className={`absolute inset-0 bg-black/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      {/* panel */}
      <aside
        className={`absolute left-0 top-0 h-full w-72 bg-white shadow transition-transform ${open ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex items-center justify-between border-b px-4 h-14">
          <span className="font-semibold">Menu</span>
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded hover:bg-gray-100"
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
        </div>
        <nav className="p-2">
          <ul>
            {NAV.map((item) => {
              const active = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block rounded px-3 py-2 text-sm hover:bg-gray-100 ${active ? 'bg-gray-100 font-medium' : ''
                      }`}
                    onClick={onClose}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </div>
  );
}
