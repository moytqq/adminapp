'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import styles from './ReportTypeSelector.module.scss';
import {
  Coffee, Cake, Croissant, Salad, Soup, UtensilsCrossed,
  Beef, Milk, CookingPot, Box, ArrowLeft,
} from 'lucide-react';

export interface ReportType {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  requiredFlags?: string[];
}

export interface CategoryType {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  requiredFlags?: string[];
  reportTypes?: ReportType[];
}

interface ReportTypeSelectorProps {
  onSelectType: (typeId: string) => void;
  selectedCategory?: string | null;
  onSelectCategory?: (categoryId: string) => void;
  onBackToCategories?: () => void;
}

const allCategories: CategoryType[] = [
  {
    id: 'meat',
    title: 'Мясо',
    description: 'Анализ продаж мясных продуктов',
    icon: <Beef size={32} />,
    color: '#d32f2f',
    bgColor: '#ffebee',
    requiredFlags: ['ADMIN'],
    reportTypes: [],
  },
  {
    id: 'dairy',
    title: 'Молочка',
    description: 'Анализ продаж молочных продуктов',
    icon: <Milk size={32} />,
    color: '#1976d2',
    bgColor: '#e3f2fd',
    requiredFlags: ['ADMIN'],
    reportTypes: [],
  },
  {
    id: 'sausage',
    title: 'Колбаса',
    description: 'Анализ продаж колбасных изделий',
    icon: <Box size={32} />,
    color: '#f57c00',
    bgColor: '#fff3e0',
    requiredFlags: ['ADMIN'],
    reportTypes: [],
  },
  {
    id: 'culinary',
    title: 'Кулинария',
    description: 'Анализ продаж кулинарных изделий',
    icon: <CookingPot size={32} />,
    color: '#7b1fa2',
    bgColor: '#f3e5f5',
    requiredFlags: ['RESULTS', 'ADMIN'],
    reportTypes: [
      {
        id: 'drinks',
        title: 'Напитки',
        description: 'Анализ продаж кофе, чая и других напитков',
        icon: <Coffee size={32} />,
        color: '#2196f3',
        bgColor: '#e3f2fd',
      },
      {
        id: 'desserts',
        title: 'Десерты',
        description: 'Анализ продаж десертов и выпечки',
        icon: <Cake size={32} />,
        color: '#9c27b0',
        bgColor: '#f3e5f5',
      },
      {
        id: 'bakery',
        title: 'Выпечка',
        description: 'Анализ продаж выпечки',
        icon: <Croissant size={32} />,
        color: '#ff9800',
        bgColor: '#fff3e0',
      },
      {
        id: 'bread',
        title: 'Хлеб',
        description: 'Анализ продаж хлеба',
        icon: <Box size={32} />,
        color: '#d1bc02',
        bgColor: '#f8f5dc',
      },
      {
        id: 'salads',
        title: 'Салаты',
        description: 'Анализ продаж салатов и закусок',
        icon: <Salad size={32} />,
        color: '#4caf50',
        bgColor: '#e8f5e9',
      },
      {
        id: 'soups',
        title: 'Супы',
        description: 'Анализ продаж супов и бульонов',
        icon: <Soup size={32} />,
        color: '#ff5722',
        bgColor: '#fbe9e7',
      },
      {
        id: 'hot',
        title: 'Горячее',
        description: 'Анализ продаж горячих блюд',
        icon: <UtensilsCrossed size={32} />,
        color: '#795548',
        bgColor: '#efebe9',
      },
    ],
  },
];

const ReportTypeSelector: React.FC<ReportTypeSelectorProps> = ({
                                                                 onSelectType,
                                                                 selectedCategory = null,
                                                                 onSelectCategory,
                                                                 onBackToCategories,
                                                               }) => {
  const { flags } = useSelector((state: RootState) => state.auth);

  const hasAccessToCategory = (requiredFlags?: string[]): boolean => {
    if (!requiredFlags || requiredFlags.length === 0) return true;
    if (flags.includes('ADMIN')) return true;
    return requiredFlags.some(flag => flags.includes(flag));
  };

  const categories = allCategories.filter(category => hasAccessToCategory(category.requiredFlags));

  console.log('ReportTypeSelector - user flags:', flags);
  console.log('Visible categories:', categories.map(c => c.title));

  if (selectedCategory) {
    const category = categories.find(c => c.id === selectedCategory);

    if (!category || !category.reportTypes || category.reportTypes.length === 0) {
      return (
        <div className={styles.container}>
          <div className={styles.headerWithBackButton}>
            <div className={styles.headerContent}>
              <h1>{category?.title}</h1>
              <p>Отчеты для этой категории будут доступны позже</p>
              <div className={styles.backButtonWrapper}>
                <button className={styles.backButton} onClick={onBackToCategories}>
                  <ArrowLeft size={20} />
                  <span>Назад</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.container}>
        <div className={styles.headerWithBackButton}>
          <div className={styles.headerContent}>
            <h1>{category.title}</h1>
            <p>Выберите тип отчета для анализа продаж</p>
          </div>
          <div className={styles.backButtonWrapper}>
            <button className={styles.backButton} onClick={onBackToCategories}>
              <ArrowLeft size={20} />
              <span>Назад</span>
            </button>
          </div>
        </div>
        <div className={styles.grid}>
          {category.reportTypes.map(type => (
            <button
              key={type.id}
              className={styles.card}
              onClick={() => onSelectType(type.id)}
              style={{ backgroundColor: type.bgColor }}
            >
              <div className={styles.iconWrapper} style={{ color: type.color }}>
                {type.icon}
              </div>
              <h3 className={styles.title}>{type.title}</h3>
              <p className={styles.description}>{type.description}</p>
              <div className={styles.arrow}>→</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Результаты</h1>
          <p>Выберите категорию для анализа продаж</p>
        </div>
      </div>
      <div className={styles.grid}>
        {categories.map(category => (
          <button
            key={category.id}
            className={styles.card}
            onClick={() => onSelectCategory?.(category.id)}
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

export default ReportTypeSelector;