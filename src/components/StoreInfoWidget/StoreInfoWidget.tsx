'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TreeItemType, StoreItem } from '@/types/tree.types';
import {
  Store,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Users,
  BadgeRussianRuble,
  Edit2,
  X,
  ArrowLeft,
  Check,
  RotateCcw,
} from 'lucide-react';
import styles from './StoreInfoWidget.module.scss';
import { updateItem } from '@/store/slices/treeSlice';
import { useAppSelector, useAppDispatch } from '@/store/hooks';

interface StoreInfoWidgetProps {
  itemId: string;
  onClose: () => void;
  isMobile?: boolean | null;
  onRemoveFromFavorites?: () => void;
}

const StoreInfoWidget: React.FC<StoreInfoWidgetProps> = ({
                                                           itemId,
                                                           onClose,
                                                           isMobile = false,
                                                           onRemoveFromFavorites,
                                                         }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<StoreItem['data']>({
    storeName: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    revenue: 0,
    employeeCount: 0,
    openingDate: '',
    originalIds: [],
    departmentNames: []
  });
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useAppDispatch();
  const widgetRef = useRef<HTMLDivElement>(null);
  const treeItems = useAppSelector((state) => state.tree.items);

  const findStoreData = (): StoreItem['data'] | null => {
    const findItem = (items: any[]): any => {
      for (const item of items) {
        if (item.id === itemId && item.type === TreeItemType.STORE) {
          return item.data || {};
        }
        if (item.children && item.children.length > 0) {
          const found = findItem(item.children);
          if (found) return found;
        }
      }
      return null;
    };

    const storeData = findItem(treeItems);

    if (storeData) {
      return {
        storeName: storeData.storeName || '',
        description: storeData.description || '',
        address: storeData.address || '',
        phone: storeData.phone || '',
        email: storeData.email || '',
        revenue: storeData.revenue || 0,
        employeeCount: storeData.employeeCount || 0,
        openingDate: storeData.openingDate || '',
        originalIds: storeData.originalIds || [],
        departmentNames: storeData.departmentNames || [],
      };
    }

    return null;
  };

  useEffect(() => {
    const storeData = findStoreData();

    if (storeData) {
      setEditedData(storeData);
    } else {
      setEditedData({
        storeName: 'Магазин',
        description: 'Описание магазина',
        address: 'Адрес не указан',
        phone: '+7 (999) 000-00-00',
        email: 'store@example.com',
        revenue: 1000000,
        employeeCount: 10,
        openingDate: '2023-01-01',
        originalIds: [],
        departmentNames: ['Отдел 1', 'Отдел 2'],
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
      storeName: editedData.storeName || '',
      description: editedData.description || '',
      address: editedData.address || '',
      phone: editedData.phone || '',
      email: editedData.email || '',
      revenue: editedData.revenue || 0,
      employeeCount: editedData.employeeCount || 0,
      openingDate: editedData.openingDate || '',
      originalIds: editedData.originalIds || [],
      departmentNames: editedData.departmentNames || [],
    };

    dispatch(updateItem({
      id: itemId,
      updates: {
        data: dataToSave,
        label: dataToSave.storeName,
      },
    }));

    setTimeout(() => {
      setIsLoading(false);
      setIsEditing(false);
    }, 500);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
    const savedWidgetData = localStorage.getItem(`store-widget-${itemId}`);
    const storeData = findStoreData();

    if (savedWidgetData) {
      try {
        const parsedData = JSON.parse(savedWidgetData);
        setEditedData(parsedData);
      } catch (error) {
        if (storeData) {
          setEditedData(storeData);
        }
      }
    } else if (storeData) {
      setEditedData(storeData);
    }
  };

  const handleInputChange = (field: keyof StoreItem['data'], value: string | number | string[]) => {
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

  const getStoreName = () => editedData.storeName || 'Не указано';
  const getDescription = () => editedData.description || 'Не указано';
  const getAddress = () => editedData.address || 'Не указано';
  const getPhone = () => editedData.phone || 'Не указано';
  const getEmail = () => editedData.email || 'Не указано';
  const getRevenue = () => editedData.revenue || 0;
  const getEmployeeCount = () => editedData.employeeCount || 0;
  const getOpeningDate = () => editedData.openingDate || 'Не указано';
  const getDepartmentNames = () => editedData.departmentNames || [];

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
              <Store size={20} />
            </div>
          )}
          <div>
            <h3>Информация о магазине</h3>
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
              <span className={styles.infoLabel}>Название:</span>
              {isEditing ? (
                <input
                  type="text"
                  className={styles.input}
                  value={getStoreName()}
                  onChange={(e) => handleInputChange('storeName', e.target.value)}
                  onClick={handleInputClick}
                />
              ) : (
                <span className={styles.infoValue}>{getStoreName()}</span>
              )}
            </div>

            <div className={styles.infoItem}>
              <div className={styles.infoLabelWithIcon}>
                <MapPin size={14} />
                <span>Адрес:</span>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  className={styles.input}
                  value={getAddress()}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  onClick={handleInputClick}
                />
              ) : (
                <span className={styles.infoValue}>{getAddress()}</span>
              )}
            </div>

            <div className={styles.infoItem}>
              <div className={styles.infoLabelWithIcon}>
                <Calendar size={14} />
                <span>Дата открытия:</span>
              </div>
              {isEditing ? (
                <input
                  type="date"
                  className={styles.input}
                  value={getOpeningDate()}
                  onChange={(e) => handleInputChange('openingDate', e.target.value)}
                  onClick={handleInputClick}
                />
              ) : (
                <span className={styles.infoValue}>{getOpeningDate()}</span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Контактная информация</h4>
          <div className={styles.infoGrid}>
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
          </div>
        </div>

        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Бизнес-информация</h4>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <div className={styles.infoLabelWithIcon}>
                <BadgeRussianRuble size={14} />
                <span>Выручка:</span>
              </div>
              {isEditing ? (
                <input
                  type="number"
                  className={styles.input}
                  value={getRevenue()}
                  onChange={(e) => handleInputChange('revenue', Number(e.target.value) || 0)}
                  onClick={handleInputClick}
                />
              ) : (
                <span className={styles.infoValue}>
                  {new Intl.NumberFormat('ru-RU', {
                    style: 'currency',
                    currency: 'RUB',
                    minimumFractionDigits: 0,
                  }).format(getRevenue())}
                </span>
              )}
            </div>

            <div className={styles.infoItem}>
              <div className={styles.infoLabelWithIcon}>
                <Users size={14} />
                <span>Сотрудников:</span>
              </div>
              {isEditing ? (
                <input
                  type="number"
                  className={styles.input}
                  value={getEmployeeCount()}
                  onChange={(e) => handleInputChange('employeeCount', Number(e.target.value) || 0)}
                  onClick={handleInputClick}
                />
              ) : (
                <span className={styles.infoValue}>{getEmployeeCount()}</span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Дополнительная информация</h4>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Описание:</span>
              {isEditing ? (
                <textarea
                  className={styles.textarea}
                  value={getDescription()}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  onClick={handleInputClick}
                  rows={3}
                />
              ) : (
                <span className={styles.infoValue}>{getDescription()}</span>
              )}
            </div>

            {getDepartmentNames().length > 0 && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Отделы:</span>
                <div className={styles.departmentList}>
                  {getDepartmentNames().map((dept, index) => (
                    <span key={index} className={styles.departmentTag}>
                      {dept}
                    </span>
                  ))}
                </div>
              </div>
            )}
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

export default StoreInfoWidget;