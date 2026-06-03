'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks/hooks';
import { personalApi } from '@/services/personalApi';
import { X, Plus, Trash2, ChevronDown, ChevronUp, Check, Loader2 } from 'lucide-react';
import styles from './ManagerLsForm.module.scss';

interface StaffInfoFields {
  fio: string;
  doe: string;
  middleName: string;
  birthDate: string;
  citizenship: string;
  registration: string;
  contractType: string;
  department: string;
  email: string;
  phone: string;
}

interface PositionItem {
  id?: number;
  name: string;
  lsid: string | null;
  isNew: boolean;
  isDeleted: boolean;
  staffForm: StaffInfoFields | null;
  staffInfoLoaded: boolean;
  expanded: boolean;
}

interface StoreData {
  hid: number;
  name: string;
  lastFilledAt: string | null;
  filledToday: boolean;
  positions: Array<{
    id: number;
    name: string;
    hid: number;
    lsid: string | null;
    staff: { lsid: string; fio: string; doe: string } | null;
    staffInfo: Array<{ label: string; value: string }>;
  }>;
}

interface ManagerLsFormProps {
  onClose: () => void;
}

const CONTRACT_TYPES = [
  { value: '', label: 'Не указано' },
  { value: 'employment', label: 'Трудовой договор' },
  { value: 'gph', label: 'ГПХ' },
  { value: 'patent', label: 'Патент' },
];

const INFO_LABEL_MAP: Record<string, string> = {
  middleName: 'Оотчество',
  birthDate: 'Дата ррождения',
  citizenship: 'Ггражданство',
  registration: 'Ррегистрация',
  contractType: 'Ттип отношений',
  department: 'Ддепартамент',
  email: 'Eуmail',
  phone: 'Туелефон',
};

const emptyStaffForm = (): StaffInfoFields => ({
  fio: '',
  doe: '',
  middleName: '',
  birthDate: '',
  citizenship: '',
  registration: '',
  contractType: '',
  department: '',
  email: '',
  phone: '',
});

const buildStaffForm = (
  staffData: { fio: string; doe: string } | null,
  infoRecords: Array<{ label: string; value: string }>,
): StaffInfoFields => {
  const form = emptyStaffForm();
  if (staffData) {
    form.fio = staffData.fio || '';
    form.doe = staffData.doe
      ? new Date(staffData.doe).toISOString().split('T')[0]
      : '';
  }
  const revMap: Record<string, keyof StaffInfoFields> = Object.fromEntries(
    Object.entries(INFO_LABEL_MAP).map(([k, v]) => [v, k as keyof StaffInfoFields]),
  );
  infoRecords.forEach(rec => {
    const key = revMap[rec.label];
    if (key) (form as any)[key] = rec.value;
  });
  return form;
};

