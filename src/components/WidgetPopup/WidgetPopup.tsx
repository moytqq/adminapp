'use client';

import React, { forwardRef, useEffect, useState, useRef } from 'react';
import styles from './WidgetPopup.module.scss';
import { TreeItemType, WidgetItem } from '@/types/tree.types';
import PersonInfoWidget from '../PersonInfoWidget/PersonInfoWidget';
import { createPortal } from 'react-dom';
import { X, Star, StarOff } from 'lucide-react';

interface WidgetPopupProps {
  itemId: string;
  itemType: TreeItemType;
  onAddWidget: (widgetType: string) => void;
  onClose: () => void;
}

// Добавим интерфейс для избранных виджетов
export interface FavoriteWidget {
  id: string;
  type: 'person-info' | string;
  title: string;
  itemId: string;
  itemType: TreeItemType;
  personName?: string;
  position?: string;
  addedDate: string;
}

const WIDGETS_BY_TYPE: Record<TreeItemType, WidgetItem[]> = {
  [TreeItemType.COMPANY]: [
    {
      id: 'company-1',
      title: 'Финансовая отчетность',
      description: 'Доходы и расходы компании',
      type: 'finance',
      availableFor: [TreeItemType.COMPANY]
    },
    {
      id: 'company-2',
      title: 'Статистика сотрудников',
      description: 'Анализ штата компании',
      type: 'employees',
      availableFor: [TreeItemType.COMPANY, TreeItemType.DEPARTMENT]
    },
    {
      id: 'company-3',
      title: 'Карта магазинов',
      description: 'Геолокация всех магазинов',
      type: 'map',
      availableFor: [TreeItemType.COMPANY, TreeItemType.DEPARTMENT]
    },
    {
      id: 'company-4',
      title: 'Ключевые показатели',
      description: 'KPI компании',
      type: 'kpi',
      availableFor: [TreeItemType.COMPANY]
    },
  ],
  [TreeItemType.DEPARTMENT]: [
    {
      id: 'dept-1',
      title: 'Бюджет департамента',
      description: 'Распределение бюджета',
      type: 'budget',
      availableFor: [TreeItemType.DEPARTMENT]
    },
    {
      id: 'dept-2',
      title: 'Произв-сть',
      description: 'Эффективность работы отдела',
      type: 'performance',
      availableFor: [TreeItemType.DEPARTMENT]
    },
    {
      id: 'dept-3',
      title: 'Проекты департамента',
      description: 'Текущие и завершенные проекты',
      type: 'projects',
      availableFor: [TreeItemType.DEPARTMENT]
    },
    {
      id: 'dept-4',
      title: 'Задачи команды',
      description: 'Распределение задач',
      type: 'tasks',
      availableFor: [TreeItemType.DEPARTMENT, TreeItemType.STORE]
    },
  ],
  [TreeItemType.STORE]: [
    {
      id: 'store-1',
      title: 'Продажи магазина',
      description: 'Ежедневные и еженедельные продажи',
      type: 'sales',
      availableFor: [TreeItemType.STORE]
    },
    {
      id: 'store-2',
      title: 'Инвентаризация',
      description: 'Остатки товаров на складе',
      type: 'inventory',
      availableFor: [TreeItemType.STORE]
    },
    {
      id: 'store-3',
      title: 'График работы',
      description: 'Расписание сотрудников',
      type: 'schedule',
      availableFor: [TreeItemType.STORE]
    },
    {
      id: 'store-4',
      title: 'Отзывы клиентов',
      description: 'Обратная связь от покупателей',
      type: 'reviews',
      availableFor: [TreeItemType.STORE]
    },
  ],
  [TreeItemType.PERSON]: [
    {
      id: 'person-1',
      title: 'Информация о сотруднике',
      description: 'Основные данные и контакты сотрудника',
      type: 'person-info',
      availableFor: [TreeItemType.PERSON]
    },
    {
      id: 'person-2',
      title: 'Рабочие задачи',
      description: 'Текущие задачи сотрудника',
      type: 'tasks',
      availableFor: [TreeItemType.PERSON]
    },
    {
      id: 'person-3',
      title: 'График работы',
      description: 'Расписание и отпуска',
      type: 'schedule',
      availableFor: [TreeItemType.PERSON]
    },
    {
      id: 'person-4',
      title: 'Произв-сть',
      description: 'KPI сотрудника',
      type: 'performance',
      availableFor: [TreeItemType.PERSON]
    },
    {
      id: 'person-5',
      title: 'Документы',
      description: 'Личные документы и договоры',
      type: 'documents',
      availableFor: [TreeItemType.PERSON]
    },
  ],
};

