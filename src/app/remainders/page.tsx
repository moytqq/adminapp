'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';
import SideMenu from '@/components/SideMenu/SideMenu';
import ItemSelector, { SelectorItem } from '@/components/AutoOrders/ItemSelector';
import RemaindersView from '@/components/AutoOrders/RemaindersView';
import { remaindersApi, RemainderForm } from '@/services/remaindersApi';
import PageTitle from '@/components/PageTitle/PageTitle';
import styles from '@/app/autoOrders/autoOrders.module.scss';
import { Menu, Package } from 'lucide-react';
import stylesSideMenu from '@/app/main/main.module.scss';

const RemaindersPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [forms, setForms] = useState<RemainderForm[]>([]);
  const [selectedForm, setSelectedForm] = useState<RemainderForm | null>(null);
  const [loadingForms, setLoadingForms] = useState(false);

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    setLoadingForms(true);
    try {
      const data = await remaindersApi.getFormsList();
      setForms(data);
    } catch (error) {
      console.error('Error loading forms:', error);
    } finally {
      setLoadingForms(false);
    }
  };

  const items: SelectorItem[] = forms.map(form => ({
    id: form.id,
    name: form.name.replace(/^[^ ]* /, ''),
    icon: <Package size={28} />,
  }));

  return (
    <ProtectedRoute requiredFlags={['LS_AUTOZAKAZI', 'TM_AUTOZAKAZI', 'ADMIN']} redirectTo="/main">
      <PageTitle title="Остатки" />
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
            <h1 className={styles.title}>Остатки</h1>
          </div>
        </header>

        <main className={styles.content}>
          {!selectedForm ? (
            <ItemSelector
              title="Остатки"
              subtitle="Выберите магазин для заполнения остатков"
              items={items}
              onSelect={(item) => {
                const form = forms.find(f => f.id === Number(item.id));
                if (form) setSelectedForm(form);
              }}
              loading={loadingForms}
              showBackButton={false}
            />
          ) : (
            <RemaindersView form={selectedForm} onBack={() => setSelectedForm(null)} />
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default RemaindersPage;
