'use client';

import React, { useState } from 'react';
import { TreeItem, TreeItemType, DepartmentItem, DivisionItem, PersonItem } from '@/types/tree.types';
import { Building2, Users, User, ArrowLeft } from 'lucide-react';
import styles from './DepartmentsView.module.scss';

interface DepartmentsViewProps {
  items: TreeItem[];
}

type NavLevel =
  | { view: 'departments' }
  | { view: 'divisions'; department: DepartmentItem }
  | { view: 'employees'; title: string; nodeId: string; back: NavLevel };

const isDepartmentItem = (item: TreeItem): item is DepartmentItem =>
  item.type === TreeItemType.DEPARTMENT && (item as any).divisionType !== 'division';

const isDivisionItem = (item: TreeItem): item is DivisionItem =>
  item.type === TreeItemType.DEPARTMENT && (item as any).divisionType === 'division';

const findNode = (items: TreeItem[], id: string): TreeItem | undefined => {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.children) {
      const found = findNode(item.children, id);
      if (found) return found;
    }
  }
};

const getPersonChildren = (items: TreeItem[], nodeId: string): PersonItem[] => {
  const node = findNode(items, nodeId);
  return (node?.children?.filter(c => c.type === TreeItemType.PERSON) ?? []) as PersonItem[];
};

const DEPARTMENT_ORDER = [
  'Департамент РАЗВИТИЯ',
  'Департамент ПЕРСОНАЛА',
  'Департамент МАРКЕТИНГА',
  'ФИНАНСОВЫЙ Департамент',
  'ИНЖЕНЕРНЫЙ Департамент',
  'Департамент ПРОДАЖ',
  'Департамент ЗАКУПОК',
];

const DepartmentsView: React.FC<DepartmentsViewProps> = ({ items }) => {
  const [level, setLevel] = useState<NavLevel>({ view: 'departments' });

  // Руководство — первый элемент верхнего уровня с divisionType='division' и 'руководство' в названии
  const rukovodstvo = items.find(
    item => isDivisionItem(item) && item.label?.toLowerCase().includes('руководство'),
  ) as DivisionItem | undefined;

  // Все департаменты из дерева
  const departments: DepartmentItem[] = [];
  const extractDepts = (treeItems: TreeItem[]) => {
    for (const item of treeItems) {
      if (isDepartmentItem(item)) departments.push(item);
      if (item.children) extractDepts(item.children);
    }
  };
  extractDepts(items);

  const sortedDepts = [...departments].sort((a, b) => {
    const ia = DEPARTMENT_ORDER.indexOf(a.data.departmentName);
    const ib = DEPARTMENT_ORDER.indexOf(b.data.departmentName);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.data.departmentName.localeCompare(b.data.departmentName, 'ru');
  });

  // Отделы департамента
  const getDivisions = (deptId: string): DivisionItem[] => {
    const divs: DivisionItem[] = [];
    const find = (treeItems: TreeItem[]) => {
      for (const item of treeItems) {
        if (isDivisionItem(item) && item.parentId === deptId) divs.push(item);
        if (item.children) find(item.children);
      }
    };
    find(items);
    return divs.sort((a, b) => a.data.divisionName.localeCompare(b.data.divisionName, 'ru'));
  };

  // Карточка сотрудника
  const renderEmployee = (person: PersonItem) => {
    const name = [person.data.lastName, person.data.firstName, person.data.middleName]
      .filter(Boolean).join(' ') || person.label;
    return (
      <div key={person.id} className={styles.employeeCard}>
        <div className={styles.cardIcon}>
          <User size={28} className={styles.iconPerson} />
        </div>
        <div className={styles.cardContent}>
          <h3 className={styles.divisionName}>{name}</h3>
          {person.subLabel && (
            <span className={styles.divisionType}>{person.subLabel}</span>
          )}
        </div>
      </div>
    );
  };

  // --- Сотрудники ---
  if (level.view === 'employees') {
    const employees = getPersonChildren(items, level.nodeId);
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button className="typeSelectorBackButtonGray" onClick={() => setLevel(level.back)}>
            <ArrowLeft size={20} /><span>Назад</span>
          </button>
          <h2>{level.title}</h2>
        </div>
        {employees.length === 0 ? (
          <div className={styles.emptyState}>
            <User size={48} className={styles.emptyIcon} />
            <p>Сотрудников не найдено</p>
          </div>
        ) : (
          <div className={styles.divisionsGrid}>
            {employees.map(renderEmployee)}
          </div>
        )}
      </div>
    );
  }

  // --- Отделы департамента ---
  if (level.view === 'divisions') {
    const divisions = getDivisions(level.department.id);
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button className="typeSelectorBackButtonGray" onClick={() => setLevel({ view: 'departments' })}>
            <ArrowLeft size={20} /><span>Назад</span>
          </button>
          <h2>{level.department.data.departmentName}</h2>
        </div>
        {divisions.length === 0 ? (
          <div className={styles.emptyState}><p>В этом департаменте нет отделов</p></div>
        ) : (
          <div className={styles.divisionsGrid}>
            {divisions.map(div => (
              <div
                key={div.id}
                className={styles.divisionCard}
                onClick={() => setLevel({
                  view: 'employees',
                  title: div.data.divisionName,
                  nodeId: div.id,
                  back: level,
                })}
              >
                <div className={styles.cardIcon}>
                  <Users size={32} className={styles.iconDivision} />
                </div>
                <div className={styles.cardContent}>
                  <h3 className={styles.divisionName}>{div.data.divisionName}</h3>
                  <span className={styles.divisionType}>Отдел</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // --- Верхний уровень: Руководство + Департаменты ---
  if (departments.length === 0 && !rukovodstvo) {
    return (
      <div className={styles.emptyState}>
        <Building2 size={64} className={styles.emptyIcon} />
        <h3>Нет данных</h3>
        <p>Структура компании не загружена</p>
      </div>
    );
  }

  return (
    <div className={styles.departmentsGrid}>
      {rukovodstvo && (
        <div
          className={styles.departmentCard}
          onClick={() => setLevel({
            view: 'employees',
            title: rukovodstvo.data.divisionName,
            nodeId: rukovodstvo.id,
            back: { view: 'departments' },
          })}
        >
          <div className={styles.cardIcon}>
            <Building2 size={32} className={styles.iconCompany} />
          </div>
          <div className={styles.cardContent}>
            <h3 className={styles.departmentName}>{rukovodstvo.data.divisionName}</h3>
          </div>
        </div>
      )}
      {sortedDepts.map(dept => (
        <div
          key={dept.id}
          className={styles.departmentCard}
          onClick={() => setLevel({ view: 'divisions', department: dept })}
        >
          <div className={styles.cardIcon}>
            <Users size={32} className={styles.iconDepartment} />
          </div>
          <div className={styles.cardContent}>
            <h3 className={styles.departmentName}>{dept.data.departmentName}</h3>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DepartmentsView;
