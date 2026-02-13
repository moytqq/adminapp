'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Position, LinearStaff } from '@/types/personal.types';
import { useAppDispatch } from '@/store/hooks/hooks';
import { deletePosition, updatePosition, loadAllPositions, loadAllStaff } from '@/store/slices/personalSlice';
import StaffCard from './StaffCard';
import styles from './PositionCard.module.scss';
import { MoreVertical, Edit, Trash2, UserPlus, X, Check, Store } from 'lucide-react';

interface PositionCardProps {
  position: Position;
  staff?: LinearStaff;
  allStaff: LinearStaff[];
  onUpdate?: () => void;
  storeName?: string;
}

const PositionCard: React.FC<PositionCardProps> = ({
                                                     position,
                                                     staff,
                                                     allStaff,
                                                     onUpdate,
                                                     storeName,
                                                   }) => {
  const dispatch = useAppDispatch();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(position.name);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string>(position.lsid || '');
  const [currentStaff, setCurrentStaff] = useState(staff);

  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setCurrentStaff(staff);
  }, [staff]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDelete = async () => {
    if (confirm('Вы уверены, что хотите удалить эту позицию?')) {
      await dispatch(deletePosition(position.id));
      setIsMenuOpen(false);
      await dispatch(loadAllPositions());
      if (onUpdate) onUpdate();
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setIsMenuOpen(false);
  };

  const handleSaveEdit = async () => {
    if (editedName.trim()) {
      await dispatch(updatePosition({
        id: position.id,
        name: editedName.trim(),
        lsid: position.lsid,
      }));
      setIsEditing(false);
      await dispatch(loadAllPositions());
      if (onUpdate) onUpdate();
    }
  };

  const handleAssignStaff = async () => {
    if (selectedStaffId) {
      await dispatch(updatePosition({
        id: position.id,
        name: position.name,
        lsid: selectedStaffId,
      }));
      setIsAssigning(false);
      await dispatch(loadAllPositions());
      await dispatch(loadAllStaff());
      if (onUpdate) onUpdate();
    }
  };

  const handleUnassignStaff = async () => {
    await dispatch(updatePosition({
      id: position.id,
      name: position.name,
      lsid: null,
    }));
    await dispatch(loadAllPositions());
    await dispatch(loadAllStaff());
    if (onUpdate) onUpdate();
  };

  const unassignedStaff = allStaff.filter(s =>
    s.pos_id === null || s.pos_id === position.id,
  );

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.titleSection}>
          {isEditing ? (
            <div className={styles.editForm}>
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className={styles.editInput}
                autoFocus
                placeholder="Название позиции"
              />
              <button
                onClick={handleSaveEdit}
                className={styles.saveButton}
                aria-label="Сохранить"
              >
                <Check size={16} />
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedName(position.name);
                }}
                className={styles.cancelButton}
                aria-label="Отмена"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className={styles.positionInfo}>
              <div className={styles.positionTitleRow}>
                <h3 className={styles.positionTitle}>{position.name}</h3>
                {position.lsid === null && (
                  <span className={styles.vacantBadge}>Свободна</span>
                )}
              </div>
              {storeName && (
                <div className={styles.storeInfo}>
                  <Store size={12} />
                  <span>{storeName}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.actions}>
          {position.lsid === null && !isAssigning && (
            <button
              className={styles.assignButton}
              onClick={() => setIsAssigning(true)}
              aria-label="Назначить сотрудника"
            >
              <UserPlus size={18} />
            </button>
          )}

          <div className={styles.menuContainer}>
            <button
              ref={menuButtonRef}
              className={styles.menuButton}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Меню"
            >
              <MoreVertical size={18} />
            </button>

            {isMenuOpen && (
              <div ref={menuRef} className={styles.menu}>
                <button
                  className={styles.menuItem}
                  onClick={handleEdit}
                >
                  <Edit size={16} />
                  <span>Редактировать</span>
                </button>
                <button
                  className={`${styles.menuItem} ${styles.deleteItem}`}
                  onClick={handleDelete}
                >
                  <Trash2 size={16} />
                  <span>Удалить</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isAssigning && position.lsid === null && (
        <div className={styles.assignSection}>
          <select
            className={styles.staffSelect}
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
          >
            <option value="">Выберите сотрудника</option>
            {unassignedStaff.map(s => (
              <option key={s.lsid} value={s.lsid}>
                {s.fio}
              </option>
            ))}
          </select>
          <div className={styles.assignActions}>
            <button
              className={styles.assignConfirmButton}
              onClick={handleAssignStaff}
              disabled={!selectedStaffId}
            >
              Назначить
            </button>
            <button
              className={styles.assignCancelButton}
              onClick={() => setIsAssigning(false)}
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {staff && (
        <StaffCard
          staff={staff}
          position={position}
          onUnassign={handleUnassignStaff}
        />
      )}
    </div>
  );
};

export default PositionCard;