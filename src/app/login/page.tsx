'use client';

import React, { useEffect } from 'react';
import Login from '@/components/Login/Login';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import styles from './login.module.scss';
import { checkTokenFromUrl } from '@/store/thunks/authThunk';
import { setError } from '@/store/slices/authSlice';

function LoginPage() {
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
          }
          if (!result.success){
            dispatch(setError("Неверный токен"))
          }
        } catch (error:any) {
          console.error('Ошибка авторизации:', error);
          dispatch(setError(error.message || 'Ошибка при проверке токена'));
        }
      };

      authenticate();
    } else if (savedToken) {
      router.push('/main');
    }
  }, [tokenFromUrl, savedToken, status, dispatch, router]);

  if (tokenFromUrl && status === 'loading') {
    return (
      <div className={styles.container}>
        <h2>Проверка токена...</h2>
        <div className={styles.spinner}></div>
      </div>
    );
  }
  return (
    <Login />
  );
}

export default LoginPage;