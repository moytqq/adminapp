'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';
import SideMenu from '@/components/SideMenu/SideMenu';
import styles from './autoOrders.module.scss';
import { Menu, ArrowLeft } from 'lucide-react';
import stylesSideMenu from '@/app/main/main.module.scss';
import AutoOrderTypeSelector from '@/components/AutoOrders/AutoOrderTypeSelector';
import AutoOrdersView from '@/components/AutoOrders/AutoOrdersView';
import PageTitle from '@/components/PageTitle/PageTitle';

const AutoOrdersPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedAutoOrderType, setSelectedAutoOrderType] = useState<string | null>(null);
  const router = useRouter();

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleBack = () => {
    if (selectedAutoOrderType) {
      setSelectedAutoOrderType(null);
    } else {
      router.push('/main');
    }
  };

  const showBackButton = selectedAutoOrderType !== null;
  const getHeaderTitle = () => {
    if (selectedAutoOrderType) {
      const typeTitles: Record<string, string> = {
        itemsMatrix: 'Товарная матрица',
        nonProfitablePurchases: 'Некоммерческие закупки',
        workInProgress: 'В работе',
        completed: 'Выполнены',
        urgentOrder: 'Срочный заказ',
      };
      return typeTitles[selectedAutoOrderType] || 'Автозаказы';
    }
    return 'Автозаказы';
  };

  return (
    <ProtectedRoute requiredFlags={['TM_AUTOZAKAZI', 'ADMIN']} redirectTo="/main">
      <PageTitle title="Автозаказы" />
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button
              className={stylesSideMenu.menuButton}
              onClick={() => setIsMenuOpen(true)}
              aria-label="Открыть меню"
            >
              <Menu size={24} />
            </button>
            <h1 className={styles.title}>Автозаказы</h1>
          </div>
        </header>

        <main className={styles.content}>
          {!selectedAutoOrderType ? (
            <AutoOrderTypeSelector onSelectType={setSelectedAutoOrderType} />
          ) : (
            <AutoOrdersView
              autoOrderType={selectedAutoOrderType}
              onBack={() => setSelectedAutoOrderType(null)}
            />
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default AutoOrdersPage;