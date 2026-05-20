'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { autoSettingsApi, AddressOption, SkuItemSetting } from '@/services/autoSettingsApi';
import styles from './ItemsMatrix.module.scss';

const FACTOR_STEPS = [0.8, 0.9, 1.0, 1.1, 1.2];

interface ItemsMatrixProps {
  onBack?: () => void;
}

const ItemsMatrix: React.FC<ItemsMatrixProps> = ({ onBack }) => {
  const [addresses, setAddresses] = useState<AddressOption[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [items, setItems] = useState<SkuItemSetting[]>([]);
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
    autoSettingsApi.getItemSettings(selectedAddress).then(data => {
      setItems(data);
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
        prev.map(i => (i.sku_id === item.sku_id ? { ...i, ...edits } : i)),
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
                <th>Множитель расхода</th>
                <th>Кратность заказа</th>
                <th>Кратность упак.</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const edited = getEdit(item);
                const hasChanges = !!editValues[item.sku_id] && Object.keys(editValues[item.sku_id]).length > 0;
                const isSaving = saving[item.sku_id];

                return (
                  <tr key={item.sku_id} className={hasChanges ? styles.rowDirty : ''}>
                    <td>
                      <div className={styles.skuName}>{item.sku_name ?? `SKU ${item.sku_id}`}</div>
                      {item.sku_name_short && (
                        <div className={styles.skuShort}>{item.sku_name_short}</div>
                      )}
                    </td>
                    <td>{edited.packaging ?? <span className={styles.null}>—</span>}</td>
                    <td>
                      <input
                        className={styles.inputSmall}
                        value={edited.supplier_role ?? ''}
                        placeholder="не указан"
                        onChange={e => handleChange(item.sku_id, 'supplier_role', e.target.value || null)}
                      />
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
                      <div className={styles.sliderWrap}>
                        <span className={styles.sliderValue}>{(edited.consumption_factor ?? 1.0).toFixed(1)}×</span>
                        <input
                          type="range"
                          min={0}
                          max={4}
                          step={1}
                          value={factorStep(edited.consumption_factor ?? 1.0)}
                          onChange={e => handleChange(item.sku_id, 'consumption_factor', FACTOR_STEPS[parseInt(e.target.value)])}
                          className={styles.slider}
                        />
                        <div className={styles.sliderTicks}>
                          {FACTOR_STEPS.map(s => (
                            <span key={s}>{s}</span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td>
                      <input
                        className={styles.inputNum}
                        type="number"
                        value={edited.order_multiple ?? ''}
                        placeholder="—"
                        min={0}
                        step={1}
                        onChange={e => handleChange(item.sku_id, 'order_multiple', e.target.value === '' ? null : parseFloat(e.target.value))}
                      />
                    </td>
                    <td>
                      <input
                        className={styles.inputNum}
                        type="number"
                        value={edited.packaging_multiple ?? ''}
                        placeholder="—"
                        min={0}
                        step={1}
                        onChange={e => handleChange(item.sku_id, 'packaging_multiple', e.target.value === '' ? null : parseFloat(e.target.value))}
                      />
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
