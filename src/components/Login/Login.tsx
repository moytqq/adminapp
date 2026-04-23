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

const formatPhoneNumber = (value: string): string => {
  let numbers = value.replace(/\D/g, '');

  if (numbers.length === 0) return '';

  const countryCode = numbers[0];

  numbers = numbers.slice(0, 15);

  let formatted = `+${countryCode}`;

  const restNumbers = numbers.slice(1);

  if (restNumbers.length > 0) {
    formatted += ` (${restNumbers.slice(0, 3)}`;
  }

  if (restNumbers.length > 3) {
    formatted += `) ${restNumbers.slice(3, 6)}`;
  }

  if (restNumbers.length > 6) {
    formatted += ` ${restNumbers.slice(6, 8)}`;
  }

  if (restNumbers.length > 8) {
    formatted += ` ${restNumbers.slice(8, 10)}`;
  }

  return formatted.trim();
};

const isPhoneNumberInput = (value: string): boolean => {
  return /^[\d+]/.test(value) && /\d/.test(value);
};

const extractRawPhoneNumber = (formatted: string): string => {
  let numbers = formatted.replace(/\D/g, '');
    numbers = '+' + numbers;
  return numbers;
};

const Login = ({ initialErrorMessage }: LoginProps) => {
  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [inputError, setInputError] = useState('');
  const [sessionError, setSessionError] = useState<string | null>(initialErrorMessage || null);
  const [isPhoneInput, setIsPhoneInput] = useState(false);
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

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    const isPhone = isPhoneNumberInput(value);
    setIsPhoneInput(isPhone);

    if (isPhone) {
      const formatted = formatPhoneNumber(value);
      setLoginValue(formatted);
    } else {
      setLoginValue(value);
    }

    if (inputError) setInputError('');
    if (sessionError) setSessionError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setSessionError(null);
    setInputError('');
    localStorage.removeItem('login_error');

    let finalLoginValue = loginValue.trim();

    if (!finalLoginValue) {
      setInputError('Пожалуйста, введите логин или номер телефона');
      return;
    }

    if (!password.trim()) {
      setInputError('Пожалуйста, введите пароль');
      return;
    }

    if (isPhoneInput) {
      finalLoginValue = extractRawPhoneNumber(finalLoginValue);
    }

    try {
      const result = await dispatch(login({ login: finalLoginValue, password })).unwrap();

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
      handleLoginChange(e);
    } else if (name === 'password') {
      setPassword(value);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        Удачный
      </h1>
      <div className={styles.actionsContainer}>
        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.inputContainer}>
            <span className={styles.inputLabel}>Логин или номер телефона:</span>
            <input
              type="text"
              name="login"
              className={`${styles.input} ${inputError ? styles.inputError : ''}`}
              value={loginValue}
              onChange={handleInputChange}
              disabled={status === 'loading'}
              placeholder="Введите логин или номер телефона"
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
              {sessionError}
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