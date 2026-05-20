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
import { ServiceType } from '@/services/serviceApi';
import PageTitle from '@/components/PageTitle/PageTitle';

const ServicesPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | null>(null);
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
      return selectedServiceType.name === 'История заявок' ? 'История заявок' : selectedServiceType.name;
    }
    return 'Сервис';
  };

  return (
    <ProtectedRoute requiredFlags={['SERVICE', 'SERVICE_ADMIN', 'ADMIN']} redirectTo="/main">
      <PageTitle title="Сервис" />
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
            <h1 className={styles.title}>Сервис</h1>
          </div>
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