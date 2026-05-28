'use client';

import React, { useState } from 'react';
import { TreeItem, TreeItemType, DepartmentItem, DivisionItem } from '@/types/tree.types';
import { Building2, Users, Store, User, MapPin, ArrowLeft } from 'lucide-react';
import styles from './DepartmentsView.module.scss';

interface DepartmentsViewProps {
  items: TreeItem[];
}

const DEPARTMENT_ORDER = [
  'Департамент РАЗВИТИЯ',
  'Департамент ПЕРСОНАЛА',
  'Департамент МАРКЕТИНГА',
  'ФИНАНСОВЫЙ Департамент',
  'ИНЖЕНЕРНЫЙ Департамент',
  'Департамент ПРОДАЖ',
];

const getDepartmentIcon = (type: TreeItemType, divisionType?: string) => {
  if (divisionType === 'division') {
    return <Users size={32} className={styles.iconDivision} />;
  }
  switch (type) {
    case TreeItemType.COMPANY:
      return <Building2 size={32} className={styles.iconCompany} />;
    case TreeItemType.DEPARTMENT:
      return <Users size={32} className={styles.iconDepartment} />;
    case TreeItemType.STORE:
      return <Store size={32} className={styles.iconStore} />;
    case TreeItemType.PERSON:
      return <User size={32} className={styles.iconPerson} />;
    case TreeItemType.ADDRESS:
      return <MapPin size={32} className={styles.iconAddress} />;
    default:
      return <Building2 size={32} className={styles.iconCompany} />;
  }
};

const isDepartmentItem = (item: TreeItem): item is DepartmentItem => {
  return item.type === TreeItemType.DEPARTMENT &&
    !('divisionType' in item && (item as any).divisionType === 'division');
};

const isDivisionItem = (item: TreeItem): item is DivisionItem => {
  return item.type === TreeItemType.DEPARTMENT &&
    'divisionType' in item && (item as any).divisionType === 'division';
};

const sortDepartmentsByOrder = (departments: DepartmentItem[]): DepartmentItem[] => {
  return [...departments].sort((a, b) => {
    const indexA = DEPARTMENT_ORDER.indexOf(a.data.departmentName);
    const indexB = DEPARTMENT_ORDER.indexOf(b.data.departmentName);

    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.data.departmentName.localeCompare(b.data.departmentName);
  });
};

const DepartmentsView: React.FC<DepartmentsViewProps> = ({ items }) => {
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentItem | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<DivisionItem | null>(null);

  const departments: DepartmentItem[] = [];

  const extractDepartments = (treeItems: TreeItem[]) => {
    for (const item of treeItems) {
      if (isDepartmentItem(item)) {
        departments.push(item);
      }
      if (item.children && item.children.length > 0) {
        extractDepartments(item.children);
      }
    }
  };

  extractDepartments(items);

  const sortedDepartments = sortDepartmentsByOrder(departments);

  const getDivisionsForDepartment = (departmentId: string): DivisionItem[] => {
    const divisions: DivisionItem[] = [];

    const findDivisions = (treeItems: TreeItem[]) => {
      for (const item of treeItems) {
        if (isDivisionItem(item) && item.parentId === departmentId) {
          divisions.push(item);
        }
        if (item.children && item.children.length > 0) {
          findDivisions(item.children);
        }
      }
    };

    findDivisions(items);

    return divisions.sort((a, b) =>
      a.data.divisionName.localeCompare(b.data.divisionName)
    );
  };

  const handleDepartmentClick = (department: DepartmentItem) => {
    setSelectedDepartment(department);
    setSelectedDivision(null);
  };

  const handleDivisionClick = (division: DivisionItem) => {
    setSelectedDivision(division);
  };

  const handleBackToDepartments = () => {
    setSelectedDepartment(null);
    setSelectedDivision(null);
  };

  const handleBackToDivisions = () => {
    setSelectedDivision(null);
  };

  if (selectedDivision) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={"typeSelectorBackButtonGray"} onClick={handleBackToDivisions}>
            <ArrowLeft size={20} />
            <span>Назад</span>
          </button>
          <h2>{selectedDivision.data.divisionName}</h2>
        </div>
        <div className={styles.divisionInfo}>
          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>
              {getDepartmentIcon(TreeItemType.DEPARTMENT, 'division')}
            </div>
            <div className={styles.infoContent}>
              <p><strong>Описание:</strong> {selectedDivision.description || 'Нет описания'}</p>
              <p><strong>Количество сотрудников:</strong> {selectedDivision.data.employeeCount || 'Не указано'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Если выбран департамент - показываем список отделов
  if (selectedDepartment) {
    const divisions = getDivisionsForDepartment(selectedDepartment.id);

    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={"typeSelectorBackButtonGray"} onClick={handleBackToDepartments}>
            <ArrowLeft size={20} />
            <span>Назад</span>
          </button>
          <h2>{selectedDepartment.data.departmentName}</h2>
        </div>

        {divisions.length === 0 ? (
          <div className={styles.emptyState}>
            <p>В этом департаменте пока нет отделов</p>
          </div>
        ) : (
          <div className={styles.divisionsGrid}>
            {divisions.map(division => (
              <div
                key={division.id}
                className={styles.divisionCard}
                onClick={() => handleDivisionClick(division)}
              >
                <div className={styles.cardIcon}>
                  {getDepartmentIcon(TreeItemType.DEPARTMENT, 'division')}
                </div>
                <div className={styles.cardContent}>
                  <h3 className={styles.divisionName}>{division.data.divisionName}</h3>
                  <span className={styles.divisionType}>Отдел</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Показываем сетку департаментов
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
        <div
          key={department.id}
          className={styles.departmentCard}
          onClick={() => handleDepartmentClick(department)}
        >
          <div className={styles.cardIcon}>
            {getDepartmentIcon(department.type)}
          </div>
          <div className={styles.cardContent}>
            <h3 className={styles.departmentName}>{department.data.departmentName}</h3>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DepartmentsView;