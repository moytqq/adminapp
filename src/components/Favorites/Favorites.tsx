// components/Favorites/Favorites.tsx (обновленная версия)

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Star, User, Building2, Users, Store, Trash2, ArrowLeft, X, Briefcase, DollarSign } from 'lucide-react';
import styles from './Favorites.module.scss';
import PersonInfoWidget from '@/components/PersonInfoWidget/PersonInfoWidget';
import { useAppDispatch } from '@/store/hooks/hooks';
import { loadTreeData } from '@/store/slices/treeSlice';
import { createPortal } from 'react-dom';
import { useAppSelector } from '@/store/hooks/hooks';
import StoreInfoWidget from '@/components/StoreInfoWidget/StoreInfoWidget';
import PersonnelManagementWidget from '@/components/PersonnelManagementWidget/PersonnelManagementWidget';
import StoreFinanceWidget from '@/components/StoreFinanceWidget/StoreFinanceWidget';

interface FavoriteWidget {
  id: string;
  type: 'person-info' | 'store-info' | 'personnel-management' | 'store-finance' | string;
  title: string;
  itemId: string;
  itemType: string;
  personName?: string;
  position?: string;
  firstName?: string;
  lastName?: string;
  storeName?: string;
  hid?: string;
  addedDate: string;
}

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState<FavoriteWidget[]>([]);
  const [selectedWidget, setSelectedWidget] = useState<FavoriteWidget | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileWidget, setShowMobileWidget] = useState(false);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const mobileWidgetContainerRef = useRef<HTMLDivElement>(null);

  const treeItems = useAppSelector((state) => state.tree.items);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    const loadData = async () => {
      if (typeof window !== 'undefined') {
        const savedData = localStorage.getItem('company-tree-data');
        if (!savedData) {
          try {
            await dispatch(loadTreeData()).unwrap();
          } catch (error) {
            console.error('Failed to load tree data:', error);
          }
        }
      }
    };

    loadData();
    loadFavorites();

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [dispatch]);

  const findItemData = (itemId: string, type: string) => {
    const findItem = (items: any[]): any => {
      for (const item of items) {
        if (item.id === itemId) {
          return item;
        }
        if (item.children && item.children.length > 0) {
          const found = findItem(item.children);
          if (found) return found;
        }
      }
      return null;
    };

    const item = findItem(treeItems);

    if (item) {
      const itemData = item.data || {};

      if (type === 'person-info') {
        return {
          firstName: itemData.firstName || '',
          lastName: itemData.lastName || '',
          position: itemData.position || item.subLabel || 'Сотрудник',
          personName: `${itemData.firstName || ''} ${itemData.lastName || ''}`.trim() || item.label,
        };
      } else if (type === 'store-info' || type === 'personnel-management' || type === 'store-finance') {
        const match = item.id.match(/\d+$/);
        const hid = match ? match[0] : item.id;

        return {
          storeName: itemData.storeName || item.label || '',
          hid: hid,
        };
      }
    }

    return null;
  };

  const loadFavorites = () => {
    try {
      const savedFavorites = localStorage.getItem('favorite-widgets');
      if (savedFavorites) {
        const favoritesData: FavoriteWidget[] = JSON.parse(savedFavorites);

        const enrichedFavorites = favoritesData.map(fav => {
          const itemData = findItemData(fav.itemId, fav.type);

          if (itemData) {
            if (fav.type === 'person-info') {
              return {
                ...fav,
                firstName: itemData.firstName,
                lastName: itemData.lastName,
                position: itemData.position,
                personName: itemData.personName || fav.title,
                title: itemData.personName || fav.title,
              };
            } else if (fav.type === 'store-info' || fav.type === 'personnel-management' || fav.type === 'store-finance') {
              return {
                ...fav,
                storeName: itemData.storeName,
                hid: itemData.hid,
                title: itemData.storeName || fav.title,
              };
            }
          }
          return fav;
        });

        setFavorites(enrichedFavorites);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  useEffect(() => {
    if (treeItems.length > 0) {
      loadFavorites();
    }
  }, [treeItems]);

  useEffect(() => {
    if (!showMobileWidget || !isMobile) return;

    const handleClickOutside = (event: MouseEvent) => {
      const mobileWidget = mobileWidgetContainerRef.current;
      if (mobileWidget && !mobileWidget.contains(event.target as Node)) {
        handleCloseMobileWidget();
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMobileWidget, isMobile]);

  const removeFromFavorites = (favoriteId: string) => {
    const newFavorites = favorites.filter(fav => fav.id !== favoriteId);
    setFavorites(newFavorites);
    localStorage.setItem('favorite-widgets', JSON.stringify(newFavorites));

    if (selectedWidget?.id === favoriteId) {
      setSelectedWidget(null);
      setShowMobileWidget(false);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'person-info':
        return (
          <div className={styles.favoriteIconPerson}>
            <User size={20} />
          </div>
        );
      case 'store-info':
        return (
          <div className={styles.favoriteIconStore}>
            <Store size={20} />
          </div>
        );
      case 'personnel-management':
        return (
          <div className={styles.favoriteIconPersonnel}>
            <Briefcase size={20} />
          </div>
        );
      case 'store-finance':
        return (
          <div className={styles.favoriteIconFinance}>
            <DollarSign size={20} />
          </div>
        );
      case 'finance':
      case 'kpi':
        return <Building2 size={20} />;
      case 'employees':
      case 'budget':
      case 'performance':
      case 'projects':
      case 'tasks':
        return <Users size={20} />;
      case 'sales':
      case 'inventory':
      case 'schedule':
      case 'reviews':
      case 'map':
        return <Store size={20} />;
      default:
        return (
          <div className={styles.favoriteIconDefault}>
            <Star size={20} />
          </div>
        );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleBackClick = () => {
    router.push('/main');
  };

  const handleWidgetSelect = (widget: FavoriteWidget) => {
    setSelectedWidget(widget);
    if (isMobile) {
      setShowMobileWidget(true);
    }
  };

  const handleCloseMobileWidget = () => {
    setShowMobileWidget(false);
    setSelectedWidget(null);
  };

  const handleRemoveFromFavorites = () => {
    if (selectedWidget) {
      removeFromFavorites(selectedWidget.id);
      setSelectedWidget(null);
      setShowMobileWidget(false);
    }
  };

  const renderWidgetContent = (widget: FavoriteWidget) => {
    if (widget.type === 'person-info') {
      return (
        <div className={`${styles.personWidgetContainer} ${styles.wide}`}>
          <PersonInfoWidget
            itemId={widget.itemId}
            onClose={() => {
              if (isMobile) {
                setShowMobileWidget(false);
                setSelectedWidget(null);
              } else {
                setSelectedWidget(null);
              }
            }}
            isMobile={isMobile}
            onRemoveFromFavorites={handleRemoveFromFavorites}
          />
        </div>
      );
    }

    if (widget.type === 'store-info') {
      return (
        <div className={`${styles.personWidgetContainer} ${styles.wide}`}>
          <StoreInfoWidget
            itemId={widget.itemId}
            onClose={() => {
              if (isMobile) {
                setShowMobileWidget(false);
                setSelectedWidget(null);
              } else {
                setSelectedWidget(null);
              }
            }}
            isMobile={isMobile}
            onRemoveFromFavorites={handleRemoveFromFavorites}
          />
        </div>
      );
    }

    if (widget.type === 'personnel-management') {
      return (
        <div className={`${styles.personWidgetContainer} ${styles.wide}`}>
          <PersonnelManagementWidget
            hid={widget.hid || ''}
            itemName={widget.storeName}
            onClose={() => {
              if (isMobile) {
                setShowMobileWidget(false);
                setSelectedWidget(null);
              } else {
                setSelectedWidget(null);
              }
            }}
            isMobile={isMobile}
          />
        </div>
      );
    }

    if (widget.type === 'store-finance') {
      return (
        <div className={`${styles.personWidgetContainer} ${styles.wide}`}>
          <StoreFinanceWidget
            hid={widget.hid || ''}
            storeName={widget.storeName}
            onClose={() => {
              if (isMobile) {
                setShowMobileWidget(false);
                setSelectedWidget(null);
              } else {
                setSelectedWidget(null);
              }
            }}
            isMobile={isMobile}
          />
        </div>
      );
    }

    return (
      <div className={`${styles.widgetPlaceholder} ${styles.wide}`}>
        <h3>{widget.title}</h3>
        <p>Виджет находится в разработке</p>
        <div className={styles.placeholderInfo}>
          <p><strong>ID элемента:</strong> {widget.itemId}</p>
          <p><strong>Тип элемента:</strong> {widget.itemType}</p>
          <p><strong>Тип виджета:</strong> {widget.type}</p>
        </div>
      </div>
    );
  };

  const getWidgetNameByType = (type: string) => {
    switch (type) {
      case 'personnel-management': return 'Сотрудники';
      case 'store-finance': return 'Финансовая аналитика';
      default: return 'Информация';
    }
  }
  const getObjectNameByWidgetType = (type: string) => {
    switch (type) {
      case 'person-info': return 'Сотрудник';
      default: return 'Магазин';
    }
  }

  const renderCardInfo = (widget: FavoriteWidget) => {

    if (widget.type === 'person-info' || widget.type === 'store-info' || widget.type === 'personnel-management' || widget.type === 'store-finance') {
      return (
        <>
          <div className={styles.cardTitleRow}>
            <div className={styles.widgetTypeBadge}>
              {getWidgetNameByType(widget.type)}
            </div>
            <button
              className={styles.removeButton}
              onClick={(e) => {
                e.stopPropagation();
                removeFromFavorites(widget.id);
              }}
              aria-label="Удалить из избранного"
              title="Удалить из избранного"
            >
              <Trash2 size={16} />
            </button>
          </div>
          <div className={styles.cardTitleRow}>
            <h3>{widget.title}</h3>
          </div>
          <div className={styles.personInfo}>
            <div className={styles.personPosition}>
              {getObjectNameByWidgetType(widget.type)}
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <div className={styles.cardTitleRow}>
          <h3>{widget.title}</h3>
          <button
            className={styles.removeButton}
            onClick={(e) => {
              e.stopPropagation();
              removeFromFavorites(widget.id);
            }}
            aria-label="Удалить из избранного"
            title="Удалить из избранного"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </>
    );
  };

  return (
    <>
      <div className={styles.container}>
        <header className={styles.header}>
          <button className={styles.backButton} onClick={handleBackClick}>
            <ArrowLeft size={20} />
            <span>Назад к дереву</span>
          </button>
          <div className={styles.headerContent}>
            <h1>
              <Star size={24} />
              Избранные виджеты
            </h1>
            <span className={styles.subtitle}>
              {favorites.length === 0
                ? 'Нет избранных виджетов'
                : `Всего избранных виджетов: ${favorites.length}`
              }
            </span>
          </div>
        </header>

        <div className={styles.content}>
          <div className={styles.sidebar}>
            <h2>Список избранного</h2>
            {favorites.length === 0 ? (
              <div className={styles.emptyState}>
                <Star size={48} className={styles.emptyIcon} />
                <p>Вы еще не добавили ни одного виджета в избранное</p>
              </div>
            ) : (
              <div className={styles.favoritesList}>
                {favorites.map(fav => (
                  <div
                    key={fav.id}
                    className={`${styles.favoriteItem} ${
                      (!isMobile && selectedWidget?.id === fav.id) ||
                      (isMobile && showMobileWidget && selectedWidget?.id === fav.id)
                        ? styles.selected
                        : ''
                    } ${
                      fav.type === 'person-info' ? styles.personWidget :
                        fav.type === 'store-info' ? styles.storeWidget :
                          fav.type === 'personnel-management' ? styles.personnelWidget :
                            fav.type === 'store-finance' ? styles.financeWidget : ''
                    }`}
                    onClick={() => handleWidgetSelect(fav)}
                  >
                    <div className={styles.favoriteHeader}>
                      <div className={styles.favoriteIcon}>
                        {getIconForType(fav.type)}
                      </div>
                      <div className={styles.favoriteInfo}>
                        {renderCardInfo(fav)}
                      </div>
                    </div>
                    <div className={styles.favoriteFooter}>
                      <span className={styles.addedDate}>
                        Добавлено: {formatDate(fav.addedDate)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={`${styles.mainContent} ${isMobile ? styles.mobileHidden : ''}`}>
            {selectedWidget ? (
              <>
                <div className={styles.widgetHeader}>
                  <h2>
                    {selectedWidget.title}
                    {selectedWidget.type === 'personnel-management' && ' - Сотрудники и позиции'}
                    {selectedWidget.type === 'store-finance' && ' - Финансовая аналитика'}
                  </h2>
                  <button
                    className={styles.closeWidgetButton}
                    onClick={() => {
                      setSelectedWidget(null);
                      if (isMobile) {
                        setShowMobileWidget(false);
                      }
                    }}
                    aria-label="Закрыть виджет"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className={styles.widgetContent}>
                  {renderWidgetContent(selectedWidget)}
                </div>
              </>
            ) : (
              <div className={styles.selectionPrompt}>
                <Star size={64} className={styles.promptIcon} />
                <h2>Выберите виджет</h2>
                <p>Выберите виджет из списка слева, чтобы просмотреть его содержимое</p>
                <div className={styles.promptTips}>
                  <div className={styles.tip}>
                    <Trash2 size={20} />
                    <span>Нажмите на значок корзины, чтобы удалить виджет из избранного</span>
                  </div>
                  <div className={styles.tip}>
                    <User size={20} />
                    <span>Виджеты с информацией о сотрудниках поддерживают редактирование</span>
                  </div>
                  <div className={styles.tip}>
                    <Briefcase size={20} />
                    <span>Виджеты управления персоналом и финансовой аналитики доступны для магазинов</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isMobile && showMobileWidget && selectedWidget && createPortal(
        <div className={styles.mobileWidgetOverlay}>
          <div
            ref={mobileWidgetContainerRef}
            className={styles.mobileWidgetContainer}
          >
            <div className={styles.mobileWidgetHeader}>
              <button
                className={styles.mobileCloseButton}
                onClick={handleCloseMobileWidget}
                aria-label="Закрыть"
              >
                <X size={24} />
              </button>
              <h3>
                {selectedWidget.title}
                {selectedWidget.type === 'personnel-management' && ' - Сотрудники'}
                {selectedWidget.type === 'store-finance' && ' - Финансы'}
              </h3>
            </div>
            <div className={styles.mobileWidgetContent}>
              {selectedWidget.type === 'person-info' ? (
                <PersonInfoWidget
                  itemId={selectedWidget.itemId}
                  onClose={handleCloseMobileWidget}
                  isMobile={true}
                  onRemoveFromFavorites={() => {
                    removeFromFavorites(selectedWidget.id);
                    handleCloseMobileWidget();
                  }}
                />
              ) : selectedWidget.type === 'store-info' ? (
                <StoreInfoWidget
                  itemId={selectedWidget.itemId}
                  onClose={handleCloseMobileWidget}
                  isMobile={true}
                  onRemoveFromFavorites={() => {
                    removeFromFavorites(selectedWidget.id);
                    handleCloseMobileWidget();
                  }}
                />
              ) : selectedWidget.type === 'personnel-management' ? (
                <PersonnelManagementWidget
                  hid={selectedWidget.hid || ''}
                  itemName={selectedWidget.storeName}
                  onClose={handleCloseMobileWidget}
                  isMobile={true}
                />
              ) : selectedWidget.type === 'store-finance' ? (
                <StoreFinanceWidget
                  hid={selectedWidget.hid || ''}
                  storeName={selectedWidget.storeName}
                  onClose={handleCloseMobileWidget}
                  isMobile={true}
                />
              ) : (
                <div className={styles.mobileWidgetPlaceholder}>
                  <h3>{selectedWidget.title}</h3>
                  <p>Виджет находится в разработке</p>
                  <div className={styles.mobilePlaceholderInfo}>
                    <p><strong>ID элемента:</strong> {selectedWidget.itemId}</p>
                    <p><strong>Тип элемента:</strong> {selectedWidget.itemType}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
};

export default FavoritesPage;