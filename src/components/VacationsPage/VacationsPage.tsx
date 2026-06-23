'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CalendarDays, ChevronDown, ChevronUp, Upload, FileText, X, Check, Loader2, Search } from 'lucide-react';
import { personalApi } from '@/services/personalApi';
import { getUserFlags } from '@/services/api';
import styles from './VacationsPage.module.scss';

const FILES_URL = process.env.NEXT_PUBLIC_FILES_URL ?? '';

interface VacationEntry {
  lsid: string;
  fio: string;
  positionName: string;
  storeName: string;
  storeHid: number;
  vacationStart: string | null;
  vacationEnd: string | null;
  period: number;
}

interface Employee {
  lsid: string;
  fio: string;
  positionName: string;
  storeName: string;
}

function formatPeriod(start: string | null, end: string | null) {
  if (start && end) return `${start} — ${end}`;
  if (start) return `с ${start}`;
  if (end) return `до ${end}`;
  return '—';
}

function groupByStore(vacations: VacationEntry[]) {
  const map = new Map<string, { storeName: string; entries: VacationEntry[] }>();
  for (const v of vacations) {
    const key = String(v.storeHid);
    if (!map.has(key)) map.set(key, { storeName: v.storeName, entries: [] });
    map.get(key)!.entries.push(v);
  }
  return [...map.values()];
}

