'use client';

import React, { forwardRef, useEffect, useState, useRef } from 'react';
import styles from './WidgetPopup.module.scss';
import { FavoriteWidget, TreeItemType, WidgetItem } from '@/types/tree.types';
import PersonInfoWidget from '../PersonInfoWidget/PersonInfoWidget';
import { createPortal } from 'react-dom';
import { X, Star, StarOff } from 'lucide-react';
import StoreInfoWidget from '@/components/StoreInfoWidget/StoreInfoWidget';
import { useAppSelector } from '@/store/hooks/hooks';
import StoreFinanceWidget from '@/components/StoreFinanceWidget/StoreFinanceWidget';
import PersonnelManagementWidget from '../PersonnelManagementWidget/PersonnelManagementWidget';

interface WidgetPopupProps {
  itemId: string;
  itemType: TreeItemType;
  onAddWidget: (widgetType: string) => void;
  onClose: () => void;
}


const WIDGETS_BY_TYPE: Record<TreeItemType, WidgetItem[]> = {
  [TreeItemType.ADDRESS]: [],
  [TreeItemType.STORE]: [
    {
      id: 'store-info',
      title: 'Информация о магазине',
      description: 'Основные данные и контакты магазина',
      type: 'store-info',
      availableFor: [TreeItemType.STORE],
    },
    {
      id: 'store-personnel',
      title: 'Сотрудники и вакансии',
      description: 'Управление персоналом и вакансиями магазина',
      type: 'personnel-management',
      availableFor: [TreeItemType.STORE],
    },
    {
      id: 'store-finance',
      title: 'Финансовая аналитика',
      description: 'Анализ продаж, чеков и выручки по месяцам',
      type: 'store-finance',
      availableFor: [TreeItemType.STORE],
    },
  ],
  [TreeItemType.COMPANY]: [],
  [TreeItemType.DEPARTMENT]: [
    {
      id: 'department-personnel',
      title: 'Сотрудники и вакансии',
      description: 'Управление персоналом и вакансиями департамента',
      type: 'personnel-management',
      availableFor: [TreeItemType.DEPARTMENT],
    },
  ],
  [TreeItemType.PERSON]: [
    {
      id: 'person-1',
      title: 'Информация о сотруднике',
      description: 'Основные данные и контакты сотрудника',
      type: 'person-info',
      availableFor: [TreeItemType.PERSON],
    },
  ],
};

