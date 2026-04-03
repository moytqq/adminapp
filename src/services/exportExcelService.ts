import * as XLSX from 'xlsx';

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

export interface ExportData {
  sheetName: string;
  headers: string[];
  rows: (string | number)[][];
  columnWidths?: { wch: number }[];
}

export const exportExcelService = {
  exportToExcel: (data: ExportData, fileName: string) => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([data.headers, ...data.rows]);

    if (data.columnWidths) {
      worksheet['!cols'] = data.columnWidths;
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, data.sheetName);
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  },

  exportSalesReport: (
    address: string,
    months: { key: string; label: string; fullLabel: string }[],
    productRows: any[],
    monthlyTotals: Record<string, { count: number; sum: number }>,
    grandTotal: { count: number; sum: number },
    getChangePercent: (current: number, previous: number) => number | null
  ) => {
    const headers: string[] = ['Товар'];

    months.forEach(month => {
      headers.push(month.fullLabel);
    });
    headers.push('Итого');

    const rows: (string | number)[][] = [];

    productRows.forEach(product => {
      const row: (string | number)[] = [product.productName];

      months.forEach((month, idx) => {
        const currentData = product.months[month.key] || { count: 0, sum: 0 };
        const previousData = idx > 0 ? product.months[months[idx - 1].key] || { count: 0, sum: 0 } : null;

        let changeText = '';
        if (idx > 0 && previousData && previousData.sum > 0) {
          const change = getChangePercent(currentData.sum, previousData.sum);
          if (change !== null) {
            const sign = change > 0 ? '+' : '';
            changeText = ` (${sign}${change.toFixed(2)}%)`;
          }
        }

        row.push(`${currentData.count}\n${currentData.sum.toLocaleString('ru-RU')} ₽\n${changeText}`);
      });

      row.push(`${product.totalCount}\n${product.totalSum.toLocaleString('ru-RU')} ₽`);
      rows.push(row);
    });

    const totalRow: (string | number)[] = ['ИТОГО'];

    months.forEach((month, idx) => {
      const currentTotal = monthlyTotals[month.key] || { count: 0, sum: 0 };
      const previousTotal = idx > 0 ? monthlyTotals[months[idx - 1].key] || { count: 0, sum: 0 } : null;

      let changeText = '';
      if (idx > 0 && previousTotal && previousTotal.sum > 0) {
        const change = getChangePercent(currentTotal.sum, previousTotal.sum);
        if (change !== null) {
          const sign = change > 0 ? '+' : '';
          changeText = ` (${sign}${change.toFixed(2)}%)`;
        }
      }

      totalRow.push(`${currentTotal.count}\n${currentTotal.sum.toLocaleString('ru-RU')} ₽\n${changeText}`);
    });

    totalRow.push(`${grandTotal.count}\n${grandTotal.sum.toLocaleString('ru-RU')} ₽`);
    rows.push(totalRow);

    // Ширина колонок
    const columnWidths = [
      { wch: 20 }, // Название товара
      ...months.map(() => ({ wch: 15 })), // Ширина месяца
      { wch: 15 }, // Итого
    ];

    exportExcelService.exportToExcel({
      sheetName: `Отчет_${address}`,
      headers,
      rows,
      columnWidths,
    }, `Отчет_по_продажам_${address}_${new Date().toLocaleDateString('ru-RU')}`);
  },

  exportToCSV: (data: ExportData, fileName: string) => {
    const csvRows: string[] = [];
    csvRows.push(data.headers.join(';'));

    data.rows.forEach(row => {
      const processedRow = row.map(cell =>
        String(cell).replace(/\n/g, ' ').replace(/"/g, '""')
      );
      csvRows.push(processedRow.join(';'));
    });

    const blob = new Blob(["\uFEFF" + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};