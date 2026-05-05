'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Menu,
  User,
  Building2,
  Users,
  ClipboardCheck,
  DollarSign,
  MessageCircle,
  Database,
  FileText,
  RussianRuble,
} from 'lucide-react';
import styles from './profile.module.scss';
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';
import SideMenu from '@/components/SideMenu/SideMenu';
import LogoutButton from '@/components/LogoutButton/LogoutButton';
import ChatView from '@/components/Profile/Chat/ChatView';
import DepartmentsView from '@/components/Profile/Departments/DepartmentsView';
import EmployeesView from '@/components/Profile/EmployeesView/EmployeesView';
import SalaryView from '@/components/Salary/SalaryView';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

type TabType = 'departments' | 'employees' | 'tasks' | 'salary' | 'chat' | 'database' | 'documents';

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  mobileIcon: React.ReactNode;
  requiredFlags?: string[];
}

const ProfilePage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('departments');
  const router = useRouter();
  const { flags } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1000);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const hasAccessToTab = (requiredFlags?: string[]): boolean => {
    if (!requiredFlags || requiredFlags.length === 0) return true;
    if (flags.includes('ADMIN')) return true;
    return requiredFlags.some(flag => flags.includes(flag));
  };

  // Конфигурация вкладок с требуемыми флагами
  const allTabs: TabConfig[] = [
    {
      id: 'departments',
      label: 'Департаменты',
      icon: <Building2 size={20} />,
      mobileIcon: <Building2 size={24} />,
      requiredFlags: []
    },
    {
      id: 'employees',
      label: 'Сотрудники',
      icon: <Users size={20} />,
      mobileIcon: <Users size={24} />,
      requiredFlags: ['ADMIN']
    },
    {
      id: 'tasks',
      label: 'Задачи',
      icon: <ClipboardCheck size={20} />,
      mobileIcon: <ClipboardCheck size={24} />,
      requiredFlags: ['ADMIN']
    },
    {
      id: 'salary',
      label: 'ЗП/KPI',
      icon: <RussianRuble size={20} />,
      mobileIcon: <RussianRuble size={24} />,
      requiredFlags: ['ADMIN']
    },
    {
      id: 'chat',
      label: 'Чат',
      icon: <MessageCircle size={20} />,
      mobileIcon: <MessageCircle size={24} />,
      requiredFlags: ['CHAT', 'ADMIN']
    },
    {
      id: 'database',
      label: 'База данных',
      icon: <Database size={20} />,
      mobileIcon: <Database size={24} />,
      requiredFlags: ['ADMIN']
    },
    {
      id: 'documents',
      label: 'Документы',
      icon: <FileText size={20} />,
      mobileIcon: <FileText size={24} />,
      requiredFlags: ['ADMIN']
    },
  ];

  const visibleTabs = allTabs.filter(tab => hasAccessToTab(tab.requiredFlags));

  useEffect(() => {
    if (visibleTabs.length > 0) {
      const hasCurrentTab = visibleTabs.some(tab => tab.id === activeTab);
      if (!hasCurrentTab) {
        setActiveTab(visibleTabs[0].id);
      }
    }
  }, [visibleTabs, activeTab]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'departments':
        return <DepartmentsView />;
      case 'employees':
        return <EmployeesView />;
      case 'tasks':
        return (
          <div className={styles.placeholder}>
            <ClipboardCheck size={48} />
            <h3>Задачи</h3>
            <p>Здесь будет отображаться список задач</p>
          </div>
        );
      case 'salary':
        return <SalaryView />;
      case 'chat':
        return <ChatView  isInProfile={true}/>;
      case 'database':
        return (
          <div className={styles.placeholder}>
            <Database size={48} />
            <h3>База данных</h3>
            <p>Здесь будет отображаться информация из базы данных</p>
          </div>
        );
      case 'documents':
        return (
          <div className={styles.placeholder}>
            <FileText size={48} />
            <h3>Документы</h3>
            <p>Здесь будет отображаться список документов</p>
          </div>
        );
      default:
        return null;
    }
  };

  if (visibleTabs.length === 0) {
    return (
      <ProtectedRoute>
        <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        <div className={styles.container}>
          <header className={styles.header}>
            <div className={styles.headerLeft}>
              <button
                className={styles.menuButton}
                onClick={() => setIsMenuOpen(true)}
                aria-label="Открыть меню"
              >
                <Menu size={24} />
              </button>
              <h1 className={styles.title}>Личный кабинет</h1>
            </div>
            <div className={styles.profileInfo}>
              <div className={styles.userAvatar}>
                <User size={24} />
              </div>
            </div>
          </header>
          <main className={styles.content}>
            <div className={styles.noTabsMessage}>
              <h3>Нет доступных разделов</h3>
              <p>У вашей учетной записи нет доступа к разделам личного кабинета</p>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button
              className={styles.menuButton}
              onClick={() => setIsMenuOpen(true)}
              aria-label="Открыть меню"
            >
              <Menu size={24} />
            </button>
            <h1 className={styles.title}>Личный кабинет</h1>
          </div>

          <div className={styles.profileInfo}>
            <div className={styles.userAvatar}>
              <User size={24} />
            </div>
          </div>
        </header>

        <div className={styles.tabsContainer}>
          <nav className={styles.tabs}>
            {visibleTabs.map((tab) => {
              const Icon = isMobile ? tab.mobileIcon : tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  title={isMobile ? tab.label : undefined}
                >
                  {Icon}
                  {!isMobile && <span>{tab.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        <main className={styles.content}>
          <div className={styles.tabContent}>{renderTabContent()}</div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default ProfilePage;