const WidgetPopup = forwardRef<HTMLDivElement, WidgetPopupProps>(
  ({ itemId, itemType, onAddWidget, onClose }, ref) => {
    const [isMobile, setIsMobile] = useState(false);
    const [showPersonWidget, setShowPersonWidget] = useState(false);
    const [favoriteWidgets, setFavoriteWidgets] = useState<FavoriteWidget[]>([]);
    const popupRef = useRef<HTMLDivElement>(null);
    const widgetContainerRef = useRef<HTMLDivElement>(null);
    const clickOriginRef = useRef<'popup' | 'widget' | 'outside' | null>(null);

    const availableWidgets = WIDGETS_BY_TYPE[itemType] || [];

    useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };

      checkMobile();
      window.addEventListener('resize', checkMobile);

      // Загружаем избранные виджеты из localStorage
      const loadFavorites = () => {
        try {
          const favorites = localStorage.getItem('favorite-widgets');
          if (favorites) {
            setFavoriteWidgets(JSON.parse(favorites));
          }
        } catch (error) {
          console.error('Error loading favorite widgets:', error);
        }
      };

      loadFavorites();

      return () => {
        window.removeEventListener('resize', checkMobile);
      };
    }, []);

    useEffect(() => {
      if (isMobile || showPersonWidget) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }

      return () => {
        document.body.style.overflow = '';
      };
    }, [isMobile, showPersonWidget]);

    // Функция для проверки, является ли виджет избранным
    const isWidgetFavorite = (widgetType: string): boolean => {
      return favoriteWidgets.some(fav =>
        fav.itemId === itemId && fav.type === widgetType
      );
    };

    // Функция для добавления/удаления виджета из избранного
    const toggleWidgetFavorite = (widgetType: string, e: React.MouseEvent) => {
      e.stopPropagation();

      const widget = availableWidgets.find(w => w.type === widgetType);
      if (!widget) return;

      const newFavorites = [...favoriteWidgets];
      const existingIndex = newFavorites.findIndex(
        fav => fav.itemId === itemId && fav.type === widgetType
      );

      if (existingIndex > -1) {
        // Удаляем из избранного
        newFavorites.splice(existingIndex, 1);
      } else {
        // Добавляем в избранное
        const newFavorite: FavoriteWidget = {
          id: `${itemId}-${widgetType}-${Date.now()}`,
          type: widgetType,
          title: widget.title,
          itemId,
          itemType,
          personName: widgetType === 'person-info' ? itemId : undefined,
          position: widgetType === 'person-info' ? 'Сотрудник' : undefined,
          addedDate: new Date().toISOString()
        };
        newFavorites.push(newFavorite);
      }

      setFavoriteWidgets(newFavorites);
      localStorage.setItem('favorite-widgets', JSON.stringify(newFavorites));
    };

    const handleMouseDown = (e: React.MouseEvent, type: 'popup' | 'widget') => {
      e.stopPropagation();
      clickOriginRef.current = type;
    };

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
    };

    const handleCloseClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onClose();
    };

    const handleWidgetClick = (widgetType: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (widgetType === 'person-info') {
        setShowPersonWidget(true);
      } else {
        onAddWidget(widgetType);
      }
    };

    const handlePersonWidgetClose = () => {
      setShowPersonWidget(false);
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onClose();
      setShowPersonWidget(false);
    };

    const getWidgetPosition = () => {
      if (isMobile) return 'mobile-bottom';
      return 'desktop-left';
    };

    useEffect(() => {
      const handleDocumentClick = (event: MouseEvent) => {
        const popupElement = popupRef.current;
        const widgetElement = widgetContainerRef.current;

        if (!popupElement && !widgetElement) return;

        const isClickInsidePopup = popupElement?.contains(event.target as Node);
        const isClickInsideWidget = widgetElement?.contains(event.target as Node);
        const isClickOnOverlay = (event.target as HTMLElement)?.classList.contains(styles.overlay);

        if (isClickOnOverlay) {
          onClose();
          setShowPersonWidget(false);
          return;
        }

        if (!isClickInsidePopup && !isClickInsideWidget) {
          if (showPersonWidget) {
            setShowPersonWidget(false);
          } else {
            onClose();
          }
        }
      };

      document.addEventListener('click', handleDocumentClick, true);

      return () => {
        document.removeEventListener('click', handleDocumentClick, true);
      };
    }, [onClose, showPersonWidget]);

    return (
      <>
        <div
          className={styles.overlay}
          onClick={handleOverlayClick}
          data-testid="widget-overlay"
        />

        <div
          ref={popupRef}
          className={`${styles.popup} ${isMobile ? styles.mobile : styles.desktop}`}
          onMouseDown={(e) => handleMouseDown(e, 'popup')}
          onClick={handleClick}
          data-testid="widget-popup"
        >
          <div className={styles.header}>
            <h3>Виджеты для {itemType}</h3>
            <button
              className={styles.closeButton}
              onClick={handleCloseClick}
              aria-label="Закрыть"
              data-testid="widget-close-button"
            >
              <X size={18}/>
            </button>
          </div>

          <div className={styles.content}>
            <div className={styles.grid}>
              {availableWidgets.map(widget => {
                const isFavorite = isWidgetFavorite(widget.type);
                return (
                  <div
                    key={widget.id}
                    className={`${styles.card} ${widget.type === 'person-info' ? styles.personCard : ''}`}
                    onClick={(e) => handleWidgetClick(widget.type, e)}
                    data-testid={`widget-card-${widget.id}`}
                  >
                    <div className={styles.cardHeader}>
                      <h4>{widget.title}</h4>
                      <button
                        className={`${styles.favoriteButton} ${isFavorite ? styles.favorited : ''}`}
                        onClick={(e) => toggleWidgetFavorite(widget.type, e)}
                        aria-label={isFavorite ? "Убрать из избранного" : "Добавить в избранное"}
                        title={isFavorite ? "Убрать из избранного" : "Добавить в избранное"}
                      >
                        {isFavorite ? <StarOff size={14} /> : <Star size={14} />}
                      </button>
                    </div>
                    <p className={styles.description}>{widget.description}</p>
                    {widget.type === 'person-info' && (
                      <div className={styles.clickHint}>
                        Нажмите, чтобы открыть
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className={styles.footer}>
              <p className={styles.hint}>
                Доступно для: <strong>{itemType}</strong> (ID: {itemId})
              </p>
            </div>
          </div>
        </div>

        {showPersonWidget && createPortal(
          <div
            ref={widgetContainerRef}
            className={`${styles.personWidgetWrapper} ${styles[getWidgetPosition()]}`}
            onMouseDown={(e) => handleMouseDown(e, 'widget')}
            onClick={handleClick}
            data-testid="person-widget-container"
          >
            <PersonInfoWidget
              itemId={itemId}
              onClose={handlePersonWidgetClose}
              isMobile={isMobile}
              showAddToFavorites={true}
            />
          </div>,
          document.body
        )}
      </>
    );
  }
);

WidgetPopup.displayName = 'WidgetPopup';

export default WidgetPopup;