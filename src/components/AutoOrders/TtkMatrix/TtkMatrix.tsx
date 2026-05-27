'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ChevronDown, ArrowLeft } from 'lucide-react';
import { autoSettingsApi, AddressOption, TtkRow } from '@/services/autoSettingsApi';
import styles from './TtkMatrix.module.scss';

const DRINK_LABELS: Record<string, string> = {
  co_mi02: 'Кофе с молоком 200 мл',
  ca02: 'Капучино 200 мл',
  ca03: 'Капучино 300 мл',
  ca04: 'Капучино 400 мл',
  ca_w: 'Капучино (сотрудники)',
  la02: 'Латте 200 мл',
  la03: 'Латте 300 мл',
  la04: 'Латте 400 мл',
  ess: 'Эспрессо',
  am02: 'Американо 200 мл',
  am03: 'Американо 300 мл',
  am_w: 'Американо (сотрудники)',
  te03: 'Чай 300 мл',
};

const DRINK_ORDER = [
  'ca02','ca03','ca04','ca_w',
  'la02','la03','la04',
  'co_mi02',
  'ess','am02','am03','am_w',
  'te03',
];

interface RowState {
  ourVal: string;
  supVal: string;
  lastEdited: 'our' | 'sup';
  dirty: boolean;
  saving: boolean;
}

interface Props {
  onBack?: () => void;
}

function round6(n: number) {
  return Math.round(n * 1_000_000) / 1_000_000;
}

function toSup(ourVal: number, pm: number | null): string {
  if (!pm || pm === 0) return '';
  return String(round6(ourVal * pm));
}

function toOur(supVal: number, pm: number | null): string {
  if (!pm || pm === 0) return '';
  return String(round6(supVal / pm));
}

export default function TtkMatrix({ onBack }: Props) {
  const [addresses, setAddresses] = useState<AddressOption[]>([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [rows, setRows] = useState<TtkRow[]>([]);
  const [rowState, setRowState] = useState<Record<string, RowState>>({});
  const [loading, setLoading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
      state[rowKey(r)] = {
        ourVal: String(r.coeff),
        supVal: toSup(r.coeff, r.packaging_multiple),
        lastEdited: 'our',
        dirty: false,
        saving: false,
      };
    }
    setRowState(state);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (selectedAddress) load(selectedAddress);
  }, [selectedAddress, load]);

  const rowKey = (r: Pick<TtkRow, 'drink_code' | 'sku_id'>) =>
    `${r.drink_code}:${r.sku_id}`;

  const handleOurChange = (r: TtkRow, value: string) => {
    const key = rowKey(r);
    const num = parseFloat(value);
    const supVal = isNaN(num) ? '' : toSup(num, r.packaging_multiple);
    setRowState(prev => ({
      ...prev,
      [key]: { ...prev[key], ourVal: value, supVal, lastEdited: 'our', dirty: true },
    }));
  };

  const handleSupChange = (r: TtkRow, value: string) => {
    const key = rowKey(r);
    const num = parseFloat(value);
    const ourVal = isNaN(num) ? '' : toOur(num, r.packaging_multiple);
    setRowState(prev => ({
      ...prev,
      [key]: { ...prev[key], supVal: value, ourVal, lastEdited: 'sup', dirty: true },
    }));
  };

  const handleSave = async (r: TtkRow) => {
    const key = rowKey(r);
    const st = rowState[key];
    const val = parseFloat(st.ourVal);
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

  const grouped = new Map<string, TtkRow[]>();
  for (const r of rows) {
    if (!grouped.has(r.drink_code)) grouped.set(r.drink_code, []);
    grouped.get(r.drink_code)!.push(r);
  }

  const sortedDrinks = [
    ...DRINK_ORDER.filter(d => grouped.has(d)),
    ...[...grouped.keys()].filter(d => !DRINK_ORDER.includes(d)).sort(),
  ];

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

      {loading ? (
        <div className={styles.loading}>Загрузка...</div>
      ) : (
        <div className={styles.scrollableContainer} ref={scrollContainerRef}>
          <div className={styles.tableWrapper}>
            {sortedDrinks.map(drinkCode => {
              const drinkRows = grouped.get(drinkCode)!;
              return (
                <div key={drinkCode} className={styles.drinkGroup}>
                  <div className={styles.drinkHeader}>
                    <span className={styles.drinkName}>
                      {DRINK_LABELS[drinkCode] ?? drinkCode}
                    </span>
                  </div>
                  <div className={styles.tableScrollWrapper}>
                    <div className={styles.tableContainer}>
                      <table className={styles.table}>
                        <thead>
                        <tr>
                          <th className={styles.ingredientCol}>Ингредиент</th>
                          <th className={styles.ourPackCol}>Наша фасовка</th>
                          <th className={styles.supPackCol}>Фасовка поставщика</th>
                          <th className={styles.actionsCol}></th>
                        </tr>
                        </thead>
                        <tbody>
                        {drinkRows.map(r => {
                          const key = rowKey(r);
                          const st = rowState[key];
                          const hasPm = r.packaging_multiple !== null && r.packaging_multiple !== 0;
                          return (
                            <tr
                              key={key}
                              className={
                                st?.dirty ? styles.rowDirty
                                  : r.is_override ? styles.rowOverride
                                    : undefined
                              }
                            >
                              <td className={styles.ingredientCell}>
                                  <span className={styles.ingredientName}>
                                    {r.sku_name_short ?? `SKU ${r.sku_id}`}
                                  </span>
                                {r.is_override && !st?.dirty && (
                                  <span className={styles.overrideBadge}>адресный</span>
                                )}
                              </td>

                              <td className={styles.ourPackCell}>
                                <div className={styles.inputWithUnit}>
                                  <input
                                    type="number"
                                    step="0.0001"
                                    min="0"
                                    className={styles.inputNum}
                                    value={st?.ourVal ?? r.coeff}
                                    onChange={e => handleOurChange(r, e.target.value)}
                                  />
                                  {r.packaging && (
                                    <span className={styles.unitLabel}>{r.packaging}</span>
                                  )}
                                </div>
                                {r.global_coeff !== null && r.is_override && !st?.dirty && (
                                  <div className={styles.globalHint}>
                                    глобальный: {r.global_coeff} {r.packaging}
                                  </div>
                                )}
                              </td>

                              <td className={styles.supPackCell}>
                                {hasPm ? (
                                  <div className={styles.inputWithUnit}>
                                    <input
                                      type="number"
                                      step="0.000001"
                                      min="0"
                                      className={styles.inputNum}
                                      value={st?.supVal ?? ''}
                                      onChange={e => handleSupChange(r, e.target.value)}
                                    />
                                    {r.packaging_supplier && (
                                      <span className={styles.unitLabel}>{r.packaging_supplier}</span>
                                    )}
                                  </div>
                                ) : (
                                  <span className={styles.noConvert}>
                                      {r.packaging_supplier ?? '—'}
                                    </span>
                                )}
                              </td>

                              <td className={styles.actionsCell}>
                                <div className={styles.actions}>
                                  {st?.dirty && (
                                    <button
                                      className={styles.saveBtn}
                                      disabled={st.saving}
                                      onClick={() => handleSave(r)}
                                    >
                                      {st.saving ? '...' : 'Сохранить'}
                                    </button>
                                  )}
                                  {r.is_override && !st?.dirty && (
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
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}