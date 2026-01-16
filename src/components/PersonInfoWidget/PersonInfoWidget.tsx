'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TreeItemType, PersonItem } from '@/types/tree.types';
import {
  User,
  Edit2,
  Save,
  X,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  DollarSign,
  ArrowLeft,
  Check,
  RotateCcw,
  Star,
  StarOff,
} from 'lucide-react';
import styles from './PersonInfoWidget.module.scss';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { updatePersonData } from '@/store/slices/treeSlice';
import { useRouter } from 'next/navigation';

interface PersonInfoWidgetProps {
  itemId: string;
  onClose: () => void;
  isMobile?: boolean;
  showAddToFavorites?: boolean;
  onRemoveFromFavorites?: () => void;
}

const PersonInfoWidget: React.FC<PersonInfoWidgetProps> = ({
                                                             itemId,
                                                             onClose,
                                                             isMobile = false,
                                                             showAddToFavorites = true,
                                                             onRemoveFromFavorites,
                                                           }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<PersonItem['data']>({
    firstName: '',
    lastName: '',
    position: '',
    email: '',
    phone: '',
    hireDate: '',
    salary: 0,
    isManager: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const dispatch = useAppDispatch();
  const router = useRouter();
  const widgetRef = useRef<HTMLDivElement>(null);
  const treeItems = useAppSelector((state) => state.tree.items);

  // Проверяем, добавлен ли виджет в избранное
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const favorites = JSON.parse(localStorage.getItem('favorite-widgets') || '[]');
      setIsFavorite(favorites.some((fav: any) => fav.id === itemId && fav.type === 'person-info'));
    }
  }, [itemId]);

  // Находим данные о человеке в дереве
  const findPersonData = (): PersonItem['data'] | null => {
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
        firstName: personData.firstName || 'Не указано',
        lastName: personData.lastName || 'Не указано',
        position: personData.position || 'Сотрудник',
        email: personData.email || 'Не указано',
        phone: personData.phone || 'Не указано',
        hireDate: personData.hireDate || 'Не указано',
        salary: personData.salary || 0,
        isManager: personData.isManager || false,
      };
    }

    return null;
  };

  useEffect(() => {
    const savedWidgetData = localStorage.getItem(`person-widget-${itemId}`);
    const personData = findPersonData();

    if (savedWidgetData) {
      try {
        const parsedData = JSON.parse(savedWidgetData);
        setEditedData({
          firstName: parsedData.firstName || '',
          lastName: parsedData.lastName || '',
          position: parsedData.position || '',
          email: parsedData.email || '',
          phone: parsedData.phone || '',
          hireDate: parsedData.hireDate || '',
          salary: parsedData.salary || 0,
          isManager: parsedData.isManager || false,
        });
      } catch (error) {
        console.error('Error parsing saved widget data:', error);
        if (personData) {
          setEditedData(personData);
        }
      }
    } else if (personData) {
      setEditedData(personData);
    } else {
      setEditedData({
        firstName: 'Иван',
        lastName: 'Иванов',
        position: 'Сотрудник',
        email: 'ivanov@example.com',
        phone: '+7 (999) 123-45-67',
        hireDate: '2023-01-15',
        salary: 75000,
        isManager: false,
      });
    }
  }, [itemId, treeItems]);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);

    const dataToSave = {
      firstName: editedData.firstName || '',
      lastName: editedData.lastName || '',
      position: editedData.position || '',
      email: editedData.email || '',
      phone: editedData.phone || '',
      hireDate: editedData.hireDate || '',
      salary: editedData.salary || 0,
      isManager: editedData.isManager || false,
    };

    localStorage.setItem(`person-widget-${itemId}`, JSON.stringify(dataToSave));

    dispatch(updatePersonData({
      id: itemId,
      data: dataToSave,
    }));

    setTimeout(() => {
      setIsLoading(false);
      setIsEditing(false);
    }, 500);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
    const savedWidgetData = localStorage.getItem(`person-widget-${itemId}`);
    const personData = findPersonData();

    if (savedWidgetData) {
      try {
        const parsedData = JSON.parse(savedWidgetData);
        setEditedData({
          firstName: parsedData.firstName || '',
          lastName: parsedData.lastName || '',
          position: parsedData.position || '',
          email: parsedData.email || '',
          phone: parsedData.phone || '',
          hireDate: parsedData.hireDate || '',
          salary: parsedData.salary || 0,
          isManager: parsedData.isManager || false,
        });
      } catch (error) {
        if (personData) {
          setEditedData(personData);
        }
      }
    } else if (personData) {
      setEditedData(personData);
    }
  };

  const handleInputChange = (field: keyof PersonItem['data'], value: string | number | boolean) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBackClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();

    const favorites = JSON.parse(localStorage.getItem('favorite-widgets') || '[]');

    if (isFavorite) {
      // Удаляем из избранного
      const newFavorites = favorites.filter((fav: any) => !(fav.id === itemId && fav.type === 'person-info'));
      localStorage.setItem('favorite-widgets', JSON.stringify(newFavorites));
      setIsFavorite(false);

      // Вызываем callback если передан
      if (onRemoveFromFavorites) {
        onRemoveFromFavorites();
      }
    } else {
      // Добавляем в избранное
      const personData = findPersonData();
      const newFavorite = {
        id: itemId,
        type: 'person-info',
        title: 'Информация о сотруднике',
        personName: `${personData?.firstName || ''} ${personData?.lastName || ''}`.trim() || 'Сотрудник',
        position: personData?.position || 'Сотрудник',
        addedDate: new Date().toISOString(),
      };

      favorites.push(newFavorite);
      localStorage.setItem('favorite-widgets', JSON.stringify(favorites));
      setIsFavorite(true);
    }
  };

  const handleOpenInFavorites = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push('/favorites');
  };

  const handleWidgetClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isInteractive = target.tagName === 'BUTTON' ||
      target.tagName === 'INPUT' ||
      target.tagName === 'SELECT' ||
      target.tagName === 'A' ||
      target.closest('button') ||
      target.closest('input') ||
      target.closest('select');

    if (!isInteractive) {
      e.stopPropagation();
    }
  };

  const handleInputClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  useEffect(() => {
    const widgetElement = widgetRef.current;
    if (!widgetElement) return;

    const handleCaptureClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      const isInteractive = target.tagName === 'BUTTON' ||
        target.tagName === 'INPUT' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'A' ||
        target.closest('button') ||
        target.closest('input') ||
        target.closest('select');

      if (!isInteractive) {
        e.stopPropagation();
        e.stopImmediatePropagation?.();
      }
    };

    widgetElement.addEventListener('click', handleCaptureClick, true);
    widgetElement.addEventListener('mousedown', handleCaptureClick, true);

    return () => {
      widgetElement.removeEventListener('click', handleCaptureClick, true);
      widgetElement.removeEventListener('mousedown', handleCaptureClick, true);
    };
  }, []);

  const getFirstName = () => editedData.firstName || 'Не указано';
  const getLastName = () => editedData.lastName || 'Не указано';
  const getPosition = () => editedData.position || 'Не указано';
  const getEmail = () => editedData.email || 'Не указано';
  const getPhone = () => editedData.phone || 'Не указано';
  const getHireDate = () => editedData.hireDate || 'Не указано';
  const getSalary = () => editedData.salary || 0;
  const getIsManager = () => editedData.isManager || false;

  return (
    <div
      ref={widgetRef}
      className={`${styles.widget} ${isMobile ? styles.isMobile : ''}`}
      onClick={handleWidgetClick}
    >
      <div className={styles.header}>
        <div className={styles.titleSection}>
          {isMobile ? (
            <button
              className={styles.backButton}
              onClick={handleBackClick}
              aria-label="Назад к списку виджетов"
            >
              <ArrowLeft size={20} />
            </button>
          ) : (
            <div className={styles.icon}>
              <User size={20} />
            </div>
          )}
          <div>
            <h3>Информация о сотруднике</h3>
            <p className={styles.subtitle}>ID: {itemId}</p>
          </div>
        </div>
        <div className={styles.actions}>
          {!isEditing ? (
            <>
              <button
                className={styles.editButton}
                onClick={handleEdit}
                aria-label="Редактировать"
                title="Редактировать"
              >
                <Edit2 size={18} />
              </button>
              {!isMobile && (
                <button
                  className={styles.closeWidgetButton}
                  onClick={handleCloseClick}
                  aria-label="Закрыть виджет"
                  title="Закрыть"
                >
                  <X size={18} />
                </button>
              )}
            </>
          ) : (
            <>
              <button
                className={`${styles.actionButton} ${styles.saveButton}`}
                onClick={handleSave}
                disabled={isLoading}
                aria-label="Сохранить изменения"
                title={isLoading ? 'Сохранение...' : 'Сохранить изменения'}
              >
                <Check size={18} />
              </button>
              <button
                className={`${styles.actionButton} ${styles.cancelButton}`}
                onClick={handleCancel}
                disabled={isLoading}
                aria-label="Отменить редактирование"
                title="Отменить редактирование"
              >
                <RotateCcw size={18} />
              </button>
              {!isMobile && (
                <button
                  className={styles.closeWidgetButton}
                  onClick={handleCloseClick}
                  aria-label="Закрыть виджет"
                  title="Закрыть"
                >
                  <X size={18} />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Основная информация</h4>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Имя:</span>
              {isEditing ? (
                <input
                  type="text"
                  className={styles.input}
                  value={getFirstName()}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  onClick={handleInputClick}
                />
              ) : (
                <span className={styles.infoValue}>{getFirstName()}</span>
              )}
            </div>

            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Фамилия:</span>
              {isEditing ? (
                <input
                  type="text"
                  className={styles.input}
                  value={getLastName()}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  onClick={handleInputClick}
                />
              ) : (
                <span className={styles.infoValue}>{getLastName()}</span>
              )}
            </div>

            <div className={styles.infoItem}>
              <div className={styles.infoLabelWithIcon}>
                <Briefcase size={14} />
                <span>Должность:</span>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  className={styles.input}
                  value={getPosition()}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  onClick={handleInputClick}
                />
              ) : (
                <span className={styles.infoValue}>{getPosition()}</span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Контактная информация</h4>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <div className={styles.infoLabelWithIcon}>
                <Mail size={14} />
                <span>Email:</span>
              </div>
              {isEditing ? (
                <input
                  type="email"
                  className={styles.input}
                  value={getEmail()}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onClick={handleInputClick}
                />
              ) : (
                <span className={styles.infoValue}>{getEmail()}</span>
              )}
            </div>

            <div className={styles.infoItem}>
              <div className={styles.infoLabelWithIcon}>
                <Phone size={14} />
                <span>Телефон:</span>
              </div>
              {isEditing ? (
                <input
                  type="tel"
                  className={styles.input}
                  value={getPhone()}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  onClick={handleInputClick}
                />
              ) : (
                <span className={styles.infoValue}>{getPhone()}</span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Рабочая информация</h4>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <div className={styles.infoLabelWithIcon}>
                <Calendar size={14} />
                <span>Дата найма:</span>
              </div>
              {isEditing ? (
                <input
                  type="date"
                  className={styles.input}
                  value={getHireDate()}
                  onChange={(e) => handleInputChange('hireDate', e.target.value)}
                  onClick={handleInputClick}
                />
              ) : (
                <span className={styles.infoValue}>{getHireDate()}</span>
              )}
            </div>

            <div className={styles.infoItem}>
              <div className={styles.infoLabelWithIcon}>
                <DollarSign size={14} />
                <span>Зарплата:</span>
              </div>
              {isEditing ? (
                <input
                  type="number"
                  className={styles.input}
                  value={getSalary()}
                  onChange={(e) => handleInputChange('salary', Number(e.target.value) || 0)}
                  onClick={handleInputClick}
                />
              ) : (
                <span className={styles.infoValue}>
                  {new Intl.NumberFormat('ru-RU', {
                    style: 'currency',
                    currency: 'RUB',
                    minimumFractionDigits: 0,
                  }).format(getSalary())}
                </span>
              )}
            </div>

            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Менеджер:</span>
              {isEditing ? (
                <select
                  className={styles.select}
                  value={getIsManager().toString()}
                  onChange={(e) => handleInputChange('isManager', e.target.value === 'true')}
                  onClick={handleInputClick}
                >
                  <option value="false">Нет</option>
                  <option value="true">Да</option>
                </select>
              ) : (
                <span className={styles.infoValue}>
                  {getIsManager() ? 'Да' : 'Нет'}
                </span>
              )}
            </div>
          </div>
        </div>

      </div>

      <div className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.status}>
            {isEditing ? (
              <span className={styles.editingStatus}>Режим редактирования</span>
            ) : (
              <span className={styles.viewStatus}>Режим просмотра</span>
            )}
          </div>


        </div>
      </div>
    </div>
  );
};

export default PersonInfoWidget;