const WidgetPopup = forwardRef<HTMLDivElement, WidgetPopupProps>(
  ({ itemId, itemType, onAddWidget, onClose }, ref) => {
    const [isMobile, setIsMobile] = useState<boolean | null>(null);
    const [showPersonWidget, setShowPersonWidget] = useState(false);
    const [showStoreWidget, setShowStoreWidget] = useState(false);
    const [showPersonnelWidget, setShowPersonnelWidget] = useState(false);
    const [showStoreFinanceWidget, setShowStoreFinanceWidget] = useState(false);
    const [selectedHid, setSelectedHid] = useState<string>('');
    const [selectedItemName, setSelectedItemName] = useState<string>('');
    const [favoriteWidgets, setFavoriteWidgets] = useState<FavoriteWidget[]>([]);
    const popupRef = useRef<HTMLDivElement>(null);
    const widgetContainerRef = useRef<HTMLDivElement>(null);
    const [activeWidget, setActiveWidget] = useState<'person' | 'store' | 'personnel' | 'finance' | null>(null);
    const clickOriginRef = useRef<'popup' | 'widget' | 'outside' | null>(null);

    const availableWidgets = WIDGETS_BY_TYPE[itemType] || [];

    const treeItems = useAppSelector((state) => state.tree.items);

    useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };

      checkMobile();
      window.addEventListener('resize', checkMobile);

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

    const isWidgetFavorite = (widgetType: string): boolean => {
      return favoriteWidgets.some(fav =>
        fav.itemId === itemId && fav.type === widgetType,
      );
    };

    const toggleWidgetFavorite = (widgetType: string, e: React.MouseEvent) => {
      e.stopPropagation();

      const widget = availableWidgets.find(w => w.type === widgetType);
      if (!widget) return;

      const newFavorites = [...favoriteWidgets];
      const existingIndex = newFavorites.findIndex(
        fav => fav.itemId === itemId && fav.type === widgetType,
      );

      if (existingIndex > -1) {
        newFavorites.splice(existingIndex, 1);
      } else {
        let widgetTitle = widget.title;
        let storeName = '';
        let hid = '';

        if (itemType === TreeItemType.STORE) {
          const match = itemId.match(/\d+$/);
          hid = match ? match[0] : itemId;
        }

        if (widgetType === 'store-info' || widgetType === 'personnel-management' || widgetType === 'store-finance') {
          const findStoreInTree = (items: any[]): any => {
            for (const item of items) {
              if (item.id === itemId && item.type === TreeItemType.STORE) {
                return item;
              }
              if (item.children && item.children.length > 0) {
                const found = findStoreInTree(item.children);
                if (found) return found;
              }
            }
            return null;
          };

          const storeItem = findStoreInTree(treeItems);
          if (storeItem && storeItem.data && storeItem.data.storeName) {
            storeName = storeItem.data.storeName;
            widgetTitle = storeName;
          } else if (storeItem && storeItem.label) {
            storeName = storeItem.label;
            widgetTitle = storeItem.label;
          }
        } else if (widgetType === 'person-info') {
          const findPersonInTree = (items: any[]): any => {
            for (const item of items) {
              if (item.id === itemId && item.type === TreeItemType.PERSON) {
                return item;
              }
              if (item.children && item.children.length > 0) {
                const found = findPersonInTree(item.children);
                if (found) return found;
              }
            }
            return null;
          };

          const personItem = findPersonInTree(treeItems);
          if (personItem && personItem.data) {
            const firstName = personItem.data.firstName || '';
            const lastName = personItem.data.lastName || '';
            if (firstName || lastName) {
              widgetTitle = `${firstName} ${lastName}`.trim();
            }
          }
        }

        const newFavorite: FavoriteWidget = {
          id: `${itemId}-${widgetType}-${Date.now()}`,
          type: widgetType,
          title: widgetTitle,
          itemId,
          itemType,
          personName: widgetType === 'person-info' ? widgetTitle : undefined,
          position: widgetType === 'person-info' ? 'Сотрудник' : undefined,
          storeName: storeName || undefined,
          hid: hid || undefined,
          addedDate: new Date().toISOString(),
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

      setActiveWidget(null);

      setTimeout(() => {
        if (widgetType === 'person-info') {
          setActiveWidget('person');
        } else if (widgetType === 'store-info') {
          setActiveWidget('store');
        } else if (widgetType === 'personnel-management') {
          if (itemType === TreeItemType.STORE || itemType === TreeItemType.DEPARTMENT) {
            const hid = getHidFromItemId(itemId);
            const itemName = getItemNameFromTree(itemId);
            setSelectedHid(hid);
            setSelectedItemName(itemName);
            setActiveWidget('personnel');
          }
        } else if (widgetType === 'store-finance') {
          if (itemType === TreeItemType.STORE) {
            const hid = getHidFromItemId(itemId);
            const itemName = getItemNameFromTree(itemId);
            setSelectedHid(hid);
            setSelectedItemName(itemName);
            setActiveWidget('finance');
          }
        } else {
          onAddWidget(widgetType);
        }
      }, 50);
    };

    const handlePersonWidgetClose = () => {
      setShowPersonWidget(false);
    };

    const handleStoreWidgetClose = () => {
      setShowStoreWidget(false);
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

    const getHidFromItemId = (itemId: string): string => {
      const match = itemId.match(/\d+$/);
      if (match) {
        return match[0];
      }
      return itemId;
    };

    const getItemNameFromTree = (itemId: string): string => {
      const findItem = (items: any[]): any => {
        for (const item of items) {
          if (item.id === itemId) {
            return item;
          }
          if (item.children) {
            const found = findItem(item.children);
            if (found) return found;
          }
        }
        return null;
      };

      const item = findItem(treeItems);
      if (item) {
        if (item.type === TreeItemType.DEPARTMENT && item.data?.departmentName) {
          return item.data.departmentName;
        }
        if (item.type === TreeItemType.DEPARTMENT && item.data?.divisionName) {
          return item.data.divisionName;
        }
        return item.label || '';
      }
      return '';
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
          className={`${styles.popup} ${isMobile === null ? styles.hidden : isMobile ? styles.mobile : styles.desktop}`}
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
              <X size={18} />
            </button>
          </div>

          <div className={styles.content}>
            <div className={styles.grid}>
              {availableWidgets.map(widget => {
                const isFavorite = isWidgetFavorite(widget.type);
                return (
                  <div
                    key={widget.id}
                    className={`${styles.card}`}
                    onClick={(e) => handleWidgetClick(widget.type, e)}
                    data-testid={`widget-card-${widget.id}`}
                  >
                    <div className={styles.cardHeader}>
                      <h4>{widget.title}</h4>
                      <button
                        className={`${styles.favoriteButton} ${isFavorite ? styles.favorited : ''}`}
                        onClick={(e) => toggleWidgetFavorite(widget.type, e)}
                        aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
                        title={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
                      >
                        {isFavorite ? <StarOff size={14} /> : <Star size={14} />}
                      </button>
                    </div>
                    <p className={styles.description}>{widget.description}</p>
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

        {activeWidget === 'personnel' && createPortal(
          <div
            ref={widgetContainerRef}
            className={`${styles.personWidgetWrapper} ${styles[getWidgetPosition()]}`}
            onMouseDown={(e) => handleMouseDown(e, 'widget')}
            onClick={handleClick}
          >
            <PersonnelManagementWidget
              hid={selectedHid}
              itemName={selectedItemName}
              onClose={() => setActiveWidget(null)}
              isMobile={isMobile}
            />
          </div>,
          document.body,
        )}

        {activeWidget === 'person' && createPortal(
          <div
            ref={widgetContainerRef}
            className={`${styles.personWidgetWrapper} ${styles[getWidgetPosition()]}`}
            onMouseDown={(e) => handleMouseDown(e, 'widget')}
            onClick={handleClick}
          >
            <PersonInfoWidget
              itemId={itemId}
              onClose={() => setActiveWidget(null)}
              isMobile={isMobile}
            />
          </div>,
          document.body,
        )}

        {activeWidget === 'store' && createPortal(
          <div
            ref={widgetContainerRef}
            className={`${styles.personWidgetWrapper} ${styles[getWidgetPosition()]}`}
            onMouseDown={(e) => handleMouseDown(e, 'widget')}
            onClick={handleClick}
          >
            <StoreInfoWidget
              itemId={itemId}
              onClose={() => setActiveWidget(null)}
              isMobile={isMobile}
            />
          </div>,
          document.body,
        )}
        {activeWidget === 'finance' && createPortal(
          <div
            ref={widgetContainerRef}
            className={`${styles.personWidgetWrapper} ${styles[getWidgetPosition()]}`}
            onMouseDown={(e) => handleMouseDown(e, 'widget')}
            onClick={handleClick}
          >
            <StoreFinanceWidget
              hid={selectedHid}
              storeName={selectedItemName}
              onClose={() => setActiveWidget(null)}
              isMobile={isMobile}
            />
          </div>,
          document.body,
        )}
      </>
    );
  },
);

WidgetPopup.displayName = 'WidgetPopup';

export default WidgetPopup;