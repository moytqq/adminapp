'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ChevronDown, ArrowLeft } from 'lucide-react';
import { autoSettingsApi, AddressOption, TtkRow } from '@/services/autoSettingsApi';
import styles from './TtkMatrix.module.scss';

const DRINK_LABELS: Record<string, string> = {
  co_mi02: 'Кофе с молоком 200мл',
  ca02: 'Капучино 200мл',
  ca03: 'Капучино 300мл',
  ca04: 'Капучино 400мл',
  ca_w: 'Капучино (сотрудники)',
  la02: 'Латте 200мл',
  la03: 'Латте 300мл',
  la04: 'Латте 400мл',
  ess: 'Эспрессо',
  am02: 'Американо 200мл',
  am03: 'Американо 300мл',
  am_w: 'Американо (сотрудники)',
  te03: 'Чай 300мл',
};

interface RowState {
  coeff: string;
  dirty: boolean;
  saving: boolean;
}

interface Props {
  onBack?: () => void;
}

export default function TtkMatrix({ onBack }: Props) {
  const [addresses, setAddresses] = useState<AddressOption[]>([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [rows, setRows] = useState<TtkRow[]>([]);
  const [rowState, setRowState] = useState<Record<string, RowState>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    autoSettingsApi.getAddresses().then(list => {
      setAddresses(list);
      if (list.length > 0) setSelectedAddress(list[0].address_code);
    });
  }, []);

  const load = useCallback(async (addr: string) => {
    setLoading(true);
    const data = await autoSettingsApi.getTtk(addr);
    setRows(data);
    const state: Record<string, RowState> = {};
    for (const r of data) {
      state[rowKey(r)] = { coeff: String(r.coeff), dirty: false, saving: false };
    }
    setRowState(state);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (selectedAddress) load(selectedAddress);
  }, [selectedAddress, load]);

  const rowKey = (r: TtkRow) => `${r.drink_code}:${r.sku_id}`;

  const handleChange = (r: TtkRow, value: string) => {
    const key = rowKey(r);
    setRowState(prev => ({ ...prev, [key]: { ...prev[key], coeff: value, dirty: true } }));
  };

  const handleSave = async (r: TtkRow) => {
    const key = rowKey(r);
    const val = parseFloat(rowState[key]?.coeff ?? '');
    if (isNaN(val) || val < 0) return;
    setRowState(prev => ({ ...prev, [key]: { ...prev[key], saving: true } }));
    const ok = await autoSettingsApi.updateTtk(selectedAddress, r.drink_code, r.sku_id, val);
    if (ok) {
      setRowState(prev => ({ ...prev, [key]: { ...prev[key], dirty: false, saving: false } }));
      load(selectedAddress);
    } else {
      setRowState(prev => ({ ...prev, [key]: { ...prev[key], saving: false } }));
    }
  };

  const handleReset = async (r: TtkRow) => {
    if (!r.is_override) return;
    const ok = await autoSettingsApi.resetTtk(selectedAddress, r.drink_code, r.sku_id);
    if (ok) load(selectedAddress);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className="typeSelectorBackButtonGray" onClick={onBack}>
          <ArrowLeft size={20} />
          <span>Назад</span>
        </button>
        <h2>ТТК — матрица расхода</h2>
        <div className={styles.addressSelect}>
          <div className={styles.selectWrapper}>
            <select value={selectedAddress} onChange={e => setSelectedAddress(e.target.value)}>
              {addresses.map(a => (
                <option key={a.address_code} value={a.address_code}>{a.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className={styles.chevron} />
          </div>
        </div>
      </div>

      <div className={styles.hint}>
        Оранжевые строки — адресные переопределения (отличаются от глобального значения).
        Чтобы вернуть глобальное — нажмите «Сброс».
      </div>

      {loading ? (
        <div className={styles.loading}>Загрузка...</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Напиток</th>
                <th>SKU ID</th>
                <th>Коэффициент</th>
                <th>Глобальный</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const key = rowKey(r);
                const state = rowState[key];
                return (
                  <tr
                    key={key}
                    className={
                      state?.dirty ? styles.rowDirty
                      : r.is_override ? styles.rowOverride
                      : undefined
                    }
                  >
                    <td>
                      <div className={styles.drinkCode}>{r.drink_code}</div>
                      <div className={styles.drinkLabel}>{DRINK_LABELS[r.drink_code] ?? ''}</div>
                    </td>
                    <td>{r.sku_id}</td>
                    <td>
                      <div className={styles.coeffCell}>
                        <input
                          type="number"
                          step="0.0001"
                          min="0"
                          className={styles.inputNum}
                          value={state?.coeff ?? r.coeff}
                          onChange={e => handleChange(r, e.target.value)}
                        />
                        {r.is_override && !state?.dirty && (
                          <span className={styles.overrideBadge}>адресный</span>
                        )}
                      </div>
                    </td>
                    <td className={styles.globalCoeff}>
                      {r.global_coeff !== null ? r.global_coeff : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {state?.dirty && (
                          <button
                            className={styles.saveBtn}
                            disabled={state.saving}
                            onClick={() => handleSave(r)}
                          >
                            {state.saving ? '...' : 'Сохранить'}
                          </button>
                        )}
                        {r.is_override && !state?.dirty && (
                          <button className={styles.resetBtn} onClick={() => handleReset(r)}>
                            Сброс
                          </button>
                        )}
                      </div>
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
}
