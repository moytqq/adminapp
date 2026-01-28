'use client';

import React, { Suspense } from 'react';
import LoginContent from './LoginContent';
import styles from './login.module.scss'

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <div className={styles.spinner}></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}