'use client';

import { Inter } from 'next/font/google';
import './globals.scss';
import { Provider } from 'react-redux';
import { makeStore } from '@/store/store';
import { useEffect } from 'react';
import { initializeAuth } from '@/store/slices/authSlice';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  const store = makeStore();

  useEffect(() => {
    store.dispatch(initializeAuth());
  }, [store]);

  return (
    <html lang="ru">
    <body className={inter.className}>
    <Provider store={store}>
      {children}
    </Provider>
    </body>
    </html>
  );
}

export const dynamic = 'force-dynamic';