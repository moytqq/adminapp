'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { autoSettingsApi, AddressOption, SupplierSetting } from '@/services/autoSettingsApi';
import styles from './SupplierSettings.module.scss';

const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

interface SupplierSettingsProps {
  onBack?: () => void;
}

type EditMap = Record<number, Partial<SupplierSetting>>;

const parseDays = (str: string | null): number[] => {
  if (!str) return [];
  return str.split(',').map(Number).filter(n => !isNaN(n) && n >= 0 && n <= 6);
};

const formatDays = (days: number[]): string => days.sort((a, b) => a - b).join(',');

const SupplierSettingsComponent: React.FC<SupplierSettingsProps> = ({ onBack }) => {
  const [addresses, setAddresses] = useState<AddressOption[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [suppliers, setSuppliers] = useState<SupplierSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<Record<number, boolean>>({});
  const [editValues, setEditValues] = useState<EditMap>({});

  useEffect(() => {
    autoSettingsApi.getAddresses().then(data => {
      setAddresses(data);
      if (data.length > 0) setSelectedAddress(data[0].address_code);
    });
  }, []);

  useEffect(() => {
    if (!selectedAddress) return;
    setLoading(true);
    setEditValues({});
    autoSettingsApi.getSupplierSettings(selectedAddress).then(data => {
      setSuppliers(data);
      setLoading(false);
    });
  }, [selectedAddress]);

  const getEdit = (s: SupplierSetting) => ({
    ...s,
    ...(editValues[s.id] || {}),
  });

  const handleChange = (id: number, field: string, value: any) => {
    setEditValues(prev => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [field]: value },
    }));
  };

  const toggleDay = (id: number, currentDays: string | null, day: number) => {
    const days = parseDays(currentDays);
    const next = days.includes(day) ? days.filter(d => d !== day) : [...days, day];
    handleChange(id, 'delivery_days', formatDays(next));
  };

  const handleSave = useCallback(async (s: SupplierSetting) => {
    const edits = editValues[s.id];
    if (!edits || Object.keys(edits).length === 0) return;

    setSaving(prev => ({ ...prev, [s.id]: true }));
    const ok = await autoSettingsApi.updateSupplierSetting(selectedAddress, s.supplier_role, edits);
    if (ok) {
      setSuppliers(prev =>
        prev.map(sup => (sup.id === s.id ? { ...sup, ...edits } : sup)),
      );
      setEditValues(prev => {
        const next = { ...prev };
        delete next[s.id];
        return next;
      });
    }
    setSaving(prev => ({ ...prev, [s.id]: false }));
  }, [editValues, selectedAddress]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className="typeSelectorBackButtonGray" onClick={onBack}>
          <ArrowLeft size={20} />
          <span>Назад</span>
        </button>
        <h2>Поставщики</h2>

        <div className={styles.addressSelect}>
          <div className={styles.selectWrapper}>
            <select
              value={selectedAddress}
              onChange={e => setSelectedAddress(e.target.value)}
            >
              {addresses.map(a => (
                <option key={a.address_code} value={a.address_code}>
                  {a.address_code} — {a.name}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className={styles.chevron} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Загрузка...</div>
      ) : (
        <div className={styles.cards}>
          {suppliers.map(s => {
            const edited = getEdit(s);
            const hasChanges = !!editValues[s.id] && Object.keys(editValues[s.id]).length > 0;
            const isSaving = saving[s.id];
            const days = parseDays(edited.delivery_days);

            return (
              <div
                key={s.id}
                className={`${styles.card} ${hasChanges ? styles.cardDirty : ''}`}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.supplierName}>{edited.supplier_name}</div>
                  <div className={styles.supplierRole}>{edited.supplier_role}</div>
                </div>

                <div className={styles.field}>
                  <label>Дни доставки</label>
                  <div className={styles.dayButtons}>
                    {DAY_LABELS.map((label, idx) => (
                      <button
                        key={idx}
                        className={`${styles.dayBtn} ${days.includes(idx) ? styles.dayActive : ''}`}
                        onClick={() => toggleDay(s.id, edited.delivery_days, idx)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label>Заявка за, дн.</label>
                    <input
                      type="number"
                      className={styles.inputNum}
                      value={edited.lead_time_days ?? ''}
                      placeholder="—"
                      min={0}
                      step={1}
                      onChange={e =>
                        handleChange(s.id, 'lead_time_days', e.target.value === '' ? null : parseInt(e.target.value))
                      }
                    />
                  </div>

                  <div className={styles.field}>
                    <label>Мин. сумма, ₽</label>
                    <input
                      type="number"
                      className={styles.inputNum}
                      value={edited.min_order_sum ?? ''}
                      placeholder="—"
                      min={0}
                      step={100}
                      onChange={e =>
                        handleChange(s.id, 'min_order_sum', e.target.value === '' ? null : parseFloat(e.target.value))
                      }
                    />
                  </div>

                  <div className={styles.field}>
                    <label>Через РЦ</label>
                    <button
                      className={`${styles.toggleBtn} ${edited.via_rc ? styles.toggleOn : ''}`}
                      onClick={() => handleChange(s.id, 'via_rc', edited.via_rc ? 0 : 1)}
                    >
                      {edited.via_rc ? 'Да' : 'Нет'}
                    </button>
                  </div>
                </div>

                {hasChanges && (
                  <button
                    className={styles.saveBtn}
                    onClick={() => handleSave(s)}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Сохранение...' : 'Сохранить'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SupplierSettingsComponent;
