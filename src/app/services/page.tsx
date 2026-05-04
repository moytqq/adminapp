'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';
import SideMenu from '@/components/SideMenu/SideMenu';
import styles from './services.module.scss';
import { Menu, ArrowLeft } from 'lucide-react';
import stylesSideMenu from '@/app/main/main.module.scss';
import ServiceTypeSelector from '@/components/Services/ServiceTypeSelector';
import ServiceView from '@/components/Services/ServiceView';

const ServicesPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState<string | null>(null);
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
    if (selectedServiceType) {
      setSelectedServiceType(null);
    } else {
      router.push('/main');
    }
  };

  const showBackButton = selectedServiceType !== null;
  const getHeaderTitle = () => {
    if (selectedServiceType) {
      const typeTitles: Record<string, string> = {
        repairs: 'Ремонт',
        coffeeMakers: 'Кофемашины',
        fridges: 'Холодильники',
        shopWindows: 'Витрины',
        kitchen: 'Кухня',
        stove: 'Печи',
        climate: 'Климат',
        cashRegisters: 'Кассы-Орг',
      };
      return typeTitles[selectedServiceType] || 'Сервис';
    }
    return 'Сервис';
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
            {!selectedServiceType && <h1 className={styles.title}>{getHeaderTitle()}</h1>}
          </div>
          {showBackButton && (
            <button className="typeSelectorBackButtonGray" onClick={handleBack} title="Назад">
              <ArrowLeft size={20} />
              <span>Назад</span>
            </button>
          )}
        </header>

        <main className={styles.content}>
          {!selectedServiceType ? (
            <ServiceTypeSelector onSelectType={setSelectedServiceType} />
          ) : (
            <ServiceView
              serviceType={selectedServiceType}
              onBack={() => setSelectedServiceType(null)}
            />
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default ServicesPage;