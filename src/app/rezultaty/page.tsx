'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';
import SideMenu from '@/components/SideMenu/SideMenu';
import ReportTypeSelector from '@/components/Reports/ReportTypeSelector';
import ReportsView from '@/components/Reports/ReportsView';
import styles from './rezultaty.module.scss';
import { Menu, ArrowLeft } from 'lucide-react';
import stylesSideMenu from '@/app/main/main.module.scss';

const RezultatyPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<string | null>(null);
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
    if (selectedReportType) {
      setSelectedReportType(null);
    } else {
      router.push('/main');
    }
  };

  return (
    <ProtectedRoute>
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
            {!selectedReportType && <h1 className={styles.title}>Результаты</h1>}
          </div>
        </header>

        <main className={styles.content}>
          {!selectedReportType ? (
            <ReportTypeSelector onSelectType={setSelectedReportType} />
          ) : (
            <ReportsView
              reportType={selectedReportType}
              onBack={() => setSelectedReportType(null)}
            />
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default RezultatyPage;