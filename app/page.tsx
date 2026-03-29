'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user) router.replace('/dashboard');
    else router.replace('/login');
  }, [user, loading, router]);

  return (
    <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>
      <p style={{ color: 'var(--muted)' }}>Loading…</p>
    </div>
  );
}