const ManagerLsForm: React.FC<ManagerLsFormProps> = ({ onClose }) => {
  const { staff: allStaff } = useAppSelector(state => state.personal);

  const [stores, setStores] = useState<StoreData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [positions, setPositions] = useState<PositionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [totalFilledToday, setTotalFilledToday] = useState(0);
  const [totalStores, setTotalStores] = useState(0);

  const initPositions = useCallback((store: StoreData): PositionItem[] =>
    store.positions.map(p => ({
      id: p.id,
      name: p.name,
      lsid: p.lsid,
      isNew: false,
      isDeleted: false,
      staffForm: p.lsid && p.staff
        ? buildStaffForm(p.staff, p.staffInfo)
        : null,
      staffInfoLoaded: true,
      expanded: false,
    })),
  []);

  useEffect(() => {
    (async () => {
      try {
        const result = await personalApi.getManagerStores();
        if (result.status !== 'success') {
          setError(result.message || 'Ошибка загрузки');
          setLoading(false);
          return;
        }
        setTotalFilledToday(result.totalFilledToday || 0);
        setTotalStores(result.totalStores || 0);
        if (!result.stores || result.stores.length === 0) {
          setDone(true);
          setLoading(false);
          return;
        }
        setStores(result.stores);
        setPositions(initPositions(result.stores[0]));
      } catch {
        setError('Ошибка при загрузке данных');
      } finally {
        setLoading(false);
      }
    })();
  }, [initPositions]);

  const currentStore = stores[currentIndex];

  const updatePosition = (idx: number, updates: Partial<PositionItem>) => {
    setPositions(prev => prev.map((p, i) => i === idx ? { ...p, ...updates } : p));
  };

  const handleStaffSelect = async (posIdx: number, lsid: string | null) => {
    if (!lsid) {
      updatePosition(posIdx, { lsid: null, staffForm: null, staffInfoLoaded: true, expanded: false });
      return;
    }
    const staffMember = allStaff.find(s => s.lsid === lsid);
    updatePosition(posIdx, { lsid, staffInfoLoaded: false, expanded: true });
    try {
      const infoRecords = await personalApi.getInfo(lsid);
      const staffForm = buildStaffForm(
        staffMember ? { fio: staffMember.fio, doe: staffMember.doe } : null,
        infoRecords,
      );
      updatePosition(posIdx, { staffForm, staffInfoLoaded: true });
    } catch {
      updatePosition(posIdx, { staffForm: emptyStaffForm(), staffInfoLoaded: true });
    }
  };

  const handleStaffFormChange = (
    posIdx: number,
    field: keyof StaffInfoFields,
    value: string,
  ) => {
    setPositions(prev => prev.map((p, i) => {
      if (i !== posIdx) return p;
      return { ...p, staffForm: { ...(p.staffForm || emptyStaffForm()), [field]: value } };
    }));
  };

  const addPosition = () => {
    setPositions(prev => [...prev, {
      name: '',
      lsid: null,
      isNew: true,
      isDeleted: false,
      staffForm: null,
      staffInfoLoaded: true,
      expanded: false,
    }]);
  };

  const deletePosition = (idx: number) => {
    setPositions(prev => prev.map((p, i) =>
      i === idx ? { ...p, isDeleted: true, expanded: false } : p,
    ));
  };

  const handleSave = async () => {
    if (!currentStore) return;
    setSaving(true);
    setError(null);
    try {
      const payload = positions.map(p => ({
        id: p.id,
        name: p.name,
        delete: p.isDeleted,
        lsid: p.lsid,
        staff: p.lsid && p.staffForm ? p.staffForm : null,
      }));
      const result = await personalApi.saveManagerStore(currentStore.hid, payload);
      if (result.status !== 'success') {
        setError(result.message || 'Ошибка сохранения');
        return;
      }
      const nextIndex = currentIndex + 1;
      if (nextIndex >= stores.length) {
        setDone(true);
      } else {
        setCurrentIndex(nextIndex);
        setPositions(initPositions(stores[nextIndex]));
      }
    } catch {
      setError('Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  const activePositions = positions.filter(p => !p.isDeleted);
  const isLastStore = currentIndex === stores.length - 1;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <h2>Заполнение персонала</h2>
            {!loading && !done && currentStore && (
              <span className={styles.progress}>
                {currentIndex + 1} / {stores.length}
              </span>
            )}
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">
            <X size={20} />
          </button>
        </div>

        <div className={styles.body}>
          {loading && (
            <div className={styles.centered}>
              <Loader2 size={32} className={styles.spinner} />
              <p>Загрузка...</p>
            </div>
          )}

          {!loading && done && (
            <div className={styles.centered}>
              <Check size={48} className={styles.doneIcon} />
              <p className={styles.doneText}>
                Все адреса заполнены сегодня
              </p>
              <p className={styles.doneSubtext}>
                Заполнено сегодня: {totalFilledToday} из {totalStores}
              </p>
              <button className={styles.closeButton} onClick={onClose}>
                Закрыть
              </button>
            </div>
          )}

          {!loading && !done && currentStore && (
            <>
              <div className={styles.storeInfo}>
                <h3 className={styles.storeName}>{currentStore.name}</h3>
                {currentStore.lastFilledAt && (
                  <span className={styles.lastFilled}>
                    Последнее заполнение:{' '}
                    {new Date(currentStore.lastFilledAt).toLocaleDateString('ru', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </span>
                )}
                {!currentStore.lastFilledAt && (
                  <span className={styles.neverFilled}>Ещё не заполнялся</span>
                )}
              </div>

              {error && <p className={styles.error}>{error}</p>}

              <div className={styles.positions}>
                {activePositions.length === 0 && (
                  <p className={styles.noPositions}>Нет вакансий. Добавьте первую.</p>
                )}

                {positions.map((pos, idx) => {
                  if (pos.isDeleted) return null;
                  return (
                    <div key={idx} className={styles.positionCard}>
                      <div className={styles.positionRow}>
                        <input
                          className={styles.positionName}
                          value={pos.name}
                          onChange={e => updatePosition(idx, { name: e.target.value })}
                          placeholder="Название должности"
                        />

                        <select
                          className={styles.staffSelect}
                          value={pos.lsid || ''}
                          onChange={e => handleStaffSelect(idx, e.target.value || null)}
                        >
                          <option value="">Вакантно</option>
                          {allStaff.map(s => (
                            <option key={s.lsid} value={s.lsid}>{s.fio}</option>
                          ))}
                        </select>

                        {pos.lsid && (
                          <button
                            className={styles.expandBtn}
                            onClick={() => updatePosition(idx, { expanded: !pos.expanded })}
                            aria-label="Данные сотрудника"
                          >
                            {pos.expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        )}

                        <button
                          className={styles.deleteBtn}
                          onClick={() => deletePosition(idx)}
                          aria-label="Удалить вакансию"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {pos.lsid && pos.expanded && (
                        <div className={styles.staffFields}>
                          {!pos.staffInfoLoaded ? (
                            <Loader2 size={20} className={styles.spinner} />
                          ) : (
                            <div className={styles.fieldsGrid}>
                              <label className={styles.field}>
                                <span>ФИО</span>
                                <input
                                  value={pos.staffForm?.fio || ''}
                                  onChange={e => handleStaffFormChange(idx, 'fio', e.target.value)}
                                  placeholder="ФИО"
                                />
                              </label>
                              <label className={styles.field}>
                                <span>Дата трудоустройства</span>
                                <input
                                  type="date"
                                  value={pos.staffForm?.doe || ''}
                                  onChange={e => handleStaffFormChange(idx, 'doe', e.target.value)}
                                />
                              </label>
                              <label className={styles.field}>
                                <span>Отчество</span>
                                <input
                                  value={pos.staffForm?.middleName || ''}
                                  onChange={e => handleStaffFormChange(idx, 'middleName', e.target.value)}
                                  placeholder="Отчество"
                                />
                              </label>
                              <label className={styles.field}>
                                <span>Дата рождения</span>
                                <input
                                  type="date"
                                  value={pos.staffForm?.birthDate || ''}
                                  onChange={e => handleStaffFormChange(idx, 'birthDate', e.target.value)}
                                />
                              </label>
                              <label className={styles.field}>
                                <span>Гражданство</span>
                                <input
                                  value={pos.staffForm?.citizenship || ''}
                                  onChange={e => handleStaffFormChange(idx, 'citizenship', e.target.value)}
                                  placeholder="Гражданство"
                                />
                              </label>
                              <label className={styles.field}>
                                <span>Регистрация</span>
                                <input
                                  value={pos.staffForm?.registration || ''}
                                  onChange={e => handleStaffFormChange(idx, 'registration', e.target.value)}
                                  placeholder="Адрес регистрации"
                                />
                              </label>
                              <label className={styles.field}>
                                <span>Тип отношений</span>
                                <select
                                  value={pos.staffForm?.contractType || ''}
                                  onChange={e => handleStaffFormChange(idx, 'contractType', e.target.value)}
                                >
                                  {CONTRACT_TYPES.map(ct => (
                                    <option key={ct.value} value={ct.value}>{ct.label}</option>
                                  ))}
                                </select>
                              </label>
                              <label className={styles.field}>
                                <span>Отдел</span>
                                <input
                                  value={pos.staffForm?.department || ''}
                                  onChange={e => handleStaffFormChange(idx, 'department', e.target.value)}
                                  placeholder="Отдел"
                                />
                              </label>
                              <label className={styles.field}>
                                <span>Email</span>
                                <input
                                  type="email"
                                  value={pos.staffForm?.email || ''}
                                  onChange={e => handleStaffFormChange(idx, 'email', e.target.value)}
                                  placeholder="Email"
                                />
                              </label>
                              <label className={styles.field}>
                                <span>Телефон</span>
                                <input
                                  type="tel"
                                  value={pos.staffForm?.phone || ''}
                                  onChange={e => handleStaffFormChange(idx, 'phone', e.target.value)}
                                  placeholder="+7..."
                                />
                              </label>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button className={styles.addPositionBtn} onClick={addPosition}>
                <Plus size={16} />
                <span>Добавить вакансию</span>
              </button>
            </>
          )}
        </div>

        {!loading && !done && currentStore && (
          <div className={styles.footer}>
            <button
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 size={16} className={styles.spinner} /> : <Check size={16} />}
              <span>{isLastStore ? 'Сохранить и завершить' : 'Сохранить и продолжить'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerLsForm;
