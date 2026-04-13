'use client';

import React from 'react';
import styles from './ChatCategorySelector.module.scss';
import {
  PenSquare,
  Users,
  UserPlus,
  AlertTriangle,
} from 'lucide-react';

export interface ChatCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface ChatCategorySelectorProps {
  onSelectCategory: (categoryId: string) => void;
}

const chatCategories: ChatCategory[] = [
  {
    id: 'write',
    title: 'Написать',
    description: 'Новое сообщение или чат',
    icon: <PenSquare size={32} />,
    color: '#2196f3',
    bgColor: '#e3f2fd',
  },
  {
    id: 'groups',
    title: 'Группы',
    description: 'Групповые чаты и каналы',
    icon: <Users size={32} />,
    color: '#4caf50',
    bgColor: '#e8f5e9',
  },
  {
    id: 'team',
    title: 'Команда',
    description: 'Общение внутри команды',
    icon: <UserPlus size={32} />,
    color: '#ff9800',
    bgColor: '#fff3e0',
  },
  {
    id: 'sos',
    title: 'SOS',
    description: 'Срочные сообщения и оповещения',
    icon: <AlertTriangle size={32} />,
    color: '#f44336',
    bgColor: '#ffebee',
  },
];

const ChatCategorySelector: React.FC<ChatCategorySelectorProps> = ({ onSelectCategory }) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Чат</h1>
        <p>Выберите категорию чата</p>
      </div>
      <div className={styles.grid}>
        {chatCategories.map(category => (
          <button
            key={category.id}
            className={styles.card}
            onClick={() => onSelectCategory(category.id)}
            style={{ backgroundColor: category.bgColor }}
          >
            <div className={styles.iconWrapper} style={{ color: category.color }}>
              {category.icon}
            </div>
            <h3 className={styles.title}>{category.title}</h3>
            <p className={styles.description}>{category.description}</p>
            <div className={styles.arrow}>→</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChatCategorySelector;