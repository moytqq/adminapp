'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { Provider } from 'react-redux';
import { makeStore } from '@/store/store';

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
      {children}
    </Provider>
    </body>
    </html>
  );
}