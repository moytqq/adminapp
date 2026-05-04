'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';
import SideMenu from '@/components/SideMenu/SideMenu';
import ReportTypeSelector from '@/components/Reports/ReportTypeSelector';
import ReportsView from '@/components/Reports/ReportsView';
import styles from './results.module.scss';
import { Menu, ArrowLeft } from 'lucide-react';
import stylesSideMenu from '@/app/main/main.module.scss';

const RezultatyPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const router = useRouter();

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSelectType = (typeId: string) => {
    setSelectedReportType(typeId);
    setSelectedCategory(null);
  };

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
  };

  const handleBack = () => {
    if (selectedReportType) {
      setSelectedReportType(null);
      setSelectedCategory('culinary');
    } else if (selectedCategory) {
      setSelectedCategory(null);
    } else {
      router.push('/main');
    }
  };

  const showBackButton = selectedReportType || selectedCategory;
  const getHeaderTitle = () => {
    if (selectedReportType) return null;
    if (selectedCategory) {
      const categoryTitles: Record<string, string> = {
        meat: 'Мясо',
        dairy: 'Молочка',
        sausage: 'Колбаса',
        culinary: 'Кулинария',
      };
      return categoryTitles[selectedCategory] || 'Результаты';
    }
    return 'Результаты';
  };

  return (
    <ProtectedRoute requiredFlags={['RESULTS', 'ADMIN']} redirectTo="/main">
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
            {<h1 className={styles.title}>Результаты</h1>}
          </div>
        </header>

        <main className={styles.content}>
          {!selectedReportType ? (
            <ReportTypeSelector
              onSelectType={handleSelectType}
              selectedCategory={selectedCategory}
              onSelectCategory={handleSelectCategory}
              onBackToCategories={handleBackToCategories}
            />
          ) : (
            <ReportsView
              reportType={selectedReportType}
              onBack={handleBack}
            />
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default RezultatyPage;