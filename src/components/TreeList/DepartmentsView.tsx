'use client';

import React from 'react';
import { TreeItem as TreeItemType, TreeItemType as ItemType } from '@/types/tree.types';
import { Building2, Users, Store, User, MapPin } from 'lucide-react';
import styles from './DepartmentsView.module.scss';

interface DepartmentsViewProps {
  items: TreeItemType[];
}

const getDepartmentIcon = (type: ItemType) => {
  switch (type) {
    case ItemType.COMPANY:
      return <Building2 size={32} className={styles.iconCompany} />;
    case ItemType.DEPARTMENT:
      return <Users size={32} className={styles.iconDepartment} />;
    case ItemType.STORE:
      return <Store size={32} className={styles.iconStore} />;
    case ItemType.PERSON:
      return <User size={32} className={styles.iconPerson} />;
    case ItemType.ADDRESS:
      return <MapPin size={32} className={styles.iconAddress} />;
    default:
      return <Building2 size={32} className={styles.iconCompany} />;
  }
};

const getDepartmentTypeName = (type: ItemType): string => {
  switch (type) {
    case ItemType.COMPANY:
      return 'Компания';
    case ItemType.DEPARTMENT:
      return 'Департамент';
    case ItemType.STORE:
      return 'Магазин';
    case ItemType.PERSON:
      return 'Сотрудник';
    case ItemType.ADDRESS:
      return 'Адрес';
    default:
      return 'Другое';
  }
};

const extractNumericId = (id: string): number => {
  const match = id.match(/\d+$/);
  return match ? parseInt(match[0], 10) : 0;
};

const DepartmentsView: React.FC<DepartmentsViewProps> = ({ items }) => {
  const departments: TreeItemType[] = [];

  const extractDepartments = (treeItems: TreeItemType[]) => {
    for (const item of treeItems) {
      if (item.type === ItemType.DEPARTMENT) {
        departments.push(item);
      }
      if (item.children && item.children.length > 0) {
        extractDepartments(item.children);
      }
    }
  };

  extractDepartments(items);

  const sortedDepartments = [...departments].sort((a, b) => {
    const idA = extractNumericId(a.id);
    const idB = extractNumericId(b.id);
    return idA - idB;
  });

  if (sortedDepartments.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Building2 size={64} className={styles.emptyIcon} />
        <h3>Нет департаментов</h3>
        <p>В данных не найдено департаментов</p>
      </div>
    );
  }

  return (
    <div className={styles.departmentsGrid}>
      {sortedDepartments.map(department => (
        <div key={department.id} className={styles.departmentCard}>
          <div className={styles.cardIcon}>
            {getDepartmentIcon(department.type)}
          </div>
          <div className={styles.cardContent}>
            <h3 className={styles.departmentName}>{department.label}</h3>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DepartmentsView;