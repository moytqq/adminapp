'use client';

import dynamic from 'next/dynamic';
import { loadTreeData } from '@/store/slices/treeSlice';
import Link from 'next/link';
import { Menu, Star } from 'lucide-react';
import { useAppDispatch } from '@/store/hooks/hooks';
import { useEffect, useState } from 'react';
import styles from './main.module.scss';
import LogoutButton from '@/components/LogoutButton/LogoutButton';
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';
import SideMenu from '@/components/SideMenu/SideMenu';

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
    console.log('Loading tree data...');
    dispatch(loadTreeData());
  }, [dispatch]);

  return null;
}

export default function Home() {

  return (
    <>
      <ProtectedRoute>
        <TreeDataLoader />
          {/*<Link*/}
          {/*  href="/favorites"*/}
          {/*  className={styles.favoritesLink}*/}
          {/*  aria-label="Избранные виджеты"*/}
          {/*  title="Избранные виджеты"*/}
          {/*>*/}
          {/*  <Star size={24} />*/}
          {/*  <span className={styles.favoritesText}>Избранные виджеты</span>*/}
          {/*</Link>*/}

        <main>
          <TreeList />
        </main>
      </ProtectedRoute>
    </>
  );
}
