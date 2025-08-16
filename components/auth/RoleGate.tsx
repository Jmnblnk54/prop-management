'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface RoleGateProps {
  allowed: Array<'admin' | 'user' | 'tenant'>;
  children: ReactNode;
}

export default function RoleGate({ allowed, children }: RoleGateProps) {
  const router = useRouter();
  const { user, appUser, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (appUser && !allowed.includes(appUser.role)) {
      router.push('/access-denied');
    }
  }, [loading, user, appUser, allowed, router]);

  if (loading) return null;
  if (!user) return null;
  if (appUser && !allowed.includes(appUser.role)) return null;

  return <>{children}</>;
}
