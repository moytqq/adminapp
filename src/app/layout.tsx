'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { Provider } from 'react-redux';
import { makeStore } from '@/store/store';
import AuthInitializer from '@/components/AuthInitializer/AuthInitializer';
import TokenHandler from '@/components/TokenHandler/TokenHandler';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  const store = makeStore();

  return (
    <html lang="ru">
    <body className={inter.className}>
    <Provider store={store}>
      <AuthInitializer />
      <TokenHandler/>
      {children}
    </Provider>
    </body>
    </html>
  );
}