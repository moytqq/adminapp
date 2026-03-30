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

export const exportService = {
  exportToExcel: (data: ExportData, fileName: string) => {
    const workbook = XLSX.utils.book_new();

    const worksheet = XLSX.utils.aoa_to_sheet([data.headers, ...data.rows]);

    if (data.columnWidths) {
      worksheet['!cols'] = data.columnWidths;
    }

    const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
    for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
      const address = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!worksheet[address]) continue;
      worksheet[address].s = {
        font: { bold: true, sz: 12 },
        fill: { fgColor: { rgb: "E0E0E0" } },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, data.sheetName);

    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  },

  exportSalesReport: (
    address: string,
    months: { key: string; label: string; fullLabel: string }[],
    productRows: any[],
    monthlyTotals: Record<string, { count: number; sum: number }>,
    grandTotal: { count: number; sum: number }
  ) => {
    const headers: string[] = ['Товар'];

    months.forEach(month => {
      headers.push(`${month.fullLabel} (кол-во)`, `${month.fullLabel} (сумма)`);
    });
    headers.push('Итого (кол-во)', 'Итого (сумма)');

    const rows: (string | number)[][] = [];

    productRows.forEach(product => {
      const row: (string | number)[] = [product.productName];

      months.forEach(month => {
        const monthData = product.months[month.key] || { count: 0, sum: 0 };
        row.push(monthData.count, monthData.sum);
      });

      row.push(product.totalCount, product.totalSum);
      rows.push(row);
    });

    const totalRow: (string | number)[] = ['ИТОГО'];
    months.forEach(month => {
      totalRow.push(monthlyTotals[month.key]?.count || 0, monthlyTotals[month.key]?.sum || 0);
    });
    totalRow.push(grandTotal.count, grandTotal.sum);
    rows.push(totalRow);

    //Ширина колонок
    const columnWidths = [
      { wch: 25 }, // Название товара
      ...months.flatMap(() => [{ wch: 22 }, { wch: 22 }]), // Кол-во и сумма для каждого месяца
      { wch: 15 }, // Итого кол-во
      { wch: 15 }, // Итого сумма
    ];

    exportService.exportToExcel({
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
      csvRows.push(row.join(';'));
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