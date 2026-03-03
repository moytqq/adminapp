'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TreeItemType, PersonItem, DepartmentItem } from '@/types/tree.types';
import {
  User,
  Edit2,
  Save,
  X,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  BadgeRussianRuble,
  ArrowLeft,
  Check,
  RotateCcw,
  MapPin,
  Globe,
  FileText,
  Building2,
} from 'lucide-react';
import styles from './PersonInfoWidget.module.scss';
import { useAppSelector, useAppDispatch } from '@/store/hooks/hooks';
import { updatePersonData } from '@/store/slices/treeSlice';

interface PersonInfoWidgetProps {
  itemId: string;
  onClose: () => void;
  isMobile?: boolean | null;
  onRemoveFromFavorites?: () => void;
}

const PersonInfoWidget: React.FC<PersonInfoWidgetProps> = ({
                                                             itemId,
                                                             onClose,
                                                             isMobile = false,
                                                             onRemoveFromFavorites,
                                                           }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<PersonItem['data']>({
    firstName: '',
    lastName: '',
    middleName: '',
    position: '',
    email: '',
    phone: '',
    hireDate: '',
    salary: 0,
    isManager: false,
    birthDate: '',
    citizenship: '',
    registration: '',
    contractType: 'none',
    department: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useAppDispatch();
  const widgetRef = useRef<HTMLDivElement>(null);
  const treeItems = useAppSelector((state) => state.tree.items);

  const contractTypeLabels = {
    'employment': 'Трудовой договор',
    'gph': 'ГПХ',
    'patent': 'Патент',
    'none': 'Не зарегистрировано'
  };

  const findNearestDepartment = (personId: string): string | null => {
    const findParentDepartment = (items: any[], targetId: string): string | null => {
      const findPath = (items: any[], targetId: string, path: any[] = []): any[] | null => {
        for (const item of items) {
          const newPath = [...path, item];
          if (item.id === targetId) {
            return newPath;
          }
          if (item.children && item.children.length > 0) {
            const found = findPath(item.children, targetId, newPath);
            if (found) return found;
          }
        }
        return null;
      };

      const path = findPath(items, targetId);
      if (!path) return null;

      for (let i = path.length - 1; i >= 0; i--) {
        const item = path[i];
        if (item.type === TreeItemType.DEPARTMENT) {
          return (item as DepartmentItem).data?.departmentName || item.label || null;
        }
      }

      return null;
    };

    return findParentDepartment(treeItems, personId);
  };

  const findPersonData = (): PersonItem['data'] | null => {
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
    if (!personItem) return null;

    const personData = personItem.data || {};
    const nearestDepartment = findNearestDepartment(itemId);

    let firstName = personData.firstName || '';
    let lastName = personData.lastName || '';
    let middleName = personData.middleName || '';

    if (!firstName && !lastName && personItem.label) {
      const nameParts = personItem.label.split(' ');
      if (nameParts.length >= 2) {
        lastName = nameParts[0] || '';
        firstName = nameParts[1] || '';
        middleName = nameParts.slice(2).join(' ') || '';
      } else {
        firstName = personItem.label;
      }
    }

    return {
      firstName: firstName || '',
      lastName: lastName || '',
      middleName: middleName || '',
      position: personData.position || personItem.subLabel || personItem.description || '',
      email: personData.email || '',
      phone: personData.phone || '',
      hireDate: personData.hireDate || '',
      salary: personData.salary || 0,
      isManager: personData.isManager || false,
      birthDate: personData.birthDate || '',
      citizenship: personData.citizenship || '',
      registration: personData.registration || '',
      contractType: personData.contractType || 'none',
      department: personData.department || nearestDepartment || 'Менеджмент',
    };
  };

  useEffect(() => {
    const personData = findPersonData();

    if (personData) {
      setEditedData(personData);
    } else {
      setEditedData({
        firstName: 'Иван',
        lastName: 'Иванов',
        middleName: 'Иванович',
        position: 'Сотрудник',
        email: 'ivanov@example.com',
        phone: '+7 (999) 123-45-67',
        hireDate: '2023-01-15',
        salary: 75000,
        isManager: false,
        birthDate: '1990-05-15',
        citizenship: 'РФ',
        registration: 'г. Москва, ул. Ленина, д. 1, кв. 1',
        contractType: 'employment',
        department: 'Менеджмент',
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
      middleName: editedData.middleName || '',
      position: editedData.position || '',
      email: editedData.email || '',
      phone: editedData.phone || '',
      hireDate: editedData.hireDate || '',
      salary: editedData.salary || 0,
      isManager: editedData.isManager || false,
      birthDate: editedData.birthDate || '',
      citizenship: editedData.citizenship || '',
      registration: editedData.registration || '',
      contractType: editedData.contractType || 'none',
      department: editedData.department || '',
    };

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
    const personData = findPersonData();

    if (personData) {
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
  const getMiddleName = () => editedData.middleName || 'Не указано';
  const getFullName = () => {
    const parts = [
      editedData.firstName,
      editedData.lastName,
      editedData.middleName
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'Не указано';
  };
  const getPosition = () => editedData.position || 'Не указано';
  const getEmail = () => editedData.email || 'Не указано';
  const getPhone = () => editedData.phone || 'Не указано';
  const getHireDate = () => {
    if (!editedData.hireDate) return 'Не указано';
    try {
      return new Date(editedData.hireDate).toLocaleDateString('ru-RU');
    } catch {
      return editedData.hireDate;
    }
  };
  const getBirthDate = () => {
    if (!editedData.birthDate) return 'Не указано';
    try {
      return new Date(editedData.birthDate).toLocaleDateString('ru-RU');
    } catch {
      return editedData.birthDate;
    }
  };
  const getSalary = () => editedData.salary || 0;
  const getIsManager = () => editedData.isManager || false;
  const getCitizenship = () => editedData.citizenship || 'Не указано';
  const getRegistration = () => editedData.registration || 'Не указано';
  const getContractType = () => {
    const type = editedData.contractType || 'none';
    return contractTypeLabels[type as keyof typeof contractTypeLabels] || 'Не указано';
  };
  const getDepartment = () => editedData.department || 'Не указано';

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
        {/* Основная информация */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Основная информация</h4>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>ФИО:</span>
              {isEditing ? (
                <div className={styles.nameInputs}>
                  <input
                    type="text"
                    className={styles.input}
                    value={editedData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    onClick={handleInputClick}
                    placeholder="Фамилия"
                  />
                  <input
                    type="text"
                    className={styles.input}
                    value={editedData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    onClick={handleInputClick}
                    placeholder="Имя"
                  />
                  <input
                    type="text"
                    className={styles.input}
                    value={editedData.middleName}
                    onChange={(e) => handleInputChange('middleName', e.target.value)}
                    onClick={handleInputClick}
                    placeholder="Отчество"
                  />
                </div>
              ) : (
                <span className={styles.infoValue}>{getFullName()}</span>
              )}
            </div>

            <div className={styles.infoItem}>
              <div className={styles.infoLabelWithIcon}>
                <Calendar size={14} />
                <span>Дата рождения:</span>
              </div>
              {isEditing ? (
                <input
                  type="date"
                  className={styles.input}
                  value={editedData.birthDate || ''}
                  onChange={(e) => handleInputChange('birthDate', e.target.value)}
                  onClick={handleInputClick}
                />
              ) : (
                <span className={styles.infoValue}>{getBirthDate()}</span>
              )}
            </div>
          </div>
        </div>

        {/* Контактные данные */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Контактные данные</h4>
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

        {/* Рабочая информация */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Рабочая информация</h4>
          <div className={styles.infoGrid}>
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

            <div className={styles.infoItem}>
              <div className={styles.infoLabelWithIcon}>
                <Building2 size={14} />
                <span>Отдел:</span>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  className={styles.input}
                  value={getDepartment()}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  onClick={handleInputClick}
                />
              ) : (
                <span className={styles.infoValue}>{getDepartment()}</span>
              )}
            </div>

            <div className={styles.infoItem}>
              <div className={styles.infoLabelWithIcon}>
                <Calendar size={14} />
                <span>Дата трудоустройства:</span>
              </div>
              {isEditing ? (
                <input
                  type="date"
                  className={styles.input}
                  value={editedData.hireDate || ''}
                  onChange={(e) => handleInputChange('hireDate', e.target.value)}
                  onClick={handleInputClick}
                />
              ) : (
                <span className={styles.infoValue}>{getHireDate()}</span>
              )}
            </div>

            <div className={styles.infoItem}>
              <div className={styles.infoLabelWithIcon}>
                <Globe size={14} />
                <span>Гражданство:</span>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  className={styles.input}
                  value={getCitizenship()}
                  onChange={(e) => handleInputChange('citizenship', e.target.value)}
                  onClick={handleInputClick}
                  placeholder="РФ"
                />
              ) : (
                <span className={styles.infoValue}>{getCitizenship()}</span>
              )}
            </div>

            <div className={styles.infoItem}>
              <div className={styles.infoLabelWithIcon}>
                <MapPin size={14} />
                <span>Регистрация:</span>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  className={styles.input}
                  value={getRegistration()}
                  onChange={(e) => handleInputChange('registration', e.target.value)}
                  onClick={handleInputClick}
                  placeholder="Адрес регистрации"
                />
              ) : (
                <span className={styles.infoValue}>{getRegistration()}</span>
              )}
            </div>

            <div className={styles.infoItem}>
              <div className={styles.infoLabelWithIcon}>
                <FileText size={14} />
                <span>Тип отношений:</span>
              </div>
              {isEditing ? (
                <select
                  className={styles.select}
                  value={editedData.contractType || 'none'}
                  onChange={(e) => handleInputChange('contractType', e.target.value)}
                  onClick={handleInputClick}
                >
                  <option value="employment">Трудовой договор</option>
                  <option value="gph">ГПХ</option>
                  <option value="patent">Патент</option>
                  <option value="none">Не зарегистрировано</option>
                </select>
              ) : (
                <span className={styles.infoValue}>{getContractType()}</span>
              )}
            </div>

            {/*<div className={styles.infoItem}>
              <div className={styles.infoLabelWithIcon}>
                <BadgeRussianRuble size={14} />
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
            </div>*/}
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