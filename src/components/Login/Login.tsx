'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import styles from './Login.module.scss';
import { checkToken } from '@/store/thunks/authThunk';

const Login = () => {
  const [token, setToken] = useState('');
  const [inputError, setInputError] = useState('');
  const router = useRouter();

  const dispatch = useDispatch<AppDispatch>();
  const { status, error, token: savedToken, tokenFromUrl } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (tokenFromUrl && !savedToken) {
      setToken(tokenFromUrl);
    }
  }, [tokenFromUrl, savedToken]);

  useEffect(() => {
    if (savedToken) {
      router.push('/profile');
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
        router.push('/profile');
      }
    } catch (error) {
      console.error('Ошибка авторизации:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToken(e.target.value);
    if (inputError) setInputError('');
  };

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
              disabled={status === 'loading'}
              placeholder="Введите токен"
            />
            {inputError && (
              <span className={styles.errorText}>{inputError}</span>
            )}
          </div>

          <button
            type="submit"
            className={styles.loginButton}
            disabled={status === 'loading'}
          >
            {status === 'loading' ? (
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
};

export default Login;