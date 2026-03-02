// app/staff/page.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks/hooks';
import {
  loadAllStaff,
  loadAllPositions,
} from '@/store/slices/personalSlice';
import { loadTreeData } from '@/store/slices/treeSlice';
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';
import LogoutButton from '@/components/LogoutButton/LogoutButton';
import PositionCard from '@/components/StaffPage/PositionCard';
import AddPositionModal from '@/components/StaffPage/AddPositionModal';
import AddStaffModal from '@/components/StaffPage/AddStaffModal';
import styles from './staff.module.scss';
import { ArrowLeft, Plus, Users, Briefcase, Menu } from 'lucide-react';
import Link from 'next/link';
import { TreeItemType } from '@/types/tree.types';
import SideMenu from '@/components/SideMenu/SideMenu';
import stylesSideMenu from '@/app/main/main.module.scss';

export default function StaffPage() {
  const dispatch = useAppDispatch();
  const { positions, staff, loading: personalLoading } = useAppSelector((state) => state.personal);
  const { items: treeItems, loading: treeLoading } = useAppSelector((state) => state.tree);
  const [showAddPositionModal, setShowAddPositionModal] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [storeNamesMap, setStoreNamesMap] = useState<Record<string, string>>({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  useEffect(() => {
    const loadData = async () => {
      setInitialLoading(true);
      try {
        await Promise.all([
          dispatch(loadTreeData()),
          dispatch(loadAllStaff()),
          dispatch(loadAllPositions()),
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    loadData();
  }, [dispatch]);

  useEffect(() => {
    const extractStoreNames = (items: any[]): Record<string, string> => {
      const map: Record<string, string> = {};

      const traverse = (items: any[]) => {
        items.forEach(item => {
          if (item.type === TreeItemType.STORE) {
            const match = item.id.match(/\d+$/);
            const hid = match ? match[0] : item.id;
            map[hid] = item.label || item.data?.storeName || 'Магазин';
          }
          if (item.children) {
            traverse(item.children);
          }
        });
      };

      traverse(items);
      return map;
    };

    if (treeItems && treeItems.length > 0) {
      setStoreNamesMap(extractStoreNames(treeItems));
    }
  }, [treeItems]);

  const positionsByHid = positions.reduce((acc, position) => {
    if (!acc[position.hid]) {
      acc[position.hid] = [];
    }
    acc[position.hid].push(position);
    return acc;
  }, {} as Record<string, typeof positions>);

  const sortedPositions = [...positions].sort((a, b) => {
    if (a.lsid === null && b.lsid !== null) return -1;
    if (a.lsid !== null && b.lsid === null) return 1;
    return a.name.localeCompare(b.name);
  });

  const vacantPositions = positions.filter(p => p.lsid === null);
  const occupiedPositions = positions.filter(p => p.lsid !== null);

  const isLoading = initialLoading || personalLoading || treeLoading;

  return (
    <ProtectedRoute>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
            <button
              className={stylesSideMenu.menuButton}
              onClick={() => setIsMenuOpen(true)}
              aria-label="Открыть меню"
            >
              <Menu size={24} />
            </button>
            <h1 className={styles.title}>Сотрудники и вакансии</h1>
          </div>
          <div className={styles.actions}>
            <button
              className={styles.addButton}
              onClick={() => setShowAddPositionModal(true)}
            >
              <Briefcase size={18} />
              <span>Добавить вакансию</span>
            </button>
            <button
              className={styles.addButton}
              onClick={() => setShowAddStaffModal(true)}
            >
              <Users size={18} />
              <span>Добавить сотрудника</span>
            </button>
          </div>
      </header>

      <main className={styles.content}>
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{positions.length}</div>
            <div className={styles.statLabel}>Всего вакансий</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{vacantPositions.length}</div>
            <div className={styles.statLabel}>Свободных</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{occupiedPositions.length}</div>
            <div className={styles.statLabel}>Занятых</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{staff.length}</div>
            <div className={styles.statLabel}>Сотрудников</div>
          </div>
        </div>

        {isLoading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Загрузка данных...</p>
          </div>
        ) : (
          <div className={styles.positionsGrid}>
            {sortedPositions.length === 0 ? (
              <div className={styles.emptyState}>
                <p>Нет позиций</p>
                <button
                  className={styles.addButton}
                  onClick={() => setShowAddPositionModal(true)}
                >
                  Добавить первую вакансию
                </button>
              </div>
            ) : (
              sortedPositions.map((position) => {
                const assignedStaff = staff.find(s => s.lsid === position.lsid);
                return (
                  <PositionCard
                    key={position.id}
                    position={position}
                    staff={assignedStaff}
                    allStaff={staff}
                    storeName={storeNamesMap[position.hid]}
                  />
                );
              })
            )}
          </div>
        )}
      </main>

      <AddPositionModal
        isOpen={showAddPositionModal}
        onClose={() => setShowAddPositionModal(false)}
      />

      <AddStaffModal
        isOpen={showAddStaffModal}
        onClose={() => setShowAddStaffModal(false)}
      />
    </ProtectedRoute>
);
}