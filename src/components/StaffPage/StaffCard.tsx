'use client';

import React, { useState, useEffect, useRef } from 'react';
import { LinearStaff, Position, StaffInfo } from '@/types/personal.types';
import { useAppDispatch } from '@/store/hooks/hooks';
import {
  deleteStaff,
  updateStaff,
  loadStaffInfo,
  addStaffInfo,
  updateStaffInfo,
  deleteStaffInfo,
} from '@/store/slices/personalSlice';
import styles from './StaffCard.module.scss';
import {
  User,
  Calendar,
  Mail,
  Phone,
  Briefcase,
  MoreVertical,
  Edit,
  Trash2,
  Plus,
  X,
  Check,
  MapPin,
  Globe,
  FileText,
  Building2,
  ChevronDown,
  ChevronUp,
  Cake,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface StaffCardProps {
  staff: LinearStaff;
  position: Position;
  onUnassign?: () => void;
}

const INFO_TYPES = ['Текст'];

const INFO_NAMES = [
  'ФИО',
  'Дата рождения',
  'Телефон',
  'Email',
  'Должность',
  'Отдел',
  'Дата трудоустройства',
  'Гражданство',
  'Регистрация',
  'Тип отношений'
];

const STANDARD_INFO_FIELDS = [
  { type: 'Текст', label: 'Оотчество', key: 'middleName' },
  { type: 'Текст', label: 'Дата ррождения', key: 'birthDate' },
  { type: 'Текст', label: 'Ггражданство', key: 'citizenship' },
  { type: 'Текст', label: 'Ррегистрация', key: 'registration' },
  { type: 'Текст', label: 'Ттип отношений', key: 'contractType' },
  { type: 'Текст', label: 'Ддепартамент', key: 'department' },
  { type: 'Текст', label: 'Eуmail', key: 'email' },
  { type: 'Текст', label: 'Туелефон', key: 'phone' },
];

const StaffCard: React.FC<StaffCardProps> = ({ staff, position, onUnassign }) => {
  const dispatch = useAppDispatch();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdditionalInfoExpanded, setIsAdditionalInfoExpanded] = useState(false);
  const [editedFio, setEditedFio] = useState(staff.fio);
  const [editedDoe, setEditedDoe] = useState(
    staff.doe ? new Date(staff.doe).toISOString().split('T')[0] : '',
  );
  const [staffInfo, setStaffInfo] = useState<StaffInfo[]>([]);
  const [isAddingInfo, setIsAddingInfo] = useState(false);
  const [newInfo, setNewInfo] = useState({ type: 'Текст', label: '', value: '' });
  const [editingInfoId, setEditingInfoId] = useState<number | null>(null);
  const [editingInfoData, setEditingInfoData] = useState<{
    type: string;
    label: string;
    value: string;
  } | null>(null);

  const [standardFields, setStandardFields] = useState<Record<string, string>>({
    middleName: '',
    birthDate: '',
    citizenship: '',
    registration: '',
    contractType: 'none',
    department: '',
    email: '',
    phone: '',
  });

  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    loadInfo();
  }, [staff.lsid]);

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

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const loadInfo = async () => {
    try {
      const info = await dispatch(loadStaffInfo(staff.lsid)).unwrap();
      setStaffInfo(info || []);

      const fields: Record<string, string> = {
        middleName: '',
        birthDate: '',
        citizenship: '',
        registration: '',
        contractType: 'none',
        department: '',
        email: '',
        phone: '',
      };

      info.forEach(item => {
        if (item.label === 'Оотчество') fields.middleName = item.value;
        if (item.label === 'Дата ррождения') fields.birthDate = item.value;
        if (item.label === 'Ггражданство') fields.citizenship = item.value;
        if (item.label === 'Ррегистрация') fields.registration = item.value;
        if (item.label === 'Ттип отношений') fields.contractType = item.value;
        if (item.label === 'Ддепартамент') fields.department = item.value;
        if (item.label === 'Eуmail') fields.email = item.value;
        if (item.label === 'Ттелефон') fields.phone = item.value;
      });

      setStandardFields(fields);
    } catch (error) {
      console.error('Error loading staff info:', error);
    }
  };

  const handleStartEditInfo = (info: StaffInfo) => {
    setEditingInfoId(info.id);
    setEditingInfoData({
      type: info.type,
      label: info.label,
      value: info.value,
    });
  };

  const handleSaveInfo = async (info: StaffInfo) => {
    if (editingInfoData) {
      await dispatch(updateStaffInfo({
        id: info.id,
        type: editingInfoData.type,
        label: editingInfoData.label,
        value: editingInfoData.value,
        lsid: staff.lsid,
      }));
      setEditingInfoId(null);
      setEditingInfoData(null);
      await loadInfo();
    }
  };

  const handleDelete = async () => {
    if (confirm(`Удалить сотрудника ${staff.fio}?`)) {
      await dispatch(deleteStaff(staff.lsid));
      setIsMenuOpen(false);
      if (onUnassign) {
        onUnassign();
      }
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setIsMenuOpen(false);
  };

  const handleSaveEdit = async () => {
    if (editedFio.trim() && editedDoe) {
      await dispatch(updateStaff({
        lsid: staff.lsid,
        fio: editedFio.trim(),
        doe: editedDoe,
      }));
      setIsEditing(false);
    }
  };

  const handleAddInfo = async () => {
    if (newInfo.label && newInfo.value) {
      await dispatch(addStaffInfo({
        lsid: staff.lsid,
        type: newInfo.type,
        label: newInfo.label,
        value: newInfo.value,
      }));
      setNewInfo({ type: 'Текст', label: '', value: '' });
      setIsAddingInfo(false);
      loadInfo();
    }
  };

  const handleUpdateInfo = async (info: StaffInfo) => {
    await dispatch(updateStaffInfo({
      id: info.id,
      type: info.type,
      label: info.label,
      value: info.value,
      lsid: staff.lsid,
    }));
    setEditingInfoId(null);
    loadInfo();
  };

  const handleDeleteInfo = async (id: number) => {
    if (confirm('Удалить эту информацию?')) {
      await dispatch(deleteStaffInfo({ id, lsid: staff.lsid }));
      loadInfo();
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd.MM.yyyy', { locale: ru });
    } catch {
      return dateString;
    }
  };

  const getContractTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'employment': 'Трудовой договор',
      'gph': 'ГПХ',
      'patent': 'Патент',
    };
    return labels[type] || type;
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedFio(staff.fio);
    setEditedDoe(staff.doe ? new Date(staff.doe).toISOString().split('T')[0] : '');
  };

  const toggleAdditionalInfo = () => {
    setIsAdditionalInfoExpanded(!isAdditionalInfoExpanded);
  };

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleAddInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAddingInfo(true);
  };

  const handleCancelAddInfo = () => {
    setIsAddingInfo(false);
    setNewInfo({ type: 'Текст', label: '', value: '' });
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.titleSection}>
          <div className={styles.avatar}>
            <User size={20} />
          </div>

          {isEditing ? (
            <div className={styles.editForm}>
              <input
                type="text"
                value={editedFio}
                onChange={(e) => setEditedFio(e.target.value)}
                className={styles.editInput}
                placeholder="ФИО"
                autoFocus
              />
              <input
                type="date"
                value={editedDoe}
                onChange={(e) => setEditedDoe(e.target.value)}
                className={styles.editInput}
              />
              <button
                onClick={handleSaveEdit}
                className={styles.saveButton}
                aria-label="Сохранить"
                title="Сохранить"
              >
                <Check size={16} />
              </button>
              <button
                onClick={handleCancelEdit}
                className={styles.cancelButton}
                aria-label="Отмена"
                title="Отмена"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className={styles.staffInfo}>
              <h4 className={styles.staffName}>{staff.fio}</h4>
              <div className={styles.staffMeta}>
                <span className={styles.metaItem}>
                  <Calendar size={14} />
                  {formatDate(staff.doe)}
                </span>
                {position && (
                  <span className={styles.metaItem}>
                    <Briefcase size={14} />
                    {position.name}
                  </span>
                )}
                {standardFields.department && (
                  <span className={styles.metaItem}>
                    <Building2 size={14} />
                    {standardFields.department}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className={styles.actions}>
          {!isEditing ? (
            <>
              {onUnassign && (
                <button
                  className={styles.unassignButton}
                  onClick={onUnassign}
                  title="Отвязать от вакансии"
                >
                  <X size={16} />
                </button>
              )}

              <div className={styles.menuContainer} ref={menuRef}>
                <button
                  ref={menuButtonRef}
                  className={`${styles.menuButton} ${isMenuOpen ? styles.menuButtonActive : ''}`}
                  onClick={toggleMenu}
                  aria-label="Меню"
                >
                  <MoreVertical size={16} />
                </button>

                {isMenuOpen && (
                  <div className={styles.menu}>
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
            </>
          ) : null}
        </div>
      </div>

      <button
        className={styles.expandButton}
        onClick={toggleAdditionalInfo}
      >
        <span>Дополнительная информация</span>
        {isAdditionalInfoExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {isAdditionalInfoExpanded && (
        <div className={styles.infoSection}>
          <div className={styles.infoHeader}>
            <h5 className={styles.infoTitle}>Персональные данные</h5>
            <button
              className={styles.addInfoButton}
              onClick={handleAddInfoClick}
            >
              <Plus size={16} />
              <span>Добавить поле</span>
            </button>
          </div>

          <div className={styles.infoGrid}>
            {standardFields.middleName && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Отчество:</span>
                <span className={styles.infoValue}>{standardFields.middleName}</span>
              </div>
            )}

            {standardFields.birthDate && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabelWithIcon}>
                  <Cake size={14} />
                  <span>Дата рождения:</span>
                </span>
                <span className={styles.infoValue}>
                  {formatDate(standardFields.birthDate)}
                </span>
              </div>
            )}

            {standardFields.citizenship && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabelWithIcon}>
                  <Globe size={14} />
                  <span>Гражданство:</span>
                </span>
                <span className={styles.infoValue}>{standardFields.citizenship}</span>
              </div>
            )}

            {standardFields.registration && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabelWithIcon}>
                  <MapPin size={14} />
                  <span>Регистрация:</span>
                </span>
                <span className={styles.infoValue}>{standardFields.registration}</span>
              </div>
            )}

            {standardFields.contractType && standardFields.contractType !== 'none' && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabelWithIcon}>
                  <FileText size={14} />
                  <span>Тип отношений:</span>
                </span>
                <span className={styles.infoValue}>
                  {getContractTypeLabel(standardFields.contractType)}
                </span>
              </div>
            )}

            {standardFields.email && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabelWithIcon}>
                  <Mail size={14} />
                  <span>Email:</span>
                </span>
                <span className={styles.infoValue}>{standardFields.email}</span>
              </div>
            )}

            {standardFields.phone && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>
                  <span>Телефон:</span>
                </span>
                <span className={styles.infoValue}>{standardFields.phone}</span>
              </div>
            )}
          </div>

          {isAddingInfo && (
            <div className={styles.addInfoForm}>
              <select
                className={styles.infoSelect}
                value={newInfo.type}
                onChange={(e) => setNewInfo({ ...newInfo, type: e.target.value })}
              >
                {INFO_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <select
                className={styles.infoSelect}
                value={newInfo.label}
                onChange={(e) => setNewInfo({ ...newInfo, label: e.target.value })}
              >
                <option value="">Выберите поле</option>
                {INFO_NAMES.map(label => (
                  <option key={label} value={label}>{label}</option>
                ))}
              </select>
              <input
                type="text"
                className={styles.infoInput}
                placeholder="Значение"
                value={newInfo.value}
                onChange={(e) => setNewInfo({ ...newInfo, value: e.target.value })}
              />
              <div className={styles.infoActions}>
                <button
                  className={styles.infoSaveButton}
                  onClick={handleAddInfo}
                  disabled={!newInfo.label || !newInfo.value}
                  type="button"
                >
                  <Check size={16} />
                </button>
                <button
                  className={styles.infoCancelButton}
                  onClick={handleCancelAddInfo}
                  type="button"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          <div className={styles.infoList}>
            {staffInfo
              .filter(info => !STANDARD_INFO_FIELDS.some(f => f.label === info.label))
              .map((info) => (
                <div key={info.id} className={styles.infoItem}>
                  {editingInfoId === info.id ? (
                    <div className={styles.editInfoForm}>
                      <select
                        className={styles.infoEditSelect}
                        value={editingInfoData?.type || info.type}
                        onChange={(e) => {
                          setEditingInfoData(prev => ({
                            type: e.target.value,
                            label: prev?.label || info.label,
                            value: prev?.value || info.value,
                          }));
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {INFO_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      <select
                        className={styles.infoEditSelect}
                        value={editingInfoData?.label || info.label}
                        onChange={(e) => {
                          setEditingInfoData(prev => ({
                            type: prev?.type || info.type,
                            label: e.target.value,
                            value: prev?.value || info.value,
                          }));
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {INFO_NAMES.map(label => (
                          <option key={label} value={label}>{label}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        className={styles.infoEditInput}
                        value={editingInfoData?.value !== undefined ? editingInfoData.value : info.value}
                        onChange={(e) => {
                          setEditingInfoData(prev => ({
                            type: prev?.type || info.type,
                            label: prev?.label || info.label,
                            value: e.target.value,
                          }));
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className={styles.editInfoActions}>
                        <button
                          className={styles.infoEditSaveButton}
                          onClick={() => handleSaveInfo(info)}
                          type="button"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          className={styles.infoEditCancelButton}
                          onClick={() => {
                            setEditingInfoId(null);
                            setEditingInfoData(null);
                          }}
                          type="button"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className={styles.infoLabel}>{info.label}:</span>
                      <span className={styles.infoValue}>{info.value}</span>
                      <div className={styles.infoItemActions}>
                        <button
                          className={styles.infoItemEdit}
                          onClick={() => handleStartEditInfo(info)}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className={styles.infoItemDelete}
                          onClick={() => handleDeleteInfo(info.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            {staffInfo.length === 0 && !isAddingInfo && (
              <p className={styles.noInfo}>Нет дополнительной информации</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffCard;