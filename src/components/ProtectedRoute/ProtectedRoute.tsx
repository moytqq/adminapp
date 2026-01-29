'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import styles from '@/app/login.module.scss';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const { token, status } = useSelector((state: RootState) => state.auth);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (status !== 'loading' && !token) {
      router.push('/login');
    }
  }, [token, status, router]);

  if (!isClient || status === 'loading') {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>
          Удачный Ltd.
        </h1>
        <div className={styles.loadingMessage}>
          <h2>Проверка токена...</h2>
          <div className={styles.spinner}></div>
        </div>
      </div>
    );
  }

  if (token) {
    return <>{children}</>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        Удачный Ltd.
      </h1>
      <div className={styles.loadingMessage}>
        <h2>Проверка токена...</h2>
        <div className={styles.spinner}></div>
      </div>
    </div>
  );

  return null;
}