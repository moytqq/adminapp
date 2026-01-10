'use client';

import React, { forwardRef, useEffect, useState, useRef } from 'react';
import styles from './WidgetPopup.module.scss';
import { Plus } from 'lucide-react';
import { TreeItemType, WidgetItem } from '@/types/tree.types';

interface WidgetPopupProps {
  itemId: string;
  itemType: TreeItemType;
  onAddWidget: (widgetType: string) => void;
  onClose: () => void;
}

const WIDGETS_BY_TYPE: Record<TreeItemType, WidgetItem[]> = {
  [TreeItemType.COMPANY]: [
    {
      id: 'company-1',
      title: 'Финансовая отчетность',
      description: 'Доходы и расходы компании',
      type: 'finance',
      availableFor: [TreeItemType.COMPANY]
    } as WidgetItem,
    {
      id: 'company-2',
      title: 'Статистика сотрудников',
      description: 'Анализ штата компании',
      type: 'employees',
      availableFor: [TreeItemType.COMPANY, TreeItemType.DEPARTMENT]
    } as WidgetItem,
    {
      id: 'company-3',
      title: 'Карта магазинов',
      description: 'Геолокация всех магазинов',
      type: 'map',
      availableFor: [TreeItemType.COMPANY, TreeItemType.DEPARTMENT]
    } as WidgetItem,
    {
      id: 'company-4',
      title: 'Ключевые показатели',
      description: 'KPI компании',
      type: 'kpi',
      availableFor: [TreeItemType.COMPANY]
    } as WidgetItem,
  ],
  [TreeItemType.DEPARTMENT]: [
    {
      id: 'dept-1',
      title: 'Бюджет департамента',
      description: 'Распределение бюджета',
      type: 'budget',
      availableFor: [TreeItemType.DEPARTMENT]
    } as WidgetItem,
    {
      id: 'dept-2',
      title: 'Производительность',
      description: 'Эффективность работы отдела',
      type: 'performance',
      availableFor: [TreeItemType.DEPARTMENT]
    } as WidgetItem,
    {
      id: 'dept-3',
      title: 'Проекты департамента',
      description: 'Текущие и завершенные проекты',
      type: 'projects',
      availableFor: [TreeItemType.DEPARTMENT]
    } as WidgetItem,
    {
      id: 'dept-4',
      title: 'Задачи команды',
      description: 'Распределение задач',
      type: 'tasks',
      availableFor: [TreeItemType.DEPARTMENT, TreeItemType.STORE]
    } as WidgetItem,
  ],
  [TreeItemType.STORE]: [
    {
      id: 'store-1',
      title: 'Продажи магазина',
      description: 'Ежедневные и еженедельные продажи',
      type: 'sales',
      availableFor: [TreeItemType.STORE]
    } as WidgetItem,
    {
      id: 'store-2',
      title: 'Инвентаризация',
      description: 'Остатки товаров на складе',
      type: 'inventory',
      availableFor: [TreeItemType.STORE]
    } as WidgetItem,
    {
      id: 'store-3',
      title: 'График работы',
      description: 'Расписание сотрудников',
      type: 'schedule',
      availableFor: [TreeItemType.STORE]
    } as WidgetItem,
    {
      id: 'store-4',
      title: 'Отзывы клиентов',
      description: 'Обратная связь от покупателей',
      type: 'reviews',
      availableFor: [TreeItemType.STORE]
    } as WidgetItem,
  ],
  [TreeItemType.PERSON]: [
    {
      id: 'person-1',
      title: 'Рабочие задачи',
      description: 'Текущие задачи сотрудника',
      type: 'tasks',
      availableFor: [TreeItemType.PERSON]
    } as WidgetItem,
    {
      id: 'person-2',
      title: 'График работы',
      description: 'Расписание и отпуска',
      type: 'schedule',
      availableFor: [TreeItemType.PERSON]
    } as WidgetItem,
    {
      id: 'person-3',
      title: 'Производительность',
      description: 'KPI сотрудника',
      type: 'performance',
      availableFor: [TreeItemType.PERSON]
    } as WidgetItem,
    {
      id: 'person-4',
      title: 'Документы',
      description: 'Личные документы и договоры',
      type: 'documents',
      availableFor: [TreeItemType.PERSON]
    } as WidgetItem,
  ],
};

const WidgetPopup = forwardRef<HTMLDivElement, WidgetPopupProps>(
  ({ itemId, itemType, onAddWidget, onClose }, ref) => {
    const [isMobile, setIsMobile] = useState(false);
    const popupRef = useRef<HTMLDivElement>(null);

    const availableWidgets = WIDGETS_BY_TYPE[itemType] || [];

    useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };

      checkMobile();
      window.addEventListener('resize', checkMobile);

      return () => {
        window.removeEventListener('resize', checkMobile);
      };
    }, []);

    useEffect(() => {
      if (isMobile) {
        document.body.style.overflow = 'hidden';
      }

      return () => {
        document.body.style.overflow = '';
      };
    }, [isMobile]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (!popupRef.current) return;

        const isClickInside = popupRef.current.contains(event.target as Node);

        if (!isClickInside) {
          onClose();
        }
      };

      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);

      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [onClose]);

    useEffect(() => {
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }, [onClose]);

    const handlePopupMouseDown = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
    };

    const handleCloseClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onClose();
    };
    return (
      <>
        {isMobile && (
          <div className={styles.overlay} onClick={onClose} />
        )}

        <div
          ref={popupRef}
          className={`${styles.popup} ${isMobile ? styles.mobile : styles.desktop}`}
          onMouseDown={handlePopupMouseDown}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.header}>
            <h3>Виджеты для {itemType}</h3>
            <button
              className={styles.closeButton}
              onClick={handleCloseClick}
              aria-label="Закрыть"
            >
              ×
            </button>
          </div>

          <div className={styles.content}>
            <div className={styles.grid}>
              {availableWidgets.map(widget => (
                <div key={widget.id} className={styles.card} onClick={(e) => e.stopPropagation()}>
                  <div className={styles.cardHeader}>
                    <h4>{widget.title}</h4>
                    <span className={styles.widgetType}>{widget.type}</span>
                  </div>
                  <p className={styles.description}>{widget.description}</p>
                  <button
                    className={styles.addButton}
                    onClick={() => onAddWidget(widget.type)}
                  >
                    <Plus size={14} />
                    <span>Добавить</span>
                  </button>
                </div>
              ))}
            </div>

            <div className={styles.footer}>
              <p className={styles.hint}>
                Доступно для: <strong>{itemType}</strong> (ID: {itemId})
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }
);

WidgetPopup.displayName = 'WidgetPopup';

export default WidgetPopup;