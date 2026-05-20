'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { autoSettingsApi, AddressOption, SkuItemSetting, SupplierOption } from '@/services/autoSettingsApi';
import styles from './ItemsMatrix.module.scss';

const FACTOR_STEPS = [0.8, 0.9, 1.0, 1.1, 1.2];

interface ItemsMatrixProps {
  onBack?: () => void;
}

const ItemsMatrix: React.FC<ItemsMatrixProps> = ({ onBack }) => {
  const [addresses, setAddresses] = useState<AddressOption[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [items, setItems] = useState<SkuItemSetting[]>([]);
  const [supplierOptions, setSupplierOptions] = useState<SupplierOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<Record<number, boolean>>({});
  const [editValues, setEditValues] = useState<Record<number, Partial<SkuItemSetting>>>({});

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
    autoSettingsApi.getItemSettings(selectedAddress).then(({ items: data, supplierOptions: opts }) => {
      setItems(data);
      setSupplierOptions(opts);
      setLoading(false);
    });
  }, [selectedAddress]);

  const getEdit = (item: SkuItemSetting) => ({
    ...item,
    ...(editValues[item.sku_id] || {}),
  });

  const handleChange = (sku_id: number, field: string, value: any) => {
    setEditValues(prev => ({
      ...prev,
      [sku_id]: { ...(prev[sku_id] || {}), [field]: value },
    }));
  };

  const handleSave = useCallback(async (item: SkuItemSetting) => {
    const edits = editValues[item.sku_id];
    if (!edits || Object.keys(edits).length === 0) return;

    setSaving(prev => ({ ...prev, [item.sku_id]: true }));
    const ok = await autoSettingsApi.updateItemSetting(selectedAddress, item.sku_id, edits);
    if (ok) {
      setItems(prev =>
        prev.map(i => {
          if (i.sku_id !== item.sku_id) return i;
          const updated = { ...i, ...edits };
          const base = updated.daily_consumption_base;
          updated.daily_consumption_effective = base !== null
            ? Math.round(base * updated.consumption_factor * 1000) / 1000
            : null;
          return updated;
        }),
      );
      setEditValues(prev => {
        const next = { ...prev };
        delete next[item.sku_id];
        return next;
      });
    }
    setSaving(prev => ({ ...prev, [item.sku_id]: false }));
  }, [editValues, selectedAddress]);

  const factorStep = (value: number) => FACTOR_STEPS.indexOf(Math.round(value * 10) / 10);

  const supplierName = (role: string | null) =>
    supplierOptions.find(s => s.role === role)?.name ?? null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className="typeSelectorBackButtonGray" onClick={onBack}>
          <ArrowLeft size={20} />
          <span>Назад</span>
        </button>
        <h2>Товарная матрица</h2>

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
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Товар</th>
                <th>Упаковка</th>
                <th>Поставщик</th>
                <th>НЗ</th>
                <th>Макс. запас</th>
                <th>Расход/сут</th>
                <th>Множитель</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const edited = getEdit(item);
                const hasChanges = !!editValues[item.sku_id] && Object.keys(editValues[item.sku_id]).length > 0;
                const isSaving = saving[item.sku_id];

                // Вычисляем эффективный расход с учётом текущего значения слайдера
                const baseConsumption = edited.daily_consumption_base;
                const effectiveConsumption = baseConsumption !== null
                  ? Math.round(baseConsumption * edited.consumption_factor * 1000) / 1000
                  : null;

                return (
                  <tr key={item.sku_id} className={hasChanges ? styles.rowDirty : ''}>
                    <td>
                      <div className={styles.skuName}>
                        {item.sku_name_short ?? item.sku_name ?? `SKU ${item.sku_id}`}
                      </div>
                      {item.sku_name_short && item.sku_name && (
                        <div className={styles.skuFull}>{item.sku_name}</div>
                      )}
                    </td>
                    <td className={styles.cellMuted}>
                      {edited.packaging ?? '—'}
                    </td>
                    <td>
                      <div className={styles.selectWrapper}>
                        <select
                          className={styles.supplierSelect}
                          value={edited.supplier_role ?? ''}
                          onChange={e => handleChange(item.sku_id, 'supplier_role', e.target.value || null)}
                        >
                          <option value="">— не указан —</option>
                          {supplierOptions.map(s => (
                            <option key={s.role} value={s.role}>{s.name}</option>
                          ))}
                        </select>
                        <ChevronDown size={12} className={styles.chevronSmall} />
                      </div>
                      {edited.supplier_role && (
                        <div className={styles.supplierRole}>{edited.supplier_role}</div>
                      )}
                    </td>
                    <td>
                      <input
                        className={styles.inputNum}
                        type="number"
                        value={edited.nz ?? ''}
                        placeholder="—"
                        min={0}
                        step={0.1}
                        onChange={e => handleChange(item.sku_id, 'nz', e.target.value === '' ? null : parseFloat(e.target.value))}
                      />
                    </td>
                    <td>
                      <input
                        className={styles.inputNum}
                        type="number"
                        value={edited.max_stock ?? ''}
                        placeholder="—"
                        min={0}
                        step={0.1}
                        onChange={e => handleChange(item.sku_id, 'max_stock', e.target.value === '' ? null : parseFloat(e.target.value))}
                      />
                    </td>
                    <td>
                      {baseConsumption !== null ? (
                        <div className={styles.consumptionCell}>
                          <span className={styles.consumptionEffective}>{effectiveConsumption}</span>
                          {edited.consumption_factor !== 1.0 && (
                            <span className={styles.consumptionBase}>база: {baseConsumption}</span>
                          )}
                        </div>
                      ) : (
                        <span className={styles.cellMuted}>—</span>
                      )}
                    </td>
                    <td>
                      <div className={styles.sliderWrap}>
                        <span className={styles.sliderValue}>{edited.consumption_factor.toFixed(1)}×</span>
                        <input
                          type="range"
                          min={0}
                          max={4}
                          step={1}
                          value={factorStep(edited.consumption_factor)}
                          onChange={e => handleChange(item.sku_id, 'consumption_factor', FACTOR_STEPS[parseInt(e.target.value)])}
                          className={`${styles.slider} ${edited.consumption_factor !== 1.0 ? styles.sliderModified : ''}`}
                        />
                        <div className={styles.sliderTicks}>
                          {FACTOR_STEPS.map(s => (
                            <span key={s}>{s}</span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td>
                      {hasChanges && (
                        <button
                          className={styles.saveBtn}
                          onClick={() => handleSave(item)}
                          disabled={isSaving}
                        >
                          {isSaving ? '...' : 'Сохр.'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ItemsMatrix;
