'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Star, StarOff, User, Building2, Users, Store, Trash2, ArrowLeft, X } from 'lucide-react';
import styles from './favorites.module.scss';
import PersonInfoWidget from '@/components/PersonInfoWidget/PersonInfoWidget';
import { useAppDispatch } from '@/store/hooks';
import { loadTreeData } from '@/store/slices/treeSlice';
import { createPortal } from 'react-dom';
import { useAppSelector } from '@/store/hooks';
import { TreeItemType, PersonItem } from '@/types/tree.types';

interface FavoriteWidget {
  id: string;
  type: 'person-info' | string;
  title: string;
  itemId: string;
  itemType: string;
  personName?: string;
  position?: string;
  firstName?: string;
  lastName?: string;
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

  const findPersonData = (itemId: string) => {
    const findItem = (items: any[]): any => {
      for (const item of items) {
        if (item.id === itemId && item.type === TreeItemType.PERSON) {
          return item.data || {};
        }
        if (item.children && item.children.length > 0) {
          const found = findItem(item.children);
          if (found) return found;
        }
      }
      return null;
    };

    const personData = findItem(treeItems);

    if (personData) {
      return {
        firstName: personData.firstName || '',
        lastName: personData.lastName || '',
        position: personData.position || 'Сотрудник'
      };
    }

    return null;
  };

  const loadFavorites = () => {
    try {
      const savedFavorites = localStorage.getItem('favorite-widgets');
      if (savedFavorites) {
        const favoritesData: FavoriteWidget[] = JSON.parse(savedFavorites);

        const enrichedFavorites = favoritesData.map(fav => {
          if (fav.type === 'person-info') {
            const personData = findPersonData(fav.itemId);
            if (personData) {
              return {
                ...fav,
                firstName: personData.firstName,
                lastName: personData.lastName,
                position: personData.position,
                personName: `${personData.firstName} ${personData.lastName}`.trim()
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
        return <User size={20} />;
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
        return <Star size={20} />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleBackClick = () => {
    router.push('/');
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
                setSelectedWidget(null); // Сбрасываем выбранный виджет
              } else {
                setSelectedWidget(null);
              }
            }}
            isMobile={isMobile}
            showAddToFavorites={true}
            onRemoveFromFavorites={handleRemoveFromFavorites}
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

  const renderCardInfo = (widget: FavoriteWidget) => {
    if (widget.type === 'person-info') {
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
          <div className={styles.personInfo}>
            {widget.firstName && widget.lastName && (
              <div className={styles.personName}>
                {widget.firstName} {widget.lastName}
              </div>
            )}
            {widget.position && (
              <div className={styles.personPosition}>
                {widget.position}
              </div>
            )}
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
        <div className={styles.widgetType}>
          <span className={styles.favoriteType}>{widget.type}</span>
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
            <p className={styles.subtitle}>
              {favorites.length === 0
                ? 'Нет избранных виджетов'
                : `Всего избранных виджетов: ${favorites.length}`
              }
            </p>
          </div>
        </header>

        <div className={styles.content}>
          <div className={styles.sidebar}>
            <h2>Список избранного</h2>
            {favorites.length === 0 ? (
              <div className={styles.emptyState}>
                <Star size={48} className={styles.emptyIcon} />
                <p>Вы еще не добавили ни одного виджета в избранное</p>
                <p className={styles.emptyHint}>
                  Нажмите на значок звездочки в виджете, чтобы добавить его сюда
                </p>
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
                    } ${fav.type === 'person-info' ? styles.personWidget : ''}`}
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
                  {/*<div className={styles.tip}>
                    <StarOff size={20} />
                    <span>Вы можете удалить виджет из избранного прямо из его интерфейса</span>
                  </div>*/}
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
              <h3>{selectedWidget.title}</h3>
            </div>
            <div className={styles.mobileWidgetContent}>
              {selectedWidget.type === 'person-info' ? (
                <PersonInfoWidget
                  itemId={selectedWidget.itemId}
                  onClose={handleCloseMobileWidget}
                  isMobile={true}
                  showAddToFavorites={true}
                  onRemoveFromFavorites={() => {
                    removeFromFavorites(selectedWidget.id);
                    handleCloseMobileWidget();
                  }}
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
        document.body
      )}
    </>
  );
};

export default FavoritesPage;