'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import styles from './Login.module.scss';
import { login } from '@/store/thunks/authThunk';

interface LoginProps {
  initialErrorMessage?: string | null;
}

const Login = ({ initialErrorMessage }: LoginProps) => {
  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [inputError, setInputError] = useState('');
  const [sessionError, setSessionError] = useState<string | null>(initialErrorMessage || null);
  const router = useRouter();

  const dispatch = useDispatch<AppDispatch>();
  const { status, error, token: savedToken } = useSelector((state: RootState) => state.auth);


  useEffect(() => {
    if (savedToken) {
      router.push('/profile');
    }
  }, [savedToken, router]);

  useEffect(() => {
    const storedError = localStorage.getItem('login_error');

    if (storedError && !sessionError) {
      setSessionError(storedError);
      localStorage.removeItem('login_error');
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setSessionError(null);
    setInputError('');
    localStorage.removeItem('login_error');

    if (!loginValue.trim()) {
      setInputError('Пожалуйста, введите логин');
      return;
    }

    if (!password.trim()) {
      setInputError('Пожалуйста, введите пароль');
      return;
    }

    try {
      const result = await dispatch(login({ login: loginValue, password })).unwrap();

      if (result.success) {
        router.push('/profile');
      }
    } catch (error) {
      console.error('Ошибка авторизации:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'login') {
      setLoginValue(value);
    } else if (name === 'password') {
      setPassword(value);
    }
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
            <span className={styles.inputLabel}>Логин:</span>
            <input
              type="text"
              name="login"
              className={`${styles.input} ${inputError ? styles.inputError : ''}`}
              value={loginValue}
              onChange={handleInputChange}
              disabled={status === 'loading'}
              placeholder="Введите логин"
            />
          </div>

          <div className={styles.inputContainer}>
            <span className={styles.inputLabel}>Пароль:</span>
            <input
              type="password"
              name="password"
              className={`${styles.input} ${inputError ? styles.inputError : ''}`}
              value={password}
              onChange={handleInputChange}
              disabled={status === 'loading'}
              placeholder="Введите пароль"
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
              <span className={styles.loginButtonText}>Вход...</span>
            ) : (
              <span className={styles.loginButtonText}>Войти</span>
            )}
          </button>

          {sessionError && (
            <div className={styles.sessionError}>
              Время сессии истекло <br/> Пожалуйста, войдите заново
            </div>
          )}

          {error && status === 'failed' && !sessionError && (
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