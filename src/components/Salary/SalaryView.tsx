'use client';

import React, { useState } from 'react';
import MonthSelector from './MonthSelector';
import SalaryTable from './SalaryTable';
import SalaryDetailsTable from './SalaryDetailsTable';
import { format } from 'date-fns';
import styles from './SalaryView.module.scss';

interface SelectedPerson {
  id: number;
  name: string;
}

const SalaryView: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM-01'));
  const [selectedPerson, setSelectedPerson] = useState<SelectedPerson | null>(null);

  const handleSelectPerson = (id: number, name: string) => {
    setSelectedPerson({ id, name });
  };

  const handleBack = () => {
    setSelectedPerson(null);
  };

  return (
    <div className={styles.salaryView}>
      <div className={styles.header}>
        <h2>Заработная плата</h2>
        <MonthSelector selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
      </div>

      <div className={styles.content}>
        {selectedPerson ? (
          <SalaryDetailsTable
            month={selectedMonth}
            personId={selectedPerson.id}
            personName={selectedPerson.name}
            onBack={handleBack}
          />
        ) : (
          <SalaryTable
            month={selectedMonth}
            onSelectPerson={handleSelectPerson}
            selectedPersonId={undefined}
          />
        )}
      </div>
    </div>
  );
};

export default SalaryView;