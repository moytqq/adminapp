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

function TreeDataLoader() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem('company-tree-data');
      if (!savedData) {
        console.log('No saved tree data found, loading...');
        dispatch(loadTreeData());
      } else {
        try {
          const parsedData = JSON.parse(savedData);
          if (!parsedData || parsedData.length === 0) {
            console.log('Saved tree data is empty, loading...');
            dispatch(loadTreeData());
          } else {
            console.log('Using existing tree data from localStorage');
          }
        } catch (error) {
          console.error('Error parsing saved tree data:', error);
          dispatch(loadTreeData());
        }
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