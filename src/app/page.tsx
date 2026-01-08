'use client';

import dynamic from 'next/dynamic';
import { Provider } from 'react-redux';
import { makeStore } from '@/store/store';

// Динамический импорт для отключения SSR
const TreeList = dynamic(() => import('@/components/TreeList/TreeList'), {
  ssr: true,
  loading: () => (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh'
    }}>
      Loading...
    </div>
  ),
});

export default function Home() {
  const store = makeStore();

  return (
    <Provider store={store}>
      <main>
        <TreeList />
      </main>
    </Provider>
  );
}