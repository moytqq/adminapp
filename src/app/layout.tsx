'use client';

import { Inter } from 'next/font/google';
import './globals.scss';
import { Provider } from 'react-redux';
import { makeStore } from '@/store/store';
import AuthInitializer from '@/components/AuthInitializer/AuthInitializer';
import PWAInstall from '@/components/PWAInstall/PWAInstall';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  const store = makeStore();

  return (
    <html lang="ru">
    <head>
      <link rel="manifest" href="/manifest.json" />
      <meta name="theme-color" content="#1a1a1a" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="Удачный" />
      <link rel="apple-touch-icon" href="/icon-180x180.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/icon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/icon-16x16.png" />
    </head>
    <body className={inter.className}>
    <Provider store={store}>
      <AuthInitializer />
      <PWAInstall />
      {children}
    </Provider>
    </body>
    </html>
  );
}

export const dynamic = 'force-dynamic';