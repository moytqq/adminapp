'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks/hooks';
import {
  loadAllStaff,
  loadPositionsByHid,
  addPosition,
  updatePosition,
  deletePosition,
} from '@/store/slices/personalSlice';
import styles from './PersonnelManagementWidget.module.scss';
import { ArrowLeft, X, Plus, Briefcase, User, Trash2, Edit, Check, X as XIcon, UserPlus, Users } from 'lucide-react';
import PositionCard from '@/components/StaffPage/PositionCard';
import AddStaffModal from '@/components/StaffPage/AddStaffModal';

interface PersonnelManagementWidgetProps {
  hid: string;
  itemName?: string;
  onClose: () => void;
  isMobile?: boolean | null;
}

const PersonnelManagementWidget: React.FC<PersonnelManagementWidgetProps> = ({
                                                                               hid,
                                                                               itemName,
                                                                               onClose,
                                                                               isMobile,
                                                                             }) => {
  const dispatch = useAppDispatch();
  const { positionsByHid, staff, loading } = useAppSelector((state) => state.personal);
  const [positions, setPositions] = useState<typeof positionsByHid[string]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPositionName, setNewPositionName] = useState('');
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [loadingPositions, setLoadingPositions] = useState(false);

  useEffect(() => {
    console.log('PersonnelManagementWidget mounted with hid:', hid, 'itemName:', itemName);
    loadData();
  }, [hid]);

  useEffect(() => {
    if (positionsByHid && positionsByHid[hid]) {
      console.log('Positions loaded for hid:', hid, positionsByHid[hid]);
      setPositions(positionsByHid[hid]);
    } else {
      setPositions([]);
    }
  }, [positionsByHid, hid]);

  const refreshData = async () => {
    await dispatch(loadAllStaff());
    await dispatch(loadPositionsByHid(hid));
  };

  const loadData = async () => {
    setLoadingPositions(true);
    try {
      await dispatch(loadAllStaff());
      await dispatch(loadPositionsByHid(hid));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoadingPositions(false);
    }
  };

  const handleAddPosition = async () => {
    if (newPositionName.trim()) {
      await dispatch(addPosition({
        hid,
        name: newPositionName.trim()
      }));
      await dispatch(loadPositionsByHid(hid));
      setNewPositionName('');
      setShowAddForm(false);
    }
  };

  const vacantPositions = positions.filter(p => p.lsid === null);
  const occupiedPositions = positions.filter(p => p.lsid !== null);
  const sortedPositions = [...positions].sort((a, b) => {
    if (a.lsid === null && b.lsid !== null) return -1;
    if (a.lsid !== null && b.lsid === null) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className={`${styles.widget} ${isMobile ? styles.mobile : ''}`}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={onClose}>
          <ArrowLeft size={18} />
        </button>
        <div className={styles.headerInfo}>
          <h3 className={styles.title}>
            Сотрудники и вакансии
          </h3>
          {itemName && (
            <span className={styles.subtitle}>{itemName}</span>
          )}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{positions.length}</span>
            <span className={styles.statLabel}>Всего вакансий</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{vacantPositions.length}</span>
            <span className={styles.statLabel}>Свободно</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{occupiedPositions.length}</span>
            <span className={styles.statLabel}>Занято</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{staff.length}</span>
            <span className={styles.statLabel}>Сотрудников</span>
          </div>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.addButton}
            onClick={() => setShowAddForm(true)}
          >
            <Briefcase size={16} />
            <span>Добавить вакансию</span>
          </button>
          <button
            className={`${styles.addButton} ${styles.addStaffButton}`}
            onClick={() => setShowAddStaffModal(true)}
          >
            <Users size={16} />
            <span>Добавить сотрудника</span>
          </button>
        </div>

        {showAddForm && (
          <div className={styles.addForm}>
            <input
              type="text"
              className={styles.addInput}
              placeholder="Название вакансии"
              value={newPositionName}
              onChange={(e) => setNewPositionName(e.target.value)}
              autoFocus
            />
            <div className={styles.addFormActions}>
              <button
                className={styles.saveButton}
                onClick={handleAddPosition}
                disabled={!newPositionName.trim()}
              >
                <Check size={16} />
              </button>
              <button
                className={styles.cancelButton}
                onClick={() => {
                  setShowAddForm(false);
                  setNewPositionName('');
                }}
              >
                <XIcon size={16} />
              </button>
            </div>
          </div>
        )}

        <div className={styles.positionsList}>
          {sortedPositions.length === 0 ? (
            <div className={styles.emptyState}>
              <Briefcase size={32} />
              <p>Нет вакансий для этого подразделения</p>
              <button
                className={styles.emptyStateButton}
                onClick={() => setShowAddForm(true)}
              >
                Добавить первую вакансию
              </button>
            </div>
          ) : (
            sortedPositions.map((position) => {
              const assignedStaff = staff.find(s => s.lsid === position.lsid);
              return (
                <PositionCard
                  key={position.id}
                  position={position}
                  staff={assignedStaff}
                  allStaff={staff}
                  onUpdate={refreshData}
                  storeName={itemName}
                />
              );
            })
          )}
        </div>
      </div>

      <AddStaffModal
        isOpen={showAddStaffModal}
        onClose={() => {
          setShowAddStaffModal(false);
          dispatch(loadAllStaff());
        }}
      />
    </div>
  );
};

export default PersonnelManagementWidget;