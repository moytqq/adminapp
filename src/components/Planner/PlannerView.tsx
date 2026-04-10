import React from 'react';
import styles from './PlannerView.module.scss';
import {
  Calendar,
  CalendarDays,
  ListTodo,
  RussianRuble, ClipboardList,
} from 'lucide-react';

interface PlannerViewProps {
  plannerType: string;
  onBack?: () => void;
}

const getPlannerTitle = (type: string): string => {
  const titles: Record<string, string> = {
    tasks: 'Задачи',
    meetings: 'Встречи',
    reports: 'Отчёты',
    kpiWeek: 'KPI неделя',
    kpiToday: 'KPI сегодня',
  };
  return titles[type] || 'Планировщик';
};

const getPlannerIcon = (type: string) => {
  const icons: Record<string, React.ReactNode> = {
    tasks: <ListTodo size={48} />,
    meetings: <CalendarDays size={48} />,
    reports: <ClipboardList size={48} />,
    kpiWeek: <RussianRuble size={48} />,
    kpiToday: <RussianRuble size={48} />,
  };
  return icons[type] || <Calendar size={48} />;
};

const PlannerView: React.FC<PlannerViewProps> = ({ plannerType, onBack }) => {
  const title = getPlannerTitle(plannerType);
  const icon = getPlannerIcon(plannerType);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.placeholder}>
          {icon}
          <h3>{title}</h3>
          <p>Функционал Планировщика для "{title}" будет доступен позже</p>
        </div>
      </div>
    </div>
  );
};

export default PlannerView;