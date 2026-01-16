'use client';

import dynamic from 'next/dynamic';
import { loadTreeData } from '@/store/slices/treeSlice';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { useAppDispatch } from '@/store/hooks';
import { useEffect } from 'react';
import styles from './page.module.scss';

const TreeList = dynamic(() => import('@/components/TreeList/TreeList'), {
  ssr: false,
  loading: () => (
    <div className={styles.loadingContainer}>
      Loading...
    </div>
  ),
});

// Создаем отдельный компонент для загрузки данных
function TreeDataLoader() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem('company-tree-data');
      if (!savedData) {
        dispatch(loadTreeData());
      }
    }
  }, [dispatch]);

  return null;
}

export default function Home() {
  return (
    <>
      <TreeDataLoader />
      <header className={styles.header}>
        <h1 className={styles.title}>Иерархия компании</h1>
        <Link
          href="/favorites"
          className={styles.favoritesLink}
          aria-label="Избранные виджеты"
          title="Избранные виджеты"
        >
          <Star size={24} />
          <span className={styles.favoritesText}>Избранные виджеты</span>
        </Link>
      </header>
      <main>
        <TreeList />
      </main>
    </>
  );
}