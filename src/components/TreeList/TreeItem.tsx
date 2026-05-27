'use client';

import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
  TreeItem as TreeItemType,
  TreeItemType as ItemType,
} from '@/types/tree.types';
import {
  Building2,
  Users,
  Store,
  User,
  Plus,
  X,
  ChevronRight,
  MapPin,
} from 'lucide-react';
import styles from './TreeList.module.scss';
import WidgetPopup from '../WidgetPopup/WidgetPopup';
import { createPortal } from 'react-dom';
import { getColorForType } from '@/utils/treeTypeHelpers';
import { useAppSelector } from '@/store/hooks/hooks';

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
  const itemRowRef = useRef<HTMLDivElement>(null);
  const viewMode = useAppSelector((state) => state.tree.viewMode);

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
    console.log(`Add widget ${widgetType} to item ${item.id} of type ${item.type}`);
  }, [item.id, item.type]);

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

  const getIndentStyle = (itemLevel: number) => {
    const basePadding = 10;
    let levelPadding = 0;

    switch (itemLevel) {
      case 1:
        levelPadding = 10;
        break;
      case 2:
        levelPadding = 10;
        break;
      case 3:
        levelPadding = 15;
        break;
      case 4:
        levelPadding = 19;
        break;
      default:
        levelPadding = 0;
    }

    return {
      paddingLeft: `${basePadding + levelPadding}px`,
    } as React.CSSProperties;
  };

  const getItemIcon = () => {
    const iconColor = getColorForType(item.type);
    switch (item.type) {
      case ItemType.COMPANY:
        return <Building2 size={18} color={iconColor} />;
      case ItemType.DEPARTMENT:
        return <Users size={18} color={iconColor} />;
      case ItemType.STORE:
        return <Store size={18} color={iconColor} />;
      case ItemType.PERSON:
        return <User size={18} color={iconColor} />;
      case ItemType.ADDRESS:
        return <MapPin size={18} color={iconColor} />;
      default:
        return <Store size={18} color={iconColor} />;
    }
  };

  const itemColor = getColorForType(item.type);


  return (
    <>
      <div className={styles.treeItem} data-level={item.level} data-type={item.type}>
        <div
          ref={itemRowRef}
          className={`${styles.itemRow} ${item.isExpanded ? styles.expanded : ''}`}
          style={getIndentStyle(item.level)}
          onClick={handleItemClick}
          data-item-id={item.id}
          data-has-children={hasChildren}
        >
          {hasChildren && (
            <div className={styles.arrowWrapper}>
              <ChevronRight
                size={16}
                className={`${styles.arrow} ${item.isExpanded ? styles.expanded : ''}`}
                color={itemColor}
              />
            </div>
          )}

          {!hasChildren && <div className={styles.arrowSpacer} />}

          <div className={styles.iconWrapper}>
            <div className={styles.icon}>
              {getItemIcon()}
            </div>
          </div>

          <div className={styles.contentWrapper}>
            {item.type === ItemType.PERSON ? (
              <span className={styles.label}>
                {`${item.data.lastName} ${item.data.firstName} ${item.data.middleName}`.trim()}
              </span>
            ) : (
              <span className={styles.label}>
                {item.label}
              </span>
            )}

            {item.type === ItemType.PERSON && item.subLabel && (
              <span className={styles.subLabel}>
                {item.subLabel}
              </span>
            )}

            <button
              ref={widgetButtonRef}
              className={styles.widgetButton}
              onClick={handleWidgetButtonClick}
              aria-label="Открыть виджеты"
              data-widget-open={showWidgets}
              style={{
                backgroundColor: showWidgets ? itemColor : undefined,
              }}
            >
              {showWidgets ? (
                <X size={14} />
              ) : (
                <Plus size={14} />
              )}
            </button>
          </div>
        </div>

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

      {showWidgets && createPortal(
        <WidgetPopup
          itemId={item.id}
          itemType={item.type}
          onAddWidget={handleAddWidget}
          onClose={() => setShowWidgets(false)}
        />,
        document.body,
      )}
    </>
  );
};

export default React.memo(TreeItem);