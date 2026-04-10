import React from 'react';
import styles from './PlannerView.module.scss';
import { Calendar, CalendarDays, CalendarRange, ListTodo, Clock, AlertCircle, CheckCircle2, CalendarClock, CalendarX } from 'lucide-react';

interface PlannerViewProps {
  plannerType: string;
  onBack?: () => void;
}

const getPlannerTitle = (type: string): string => {
  const titles: Record<string, string> = {
    tasks: 'Задачи',
    schedule: 'График работы',
    events: 'Мероприятия',
    deadlines: 'Сроки',
    urgent: 'Срочные задачи',
    completed: 'Выполненные',
    upcoming: 'Предстоящие',
    overdue: 'Просроченные',
    calendar: 'Календарь',
  };
  return titles[type] || 'Планировщик';
};

const getPlannerIcon = (type: string) => {
  const icons: Record<string, React.ReactNode> = {
    tasks: <ListTodo size={48} />,
    schedule: <CalendarDays size={48} />,
    events: <CalendarRange size={48} />,
    deadlines: <Clock size={48} />,
    urgent: <AlertCircle size={48} />,
    completed: <CheckCircle2 size={48} />,
    upcoming: <CalendarClock size={48} />,
    overdue: <CalendarX size={48} />,
    calendar: <Calendar size={48} />,
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
          <p>Функционал планирования для "{title}" будет доступен позже</p>
        </div>
      </div>
    </div>
  );
};

export default PlannerView;