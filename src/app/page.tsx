'use client';

import dynamic from 'next/dynamic';
import { Provider } from 'react-redux';
import { makeStore } from '@/store/store';
import { loadTreeData } from '@/store/slices/treeSlice';

const TreeList = dynamic(() => import('@/components/TreeList/TreeList'), {
  ssr: false,
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

  if (typeof window !== 'undefined') {
    const savedData = localStorage.getItem('company-tree-data');
    if (!savedData) {
      store.dispatch(loadTreeData());
    }
  }

  return (
    <Provider store={store}>
      <main>
        <TreeList />
      </main>
    </Provider>
  );
}