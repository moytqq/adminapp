'use client';

import React, { forwardRef, useEffect, useState, useRef } from 'react';
import styles from './WidgetPopup.module.scss';
import { Plus } from 'lucide-react';

interface WidgetPopupProps {
  itemId: string;
  onAddWidget: (widgetType: string) => void;
  onClose: () => void;
}

const MOCK_WIDGETS = [
  { id: '1', title: 'WidgetName', description: 'WidgetDescription', type: 'widgetType' },
  { id: '2', title: 'WidgetName', description: 'WidgetDescription', type: 'widgetType' },
  { id: '3', title: 'WidgetName', description: 'WidgetDescription', type: 'widgetType' },
  { id: '4', title: 'WidgetName', description: 'WidgetDescription', type: 'widgetType' },
  { id: '5', title: 'WidgetName', description: 'WidgetDescription', type: 'widgetType' },
  { id: '6', title: 'WidgetName', description: 'WidgetDescription', type: 'widgetType' },
  { id: '7', title: 'WidgetName', description: 'WidgetDescription', type: 'widgetType' },
  { id: '8', title: 'WidgetName', description: 'WidgetDescription', type: 'widgetType' },
  { id: '9', title: 'WidgetName', description: 'WidgetDescription', type: 'widgetType' },
  { id: '10', title: 'WidgetName', description: 'WidgetDescription', type: 'widgetType' },
  { id: '11', title: 'WidgetName', description: 'WidgetDescription', type: 'widgetType' },
  { id: '12', title: 'WidgetName', description: 'WidgetDescription', type: 'widgetType' },
];

const WidgetPopup = forwardRef<HTMLDivElement, WidgetPopupProps>(
  ({ itemId, onAddWidget, onClose }, ref) => {
    const [isMobile, setIsMobile] = useState(false);
    const popupRef = useRef<HTMLDivElement>(null);

    // Определяем мобильное устройство
    useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };

      checkMobile();
      window.addEventListener('resize', checkMobile);

      return () => {
        window.removeEventListener('resize', checkMobile);
      };
    }, []);

    // Блокируем скролл на мобильных
    useEffect(() => {
      if (isMobile) {
        document.body.style.overflow = 'hidden';
      }

      return () => {
        document.body.style.overflow = '';
      };
    }, [isMobile]);

    // Кастомный хук для обработки клика вне элемента
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        // Если попап не существует, выходим
        if (!popupRef.current) return;

        // Проверяем, был ли клик на самом попапе или его дочерних элементах
        const isClickInside = popupRef.current.contains(event.target as Node);

        // Если клик был ВНЕ попапа - закрываем
        if (!isClickInside) {
          onClose();
        }
      };

      // Важно: добавляем обработчик с задержкой, чтобы не сработал на клик, который открыл попап
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);

      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [onClose]);

    // Обработчик Escape для закрытия
    useEffect(() => {
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }, [onClose]);

    // Останавливаем всплытие на всех кликах внутри попапа
    const handlePopupMouseDown = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
    };

    const handleAddWidgetClick = (widgetType: string) => {
      onAddWidget(widgetType);
    };

    const handleCloseClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onClose();
    };

    return (
      <>
        {/* Overlay для мобильных - отдельный элемент, не связанный с обработчиком клика вне */}
        {isMobile && (
          <div
            className={styles.overlay}
            onClick={onClose}
          />
        )}

        <div
          ref={popupRef}
          className={`${styles.popup} ${isMobile ? styles.mobile : styles.desktop}`}
          onMouseDown={handlePopupMouseDown}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.header}>
            <h3>Виджеты для элемента</h3>
            <button
              className={styles.closeButton}
              onClick={handleCloseClick}
              aria-label="Закрыть"
            >
              ×
            </button>
          </div>

          <div className={styles.content}>
            <div className={styles.grid}>
              {MOCK_WIDGETS.map(widget => (
                <div
                  key={widget.id}
                  className={styles.card}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className={styles.cardHeader}>
                    <h4>{widget.title}</h4>
                  </div>
                  <p className={styles.description}>{widget.description}</p>
                  <button
                    className={styles.addButton}
                    onClick={() => handleAddWidgetClick(widget.type)}
                  >
                    <Plus size={14} />
                    <span>Добавить</span>
                  </button>
                </div>
              ))}
            </div>

            <div className={styles.footer}>
              <p className={styles.hint}>
                Выберите виджет для добавления к элементу {itemId}
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }
);

WidgetPopup.displayName = 'WidgetPopup';

export default WidgetPopup;