export default function VacationsPage({ onBack }: { onBack: () => void }) {
  const flags = getUserFlags();
  const isAdmin = flags.includes('ADMIN');

  const [vacations, setVacations] = useState<VacationEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sampleFilename, setSampleFilename] = useState<string | null>(null);
  const [loadingVacations, setLoadingVacations] = useState(true);
  const [expandedStores, setExpandedStores] = useState<Set<string>>(new Set());
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  // Application form state
  const [appTab, setAppTab] = useState<'upcoming' | 'all'>('upcoming');
  const [selectedLsid, setSelectedLsid] = useState<string>('');
  const [appComment, setAppComment] = useState('');
  const [appFile, setAppFile] = useState<File | null>(null);
  const [appSubmitting, setAppSubmitting] = useState(false);
  const [appDone, setAppDone] = useState(false);
  const [appError, setAppError] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');

  // Sample upload state
  const [uploadingSample, setUploadingample] = useState(false);
  const sampleInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoadingVacations(true);
    personalApi.getUpcomingVacations()
      .then(data => {
        setVacations(data.vacations || []);
        // Auto-expand first store
        const groups = groupByStore(data.vacations || []);
        if (groups.length > 0) setExpandedStores(new Set([String((data.vacations || [])[0]?.storeHid)]));
      })
      .catch(() => setVacations([]))
      .finally(() => setLoadingVacations(false));

    personalApi.getVacationSample()
      .then(data => setSampleFilename(data.filename || null))
      .catch(() => {});

    personalApi.getMyStaffForVacations()
      .then(data => setEmployees(data.employees || []))
      .catch(() => {});
  }, []);

  const toggleStore = (key: string) => {
    setExpandedStores(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSampleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingample(true);
    try {
      const data = await personalApi.uploadVacationSample(file);
      if (data.status === 'success') setSampleFilename(data.filename);
    } catch {}
    setUploadingample(false);
    e.target.value = '';
  };

  const handleSubmit = async () => {
    if (!selectedLsid) { setAppError('Выберите сотрудника'); return; }
    setAppSubmitting(true);
    setAppError('');
    try {
      const data = await personalApi.submitVacationApplication(selectedLsid, appComment, appFile);
      if (data.status === 'success') {
        setAppDone(true);
      } else {
        setAppError(data.message || 'Ошибка при отправке');
      }
    } catch {
      setAppError('Ошибка при отправке');
    }
    setAppSubmitting(false);
  };

  const resetForm = () => {
    setSelectedLsid('');
    setAppComment('');
    setAppFile(null);
    setAppDone(false);
    setAppError('');
    setAppTab('upcoming');
    setEmployeeSearch('');
  };

  const storeGroups = groupByStore(vacations);
  const filteredEmployees = employeeSearch
    ? employees.filter(e => e.fio.toLowerCase().includes(employeeSearch.toLowerCase()) ||
        e.storeName.toLowerCase().includes(employeeSearch.toLowerCase()))
    : employees;

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={18} />
          <span>Назад</span>
        </button>
        <h1 className={styles.pageTitle}>
          <CalendarDays size={22} />
          Отпуска
        </h1>
      </div>

      <div className={styles.infoCard}>
        <p className={styles.infoText}>
          Необходимо за <strong>две недели</strong> подать заявление на отпуск.
        </p>
      </div>

      {/* Upcoming vacations */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Отпуска ваших сотрудников</h2>
        {loadingVacations ? (
          <div className={styles.centered}><Loader2 size={24} className={styles.spinner} /></div>
        ) : storeGroups.length === 0 ? (
          <p className={styles.emptyText}>Нет предстоящих отпусков</p>
        ) : (
          <div className={styles.storeList}>
            {storeGroups.map(group => {
              const key = String(group.entries[0].storeHid);
              const open = expandedStores.has(key);
              return (
                <div key={key} className={styles.storeCard}>
                  <button className={styles.storeHeader} onClick={() => toggleStore(key)}>
                    <span className={styles.storeName}>{group.storeName}</span>
                    <span className={styles.storeBadge}>{group.entries.length}</span>
                    {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {open && (
                    <div className={styles.storeBody}>
                      {group.entries.map((v, i) => (
                        <div key={i} className={styles.vacationRow}>
                          <div className={styles.vacName}>{v.fio || '—'}</div>
                          <div className={styles.vacPos}>{v.positionName}</div>
                          <div className={styles.vacPeriod}>
                            <CalendarDays size={13} />
                            {formatPeriod(v.vacationStart, v.vacationEnd)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Sample buttons */}
      <section className={styles.sampleSection}>
        <button
          className={styles.sampleBtn}
          disabled={!sampleFilename}
          onClick={() => sampleFilename && window.open(`${FILES_URL}/files/${sampleFilename}`, '_blank')}
        >
          <FileText size={18} />
          Пример заявления
        </button>
        {isAdmin && (
          <>
            <button
              className={styles.uploadSampleBtn}
              onClick={() => sampleInputRef.current?.click()}
              disabled={uploadingSample}
            >
              {uploadingSample ? <Loader2 size={16} className={styles.spinner} /> : <Upload size={16} />}
              Подгрузить пример
            </button>
            <input
              ref={sampleInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.docx,.doc"
              style={{ display: 'none' }}
              onChange={handleSampleUpload}
            />
          </>
        )}
      </section>

      {/* Application form */}
      <section className={styles.section}>
        <button
          className={styles.attachBtn}
          onClick={() => { setShowApplicationForm(v => !v); resetForm(); }}
        >
          <Upload size={18} />
          {showApplicationForm ? 'Скрыть форму' : 'Прикрепить заявление на отпуск'}
        </button>

        {showApplicationForm && (
          <div className={styles.appForm}>
            {appDone ? (
              <div className={styles.doneBanner}>
                <Check size={28} className={styles.doneIcon} />
                <p className={styles.doneText}>Заявление отправлено</p>
                <button className={styles.resetBtn} onClick={resetForm}>Отправить ещё</button>
              </div>
            ) : (
              <>
                <h3 className={styles.formTitle}>Выберите сотрудника</h3>
                <div className={styles.tabs}>
                  <button
                    className={`${styles.tab} ${appTab === 'upcoming' ? styles.tabActive : ''}`}
                    onClick={() => setAppTab('upcoming')}
                  >
                    Ближайшие отпуска
                  </button>
                  <button
                    className={`${styles.tab} ${appTab === 'all' ? styles.tabActive : ''}`}
                    onClick={() => setAppTab('all')}
                  >
                    Все сотрудники
                  </button>
                </div>

                {appTab === 'upcoming' && (
                  <div className={styles.pickList}>
                    {vacations.length === 0 && <p className={styles.emptyText}>Нет предстоящих отпусков</p>}
                    {vacations.map((v, i) => (
                      <button
                        key={i}
                        className={`${styles.pickItem} ${selectedLsid === v.lsid ? styles.pickItemActive : ''}`}
                        onClick={() => setSelectedLsid(v.lsid)}
                      >
                        <div className={styles.pickName}>{v.fio || v.positionName}</div>
                        <div className={styles.pickSub}>{v.storeName} · {formatPeriod(v.vacationStart, v.vacationEnd)}</div>
                      </button>
                    ))}
                  </div>
                )}

                {appTab === 'all' && (
                  <div className={styles.pickList}>
                    <div className={styles.searchWrap}>
                      <Search size={15} />
                      <input
                        className={styles.searchInput}
                        placeholder="Поиск по имени или адресу..."
                        value={employeeSearch}
                        onChange={e => setEmployeeSearch(e.target.value)}
                      />
                    </div>
                    {filteredEmployees.length === 0 && <p className={styles.emptyText}>Ничего не найдено</p>}
                    {filteredEmployees.map((emp, i) => (
                      <button
                        key={i}
                        className={`${styles.pickItem} ${selectedLsid === emp.lsid ? styles.pickItemActive : ''}`}
                        onClick={() => setSelectedLsid(emp.lsid)}
                      >
                        <div className={styles.pickName}>{emp.fio}</div>
                        <div className={styles.pickSub}>{emp.storeName} · {emp.positionName}</div>
                      </button>
                    ))}
                  </div>
                )}

                <div className={styles.formFields}>
                  <div className={styles.fileField}>
                    <span className={styles.fieldLabel}>Заявление (фото/скан)</span>
                    {appFile ? (
                      <div className={styles.filePreview}>
                        <span>{appFile.name}</span>
                        <button onClick={() => setAppFile(null)}><X size={14} /></button>
                      </div>
                    ) : (
                      <button className={styles.fileBtn} onClick={() => fileInputRef.current?.click()}>
                        <Upload size={15} />
                        Прикрепить файл
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.heic,.pdf"
                      style={{ display: 'none' }}
                      onChange={e => setAppFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  <div className={styles.commentField}>
                    <span className={styles.fieldLabel}>Комментарий к заявке</span>
                    <textarea
                      className={styles.commentInput}
                      placeholder="Дополнительные сведения..."
                      value={appComment}
                      onChange={e => setAppComment(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                {appError && <p className={styles.errorText}>{appError}</p>}

                <button
                  className={styles.submitBtn}
                  onClick={handleSubmit}
                  disabled={appSubmitting || !selectedLsid}
                >
                  {appSubmitting ? <Loader2 size={16} className={styles.spinner} /> : <Check size={16} />}
                  Отправить заявление
                </button>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
