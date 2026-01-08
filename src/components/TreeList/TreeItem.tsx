'use client';

import React, { useCallback, useState, useRef, useEffect } from 'react';
import { TreeItem as TreeItemType } from '@/types/tree.types';
import { Folder, File, Plus, X } from 'lucide-react';
import styles from './TreeList.module.scss';
import WidgetPopup from '../WidgetPopup/WidgetPopup';
import { createPortal } from 'react-dom';

interface TreeItemProps {
  item: TreeItemType;
  onToggle: (id: string) => void;
}

const TreeItem: React.FC<TreeItemProps> = ({
                                             item,
                                             onToggle,
                                           }) => {
  const hasChildren = item.children && item.children.length > 0;
  const [showWidgets, setShowWidgets] = useState(false);
  const widgetButtonRef = useRef<HTMLButtonElement>(null);

  const handleItemClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      onToggle(item.id);
    }
  }, [item.id, hasChildren, onToggle]);

  const handleWidgetButtonClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowWidgets(prev => !prev);
  }, []);

  const handleAddWidget = useCallback((widgetType: string) => {
    console.log(`Add widget ${widgetType} to item ${item.id}`);
  }, [item.id]);

  // Закрытие попапа при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        widgetButtonRef.current &&
        !widgetButtonRef.current.contains(event.target as Node)
      ) {
        setShowWidgets(false);
      }
    };

    if (showWidgets) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showWidgets]);

  const getIndentStyle = () => {
    const basePadding = 15;
    const levelPadding = item.level * 10;
    return {
      paddingLeft: `${basePadding + levelPadding}px`,
    } as React.CSSProperties;
  };

  return (
    <>
      <div className={styles.treeItem} data-level={item.level}>
        {/* Контейнер строки элемента */}
        <div
          className={`${styles.itemRow} ${item.isExpanded ? styles.expanded : ''}`}
          style={getIndentStyle()}
          onClick={handleItemClick}
          data-item-id={item.id}
          data-has-children={hasChildren}
        >
          {/* Иконка элемента */}
          <div className={styles.iconWrapper}>
            <div className={styles.icon}>
              {hasChildren ? (
                <Folder size={18} />
              ) : (
                <File size={18} />
              )}
            </div>
          </div>

          {/* Основной текст элемента и subLabel */}
          <div className={styles.contentWrapper}>
            <span className={styles.label}>
              {item.label}
            </span>

            {/* SubLabel */}
            {item.subLabel && (
              <span className={styles.subLabel}>
                {item.subLabel}
              </span>
            )}

            {/* Кнопка для открытия виджетов */}
            <button
              ref={widgetButtonRef}
              className={styles.widgetButton}
              onClick={handleWidgetButtonClick}
              aria-label="Открыть виджеты"
              data-widget-open={showWidgets}
            >
              {showWidgets ? (
                <X size={14} />
              ) : (
                <Plus size={14} />
              )}
            </button>
          </div>

          {/* Бейдж с количеством детей */}
          {hasChildren && item.children && (
            <div className={styles.badgeWrapper}>
              <span className={styles.badge}>
                {item.isExpanded ? '−' : '+'} {item.children.length}
              </span>
            </div>
          )}
        </div>

        {/* Дочерние элементы */}
        {hasChildren && item.isExpanded && item.children && (
          <div className={styles.children}>
            {item.children.map(child => (
              <TreeItem
                key={child.id}
                item={child}
                onToggle={onToggle}
              />
            ))}
          </div>
        )}
      </div>

      {/* Рендерим попап через портал */}
      {showWidgets && createPortal(
        <WidgetPopup
          itemId={item.id}
          onAddWidget={handleAddWidget}
          onClose={() => setShowWidgets(false)}
        />,
        document.body
      )}
    </>
  );
};

export default React.memo(TreeItem);