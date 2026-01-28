'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import styles from './login.module.scss';
import { checkToken, checkTokenFromUrl } from '@/store/thunks/authThunk';
import { setError } from '@/store/slices/authSlice';

export default function LoginPage() {
  const [token, setToken] = useState('');
  const [inputError, setInputError] = useState('');
  const [isCheckingUrlToken, setIsCheckingUrlToken] = useState(false);
  const router = useRouter();

  const dispatch = useDispatch<AppDispatch>();
  const { status, error, token: savedToken } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (typeof window !== 'undefined' && !savedToken && !isCheckingUrlToken) {
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromQuery = urlParams.get('token');

      const pathParts = window.location.pathname.split('/');
      const tokenFromPath = pathParts.length > 2 && pathParts[1] === 'login' ? pathParts[2] : null;

      const tokenFromUrl = tokenFromQuery || tokenFromPath;

      if (tokenFromUrl) {
        setIsCheckingUrlToken(true);
        setToken(tokenFromUrl);

        const authenticate = async () => {
          try {
            const result = await dispatch(checkTokenFromUrl(tokenFromUrl)).unwrap();

            if (result.success) {
              const newUrl = new URL(window.location.href);
              newUrl.searchParams.delete('token');
              window.history.replaceState({}, '', '/login');
              router.push('/main');
            } else {
              dispatch(setError("Неверный токен"));
            }
          } catch (error: any) {
            console.error('Ошибка авторизации из URL:', error);
            dispatch(setError(error.message || 'Ошибка при проверке токена'));
          } finally {
            setIsCheckingUrlToken(false);
          }
        };

        authenticate();
      }
    }
  }, [savedToken, isCheckingUrlToken, dispatch, router]);

  useEffect(() => {
    if (savedToken) {
      router.push('/main');
    }
  }, [savedToken, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token.trim()) {
      setInputError('Пожалуйста, введите код авторизации');
      return;
    }

    setInputError('');

    try {
      const result = await dispatch(checkToken(token)).unwrap();

      if (result.success) {
        router.push('/main');
      }
    } catch (error) {
      console.error('Ошибка авторизации:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToken(e.target.value);
    if (inputError) setInputError('');
  };

  const isLoading = status === 'loading' || isCheckingUrlToken;

  if (isCheckingUrlToken) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>
          Удачный Ltd.
        </h1>
        <div className={styles.loadingMessage}>
          <h2>Проверка токена из ссылки...</h2>
          <div className={styles.spinner}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        Удачный Ltd.
      </h1>
      <div className={styles.actionsContainer}>
        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.inputContainer}>
            <span className={styles.inputLabel}>Код авторизации:</span>
            <input
              type="text"
              className={`${styles.input} ${inputError ? styles.inputError : ''}`}
              value={token}
              onChange={handleInputChange}
              disabled={isLoading}
              placeholder="Введите токен или перейдите по ссылке с токеном"
            />
            {inputError && (
              <span className={styles.errorText}>{inputError}</span>
            )}
          </div>

          <button
            type="submit"
            className={styles.loginButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className={styles.loginButtonText}>Проверка...</span>
            ) : (
              <span className={styles.loginButtonText}>Войти</span>
            )}
          </button>

          {error && status === 'failed' && (
            <div className={styles.apiError}>
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';