'use client';

import React, { useEffect, useState } from 'react';
import Login from '@/components/Login/Login';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import styles from './login.module.scss';
import { checkTokenFromUrl } from '@/store/thunks/authThunk';
import { setError } from '@/store/slices/authSlice';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [isCheckingToken, setIsCheckingToken] = useState(false);
  const [urlToken, setUrlToken] = useState<string | null>(null);

  const { token: savedToken, status } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get('token');

      if (tokenFromUrl) {
        setUrlToken(tokenFromUrl);
        setIsCheckingToken(true);
      }
    }
  }, []);

  useEffect(() => {
    if (savedToken) {
      router.push('/main');
      return;
    }

    if (urlToken && !savedToken && status !== 'loading' && isCheckingToken) {
      const authenticate = async () => {
        try {
          const result = await dispatch(checkTokenFromUrl(urlToken)).unwrap();

          if (result.success) {
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('token');
            window.history.replaceState({}, '', newUrl.pathname);

            router.push('/main');
          } else {
            dispatch(setError("Неверный токен"));
          }
        } catch (error: any) {
          console.error('Ошибка авторизации:', error);
          dispatch(setError(error.message || 'Ошибка при проверке токена'));
        } finally {
          setIsCheckingToken(false);
        }
      };

      authenticate();
    }
  }, [urlToken, savedToken, status, isCheckingToken, dispatch, router]);

  if (urlToken && (status === 'loading' || isCheckingToken)) {
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

  return <Login />;
}

export const dynamic = 'force-dynamic';