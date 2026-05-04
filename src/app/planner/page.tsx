'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';
import SideMenu from '@/components/SideMenu/SideMenu';
import styles from './planner.module.scss';
import { Menu, ArrowLeft } from 'lucide-react';
import stylesSideMenu from '@/app/main/main.module.scss';
import PlannerTypeSelector from '@/components/Planner/PlannerTypeSelector';
import PlannerView from '@/components/Planner/PlannerView';

const PlannerPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedPlannerType, setSelectedPlannerType] = useState<string | null>(null);
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
    if (selectedPlannerType) {
      setSelectedPlannerType(null);
    } else {
      router.push('/main');
    }
  };

  const showBackButton = selectedPlannerType !== null;
  const getHeaderTitle = () => {
    if (selectedPlannerType) {
      const typeTitles: Record<string, string> = {
        tasks: 'Задачи',
        schedule: 'График работы',
        events: 'Мероприятия',
        deadlines: 'Сроки',
        urgent: 'Срочные задачи',
        completed: 'Выполненные',
        upcoming: 'Предстоящие',
        overdue: 'Просроченные',
        calendar: 'Календарь',
      };
      return typeTitles[selectedPlannerType] || 'Планировщик';
    }
    return 'Планировщик';
  };

  return (
    <ProtectedRoute requiredFlags={['ADMIN']} redirectTo="/main">
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
            {!selectedPlannerType && <h1 className={styles.title}>{getHeaderTitle()}</h1>}
          </div>
          {showBackButton && (
            <button
              className="typeSelectorBackButtonGray"
              onClick={handleBack} title="Назад">
              <ArrowLeft size={20} />
              <span>Назад</span>
            </button>
          )}
        </header>

        <main className={styles.content}>
          {!selectedPlannerType ? (
            <PlannerTypeSelector onSelectType={setSelectedPlannerType} />
          ) : (
            <PlannerView
              plannerType={selectedPlannerType}
              onBack={() => setSelectedPlannerType(null)}
            />
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default PlannerPage;