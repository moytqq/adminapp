'use client';

import React, { useEffect } from 'react';
import Login from '@/components/Login/Login';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import styles from './login.module.scss';
import { checkTokenFromUrl } from '@/store/thunks/authThunk';
import { setError } from '@/store/slices/authSlice';

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const { token: savedToken, status } = useSelector((state: RootState) => state.auth);

  const tokenFromUrl = searchParams.get('token');

  useEffect(() => {
    if (tokenFromUrl && !savedToken && status !== 'loading') {
      const authenticate = async () => {
        try {
          const result = await dispatch(checkTokenFromUrl(tokenFromUrl)).unwrap();

          if (result.success) {
            router.push('/main');
          } else {
            dispatch(setError("Неверный токен"));
          }
        } catch (error: any) {
          console.error('Ошибка авторизации:', error);
          dispatch(setError(error.message || 'Ошибка при проверке токена'));
        }
      };

      authenticate();
    }
  }, [tokenFromUrl, savedToken, status, dispatch, router]);

  if (tokenFromUrl && status === 'loading') {
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

export default LoginContent;