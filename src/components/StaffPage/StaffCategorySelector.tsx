'use client';

import React from 'react';
import styles from './StaffCategorySelector.module.scss';
import {
  UserRound,
  ArrowLeft,
  ClipboardList,
  Eye,
  BarChart3,
  TableProperties,
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
  hasManagerAccess?: boolean;
  onManagerAction?: () => void;
  onViewAction?: () => void;
  onReportAction?: () => void;
  onFillStatsAction?: () => void;
  hasLinearAccess?: boolean;
  isAdmin?: boolean;
}

const staffCategories: StaffCategory[] = [
  {
    id: 'linear',
    title: 'Линейный',
    description: 'Линейный персонал',
    icon: <UserRound size={32} />,
    color: '#4caf50',
    bgColor: '#e8f5e9',
  },
];

const StaffCategorySelector: React.FC<StaffCategorySelectorProps> = ({
                                                                       onSelectCategory,
                                                                       selectedCategory = null,
                                                                       onBackToCategories,
                                                                       hasManagerAccess = false,
                                                                       onManagerAction,
                                                                       onViewAction,
                                                                       onReportAction,
                                                                       onFillStatsAction,
                                                                       hasLinearAccess = false,
                                                                       isAdmin = false,
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
          <h1>Линейный персонал</h1>
          <p>Выберите категорию</p>
        </div>
      </div>
      <div className={styles.grid}>
        {hasLinearAccess && staffCategories.map(category => (
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
        {hasManagerAccess && (
          <button
            className={styles.card}
            onClick={onManagerAction}
            style={{ backgroundColor: '#fce8ea' }}
          >
            <div className={styles.iconWrapper} style={{ color: '#dc1e32' }}>
              <ClipboardList size={32} />
            </div>
            <h3 className={styles.title}>Заполнить персонал</h3>
            <p className={styles.description}>Учёт линейного персонала по адресам</p>
            <div className={styles.arrow}>→</div>
          </button>
        )}
        {hasManagerAccess && (
          <button
            className={styles.card}
            onClick={onViewAction}
            style={{ backgroundColor: '#e8f0fe' }}
          >
            <div className={styles.iconWrapper} style={{ color: '#1a73e8' }}>
              <Eye size={32} />
            </div>
            <h3 className={styles.title}>Просмотреть</h3>
            <p className={styles.description}>Просмотр персонала по всем адресам</p>
            <div className={styles.arrow}>→</div>
          </button>
        )}
        {isAdmin && (
          <button
            className={styles.card}
            onClick={onReportAction}
            style={{ backgroundColor: '#f0ebff' }}
          >
            <div className={styles.iconWrapper} style={{ color: '#6c35de' }}>
              <BarChart3 size={32} />
            </div>
            <h3 className={styles.title}>Отчёт</h3>
            <p className={styles.description}>Заполненность адресов по управляющим</p>
            <div className={styles.arrow}>→</div>
          </button>
        )}
        {isAdmin && (
          <button
            className={styles.card}
            onClick={onFillStatsAction}
            style={{ backgroundColor: '#e8faf0' }}
          >
            <div className={styles.iconWrapper} style={{ color: '#137333' }}>
              <TableProperties size={32} />
            </div>
            <h3 className={styles.title}>Анализ полей</h3>
            <p className={styles.description}>Детальная заполненность анкет по полям</p>
            <div className={styles.arrow}>→</div>
          </button>
        )}
      </div>
    </div>
  );
};

export default StaffCategorySelector;