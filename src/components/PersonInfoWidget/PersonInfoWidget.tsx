'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TreeItemType, PersonItem } from '@/types/tree.types';
import { User, Edit2, Save, X, Mail, Phone, Calendar, Briefcase, DollarSign, ArrowLeft, Check, RotateCcw } from 'lucide-react';
import styles from './PersonInfoWidget.module.scss';
import { useAppSelector } from '@/store/hooks';

interface PersonInfoWidgetProps {
  itemId: string;
  onClose: () => void;
  isMobile?: boolean;
}

const PersonInfoWidget: React.FC<PersonInfoWidgetProps> = ({
                                                             itemId,
                                                             onClose,
                                                             isMobile = false
                                                           }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    firstName: '',
    lastName: '',
    position: '',
    email: '',
    phone: '',
    hireDate: '',
    salary: 0,
    isManager: false
  });
  const [isLoading, setIsLoading] = useState(false);

  const widgetRef = useRef<HTMLDivElement>(null);

  const treeItems = useAppSelector((state) => state.tree.items);

  // Находим данные о человеке в дереве
  const findPersonData = () => {
    const findItem = (items: any[]): any => {
      for (const item of items) {
        if (item.id === itemId && item.type === TreeItemType.PERSON) {
          return item;
        }
        if (item.children && item.children.length > 0) {
          const found = findItem(item.children);
          if (found) return found;
        }
      }
      return null;
    };

    const personItem = findItem(treeItems);

    if (personItem) {
      return {
        firstName: personItem.data?.firstName || 'Не указано',
        lastName: personItem.data?.lastName || 'Не указано',
        position: personItem.data?.position || personItem.subLabel || 'Сотрудник',
        email: personItem.data?.email || 'Не указано',
        phone: personItem.data?.phone || 'Не указано',
        hireDate: personItem.data?.hireDate || 'Не указано',
        salary: personItem.data?.salary || 0,
        isManager: personItem.data?.isManager || false
      };
    }

    return null;
  };

  useEffect(() => {
    const savedData = localStorage.getItem(`person-widget-${itemId}`);
    if (savedData) {
      setEditedData(JSON.parse(savedData));
    } else {
      const personData = findPersonData();
      if (personData) {
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
          isManager: false
        });
      }
    }
  }, [itemId]);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);

    localStorage.setItem(`person-widget-${itemId}`, JSON.stringify(editedData));

    setTimeout(() => {
      setIsLoading(false);
      setIsEditing(false);
    }, 500);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
    const savedData = localStorage.getItem(`person-widget-${itemId}`);
    if (savedData) {
      setEditedData(JSON.parse(savedData));
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
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

  return (
    <div
      ref={widgetRef}
      className={styles.widget}
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
                  <X size={18}/>
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
                  <X size={18}/>
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
                  value={editedData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  onClick={handleInputClick}
                />
              ) : (
                <span className={styles.infoValue}>{editedData.firstName}</span>
              )}
            </div>

            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Фамилия:</span>
              {isEditing ? (
                <input
                  type="text"
                  className={styles.input}
                  value={editedData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  onClick={handleInputClick}
                />
              ) : (
                <span className={styles.infoValue}>{editedData.lastName}</span>
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
                  value={editedData.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  onClick={handleInputClick}
                />
              ) : (
                <span className={styles.infoValue}>{editedData.position}</span>
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
                  value={editedData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onClick={handleInputClick}
                />
              ) : (
                <span className={styles.infoValue}>{editedData.email}</span>
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
                  value={editedData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  onClick={handleInputClick}
                />
              ) : (
                <span className={styles.infoValue}>{editedData.phone}</span>
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
                  value={editedData.hireDate}
                  onChange={(e) => handleInputChange('hireDate', e.target.value)}
                  onClick={handleInputClick}
                />
              ) : (
                <span className={styles.infoValue}>{editedData.hireDate}</span>
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
                  value={editedData.salary}
                  onChange={(e) => handleInputChange('salary', Number(e.target.value))}
                  onClick={handleInputClick}
                />
              ) : (
                <span className={styles.infoValue}>
                  {new Intl.NumberFormat('ru-RU', {
                    style: 'currency',
                    currency: 'RUB',
                    minimumFractionDigits: 0
                  }).format(editedData.salary)}
                </span>
              )}
            </div>

            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Менеджер:</span>
              {isEditing ? (
                <select
                  className={styles.select}
                  value={editedData.isManager.toString()}
                  onChange={(e) => handleInputChange('isManager', e.target.value === 'true')}
                  onClick={handleInputClick}
                >
                  <option value="false">Нет</option>
                  <option value="true">Да</option>
                </select>
              ) : (
                <span className={styles.infoValue}>
                  {editedData.isManager ? 'Да' : 'Нет'}
                </span>
              )}
            </div>
          </div>
        </div>

        {isEditing && (
          <div className={styles.hint} onClick={handleInputClick}>
            <p>Изменения будут сохранены в localStorage</p>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.status}>
          {isEditing ? (
            <span className={styles.editingStatus}>Режим редактирования</span>
          ) : (
            <span className={styles.viewStatus}>Только просмотр</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonInfoWidget;