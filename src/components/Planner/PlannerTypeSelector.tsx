'use client';

import React from 'react';
import styles from './PlannerTypeSelector.module.scss';
import {
  Calendar,
  CalendarDays,
  CalendarRange,
  ListTodo,
  Clock,
  AlertCircle,
  CheckCircle2,
  CalendarClock,
  CalendarCheck,
  CalendarX,
} from 'lucide-react';

export interface PlannerType {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface PlannerTypeSelectorProps {
  onSelectType: (typeId: string) => void;
}

const plannerTypes: PlannerType[] = [
  {
    id: 'tasks',
    title: 'Задачи',
    description: 'Задачи',
    icon: <ListTodo size={32} />,
    color: '#2196f3',
    bgColor: '#e3f2fd',
  },
  {
    id: 'meetings',
    title: 'Встречи',
    description: 'Встречи',
    icon: <CalendarDays size={32} />,
    color: '#4caf50',
    bgColor: '#e8f5e9',
  },
  {
    id: 'reports',
    title: 'Отчёты',
    description: 'Отчёты',
    icon: <CalendarRange size={32} />,
    color: '#ff9800',
    bgColor: '#fff3e0',
  },
  {
    id: 'kpiWeek',
    title: 'KPI неделя',
    description: 'KPI неделя',
    icon: <Clock size={32} />,
    color: '#f44336',
    bgColor: '#ffebee',
  },
  {
    id: 'kpiToday',
    title: 'KPI сегодня',
    description: 'KPI сегодня',
    icon: <AlertCircle size={32} />,
    color: '#9c27b0',
    bgColor: '#f3e5f5',
  },
  /*{
    id: 'completed',
    title: 'Выполненные',
    description: 'Архив выполненных задач',
    icon: <CheckCircle2 size={32} />,
    color: '#e91e63',
    bgColor: '#fce4ec',
  },
  {
    id: 'upcoming',
    title: 'Предстоящие',
    description: 'Ближайшие задачи и события',
    icon: <CalendarClock size={32} />,
    color: '#00bcd4',
    bgColor: '#e0f7fa',
  },
  {
    id: 'overdue',
    title: 'Просроченные',
    description: 'Задачи с истекшим сроком',
    icon: <CalendarX size={32} />,
    color: '#795548',
    bgColor: '#efebe9',
  },
  {
    id: 'calendar',
    title: 'Календарь',
    description: 'Общий календарь событий',
    icon: <Calendar size={32} />,
    color: '#607d8b',
    bgColor: '#eceff1',
  }*/
];

const PlannerTypeSelector: React.FC<PlannerTypeSelectorProps> = ({ onSelectType }) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Планировщик</h1>
        <p>Выберите тип планирования</p>
      </div>
      <div className={styles.grid}>
        {plannerTypes.map(type => (
          <button
            key={type.id}
            className={styles.card}
            onClick={() => onSelectType(type.id)}
            style={{ backgroundColor: type.bgColor }}
          >
            <div className={styles.iconWrapper} style={{ color: type.color }}>
              {type.icon}
            </div>
            <h3 className={styles.title}>{type.title}</h3>
            <p className={styles.description}>{type.description}</p>
            <div className={styles.arrow}>→</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PlannerTypeSelector;