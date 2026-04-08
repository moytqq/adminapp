'use client';

import React from 'react';
import styles from './StaffCategorySelector.module.scss';
import {
  Phone,
  Building2,
  Users,
  UserCog,
  UserRound,
  Wrench,
  ArrowLeft,
} from 'lucide-react';

export interface StaffCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface StaffCategorySelectorProps {
  onSelectCategory: (categoryId: string, categoryName: string) => void;
  selectedCategory?: string | null;
  onBackToCategories?: () => void;
}

const staffCategories: StaffCategory[] = [
  {
    id: 'hotline',
    title: 'Горячая линия',
    description: 'Сотрудники горячей линии',
    icon: <Phone size={32} />,
    color: '#e91e63',
    bgColor: '#fce4ec',
  },
  {
    id: 'office',
    title: 'Офис',
    description: 'Офисные сотрудники',
    icon: <Building2 size={32} />,
    color: '#2196f3',
    bgColor: '#e3f2fd',
  },
  {
    id: 'managers',
    title: 'Управляющие',
    description: 'Управляющий состав',
    icon: <UserCog size={32} />,
    color: '#9c27b0',
    bgColor: '#f3e5f5',
  },
  {
    id: 'managers_line',
    title: 'Менеджеры',
    description: 'Менеджеры различных направлений',
    icon: <Users size={32} />,
    color: '#ff9800',
    bgColor: '#fff3e0',
  },
  {
    id: 'linear',
    title: 'Линейный',
    description: 'Линейный персонал',
    icon: <UserRound size={32} />,
    color: '#4caf50',
    bgColor: '#e8f5e9',
  },
  {
    id: 'engineers',
    title: 'Инженеры',
    description: 'Инженерно-технический персонал',
    icon: <Wrench size={32} />,
    color: '#607d8b',
    bgColor: '#eceff1',
  },
];

const StaffCategorySelector: React.FC<StaffCategorySelectorProps> = ({
                                                                       onSelectCategory,
                                                                       selectedCategory = null,
                                                                       onBackToCategories,
                                                                     }) => {
  if (selectedCategory) {
    const category = staffCategories.find(c => c.id === selectedCategory);

    return (
      <div className={styles.container}>
        <div className={styles.headerWithBackButton}>
          <div className={styles.headerContent}>
            <h1>{category?.title}</h1>
            <p>Список сотрудников категории "{category?.title}"</p>
          </div>
          <div className={styles.backButtonWrapper}>
            <button className={styles.backButton} onClick={onBackToCategories}>
              <ArrowLeft size={20} />
              <span>Назад</span>
            </button>
          </div>
        </div>
        <div className={styles.comingSoon}>
          <p>Функционал просмотра сотрудников по категориям будет доступен позже</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Сотрудники и вакансии</h1>
          <p>Выберите категорию для просмотра сотрудников</p>
        </div>
      </div>
      <div className={styles.grid}>
        {staffCategories.map(category => (
          <button
            key={category.id}
            className={styles.card}
            onClick={() => onSelectCategory(category.id, category.title)}
            style={{ backgroundColor: category.bgColor }}
          >
            <div className={styles.iconWrapper} style={{ color: category.color }}>
              {category.icon}
            </div>
            <h3 className={styles.title}>{category.title}</h3>
            <p className={styles.description}>{category.description}</p>
            <div className={styles.arrow}>→</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default StaffCategorySelector;