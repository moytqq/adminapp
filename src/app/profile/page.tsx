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

type TabType = 'departments' | 'employees' | 'tasks' | 'salary' | 'chat' | 'database' | 'documents';

const ProfilePage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('departments');
  const router = useRouter();

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

  const tabs = [
    { id: 'departments' as TabType, label: 'Департаменты', icon: Building2, mobileIcon: Building2 },
    { id: 'employees' as TabType, label: 'Сотрудники', icon: Users, mobileIcon: Users },
    { id: 'tasks' as TabType, label: 'Задачи', icon: ClipboardCheck, mobileIcon: ClipboardCheck },
    { id: 'salary' as TabType, label: 'ЗП/KPI', icon: RussianRuble, mobileIcon: RussianRuble },
    { id: 'chat' as TabType, label: 'Чат', icon: MessageCircle, mobileIcon: MessageCircle },
    { id: 'database' as TabType, label: 'База данных', icon: Database, mobileIcon: Database },
    { id: 'documents' as TabType, label: 'Документы', icon: FileText, mobileIcon: FileText },
  ];

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
        return <ChatView />;
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
          </div>

          <div className={styles.profileInfo}>
            {/*<div className={styles.userInfo}>
              <span className={styles.userName}>Иван Иванов</span>
              {!isMobile && <span className={styles.userRole}>Администратор</span>}
            </div>*/}
            <div className={styles.userAvatar}>
              <User size={24} />
            </div>
          </div>
        </header>

        <div className={styles.tabsContainer}>
          <nav className={styles.tabs}>
            {tabs.map((tab) => {
              const Icon = isMobile ? tab.mobileIcon : tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  title={isMobile ? tab.label : undefined}
                >
                  <Icon size={isMobile ? 24 : 20} />
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