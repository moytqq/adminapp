'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import styles from '@/app/login.module.scss';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredFlags?: string[];
  redirectTo?: string;
}

export default function ProtectedRoute({
                                         children,
                                         requiredFlags = [],
                                         redirectTo = '/main'
                                       }: ProtectedRouteProps) {
  const router = useRouter();
  const { token, status, flags } = useSelector((state: RootState) => state.auth);
  const [isClient, setIsClient] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (status !== 'loading') {
      if (!token) {
        router.push('/login');
        return;
      }

      if (requiredFlags.length > 0) {
        if (flags.length === 0 && !accessChecked) {
          setTimeout(() => setAccessChecked(true), 500);
          return;
        }

        const hasAccess = flags.includes('ADMIN') || requiredFlags.some(f => flags.includes(f));
        if (!hasAccess) {
          localStorage.removeItem('login_error');
          router.push(redirectTo);
          return;
        }
      }

      setAccessChecked(true);
    }
  }, [token, status, flags, requiredFlags, router, redirectTo, accessChecked]);

  if (!isClient || status === 'loading' || !accessChecked) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>
          Удачный Ltd.
        </h1>
        <div className={styles.loadingMessage}>
          <h2>Загрузка...</h2>
          <div className={styles.spinner}></div>
        </div>
      </div>
    );
  }

  if (token) {
    return <>{children}</>;
  }

  return null;
}