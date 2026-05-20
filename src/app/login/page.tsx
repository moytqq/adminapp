'use client';

import React, { useEffect, useState } from 'react';
import Login from '@/components/Login/Login';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import styles from './login.module.scss';
import PageTitle from '@/components/PageTitle/PageTitle';

export default function LoginPage() {
  const router = useRouter();
  const { token: savedToken } = useSelector((state: RootState) => state.auth);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (savedToken) {
      router.push('/profile');
    }
  }, [savedToken, router]);

  useEffect(() => {
    const error = localStorage.getItem('login_error');

    if (error) {
      setErrorMessage(error);
      localStorage.removeItem('login_error');
    }
  }, []);

  return <><PageTitle title="Вход" /><Login initialErrorMessage={errorMessage} /></>;
}

export const dynamic = 'force-dynamic';