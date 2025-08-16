'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/admin-dashboard', label: 'Dashboard', icon: 'M4 6h16M4 12h16M4 18h16' },
  { href: '/admin/properties', label: 'Properties', icon: 'M4 7h16v10H4z M8 7V5h8v2' },
  { href: '/admin/tenants', label: 'Tenants', icon: 'M12 12a4 4 0 100-8 4 4 0 000 8 M4 20a8 8 0 0116 0' },
  { href: '/admin/maintenance', label: 'Maintenance', icon: 'M7 7l10 10M7 17L17 7' },
  { href: '/admin/payments', label: 'Payments', icon: 'M4 7h16v10H4z' },
  { href: '/admin/reports', label: 'Reports', icon: 'M7 7h10v10H7z M7 12h10' },
  { href: '/admin/settings', label: 'Settings', icon: 'M12 8a4 4 0 100 8 4 4 0 000-8' },
];

export default function Sidebar({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Sidebar"
      className={`h-[calc(100vh-56px)] sticky top-14 border-r bg-white transition-all ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <ul className="py-3">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`mx-2 my-0.5 flex items-center gap-3 rounded px-2 py-2 text-sm hover:bg-gray-100 ${
                  active ? 'bg-gray-100 font-medium' : ''
                }`}
                title={collapsed ? item.label : undefined}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
                  <path d={item.icon} stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
                <span className={collapsed ? 'sr-only' : ''}>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
