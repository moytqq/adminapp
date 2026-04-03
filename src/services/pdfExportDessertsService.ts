import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface DessertsTableRow {
  productName: string;
  totalCount: number;
  totalSum: number;
  months: Array<{
    label: string;
    count: number;
    sum: number;
    changePercent: number | null;
  }>;
}

interface DessertsTotalRow {
  isTotal: true;
  totalCount: number;
  totalSum: number;
  monthsTotal: Array<{
    count: number;
    sum: number;
    changePercent: number | null;
  }>;
}

interface DessertsExportOptions {
  fileName?: string;
  address?: string;
  rowsPerPage?: number;
  quality?: 'low' | 'medium' | 'high';
}

export const pdfExportDessertsService = {
  chunkRows: <T>(rows: T[], rowsPerPage: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < rows.length; i += rowsPerPage) {
      chunks.push(rows.slice(i, i + rowsPerPage));
    }
    return chunks;
  },

  formatChangePercent: (percent: number | null): string => {
    if (percent === null) return '';
    const sign = percent > 0 ? '+' : '';
    return `${sign}${percent.toFixed(1)}%`;
  },

  createTableHTML: (
    rows: DessertsTableRow[],
    months: Array<{ label: string; fullLabel: string }>,
    title: string,
    pageNumber: number,
    totalPages: number,
    isFirstPage: boolean,
    totalRow: DessertsTotalRow | null = null
  ): HTMLElement => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.padding = '10px';
    container.style.backgroundColor = 'white';
    container.style.fontFamily = 'Arial, sans-serif';

    // Заголовок
    const header = document.createElement('div');
    header.style.textAlign = 'center';
    header.style.marginBottom = '10px';
    header.innerHTML = `
      <h2 style="margin: 0 0 4px 0; font-size: 14px; color: #333;">${title}</h2>
      ${!isFirstPage ? `<p style="margin: 0; font-size: 10px; color: #666;">Продолжение таблицы</p>` : ''}
      <p style="margin: 4px 0 0 0; font-size: 9px; color: #999;">Страница ${pageNumber} из ${totalPages}</p>
    `;
    container.appendChild(header);

    // Таблица
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.fontSize = '9px';
    table.style.border = '1px solid #e0e0e0';

    // Заголовок таблицы
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.style.backgroundColor = '#f5f5f5';

    const thProduct = document.createElement('th');
    thProduct.textContent = 'Товар';
    thProduct.style.padding = '6px 6px';
    thProduct.style.border = '1px solid #e0e0e0';
    thProduct.style.textAlign = 'left';
    thProduct.style.fontWeight = '600';
    thProduct.style.backgroundColor = '#f5f5f5';
    headerRow.appendChild(thProduct);

    months.forEach(month => {
      const th = document.createElement('th');
      th.textContent = month.label;
      th.style.padding = '6px 6px';
      th.style.border = '1px solid #e0e0e0';
      th.style.textAlign = 'center';
      th.style.fontWeight = '600';
      th.style.backgroundColor = '#fafafa';
      th.style.minWidth = '70px';
      headerRow.appendChild(th);
    });

    const thTotal = document.createElement('th');
    thTotal.textContent = 'Итого';
    thTotal.style.padding = '6px 6px';
    thTotal.style.border = '1px solid #e0e0e0';
    thTotal.style.textAlign = 'center';
    thTotal.style.fontWeight = '600';
    thTotal.style.backgroundColor = '#e8f4fd';
    headerRow.appendChild(thTotal);

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Тело таблицы
    const tbody = document.createElement('tbody');

    rows.forEach((row, rowIndex) => {
      const tr = document.createElement('tr');
      tr.style.backgroundColor = rowIndex % 2 === 0 ? '#ffffff' : '#fafafa';

      const tdProduct = document.createElement('td');
      tdProduct.textContent = row.productName;
      tdProduct.style.padding = '4px 6px'; // Уменьшил с 8px до 4px
      tdProduct.style.border = '1px solid #e0e0e0';
      tdProduct.style.textAlign = 'left';
      tdProduct.style.fontWeight = '500';
      tdProduct.style.maxWidth = '120px'; // Уменьшил с 150px до 120px
      tdProduct.style.wordBreak = 'break-word';
      tr.appendChild(tdProduct);

      row.months.forEach(monthData => {
        const td = document.createElement('td');
        td.style.padding = '4px 4px'; // Уменьшил с 8px 6px до 4px 4px
        td.style.border = '1px solid #e0e0e0';
        td.style.textAlign = 'center';
        td.style.verticalAlign = 'middle';

        let changeHtml = '';
        if (monthData.changePercent !== null && monthData.changePercent !== 0) {
          const changeColor = monthData.changePercent >= 0 ? '#2e7d32' : '#c62828';
          changeHtml = `<div style="font-size: 7px; margin-top: 2px; color: ${changeColor}; font-weight: 500;">${pdfExportDessertsService.formatChangePercent(monthData.changePercent)}</div>`;
        }

        td.innerHTML = `
          <div style="font-weight: 600; font-size: 10px;">${monthData.count.toLocaleString('ru-RU')}</div>
          <div style="color: #666; font-size: 9px;">${monthData.sum.toLocaleString('ru-RU')} ₽</div>
          ${changeHtml}
        `;
        tr.appendChild(td);
      });

      const tdTotal = document.createElement('td');
      tdTotal.style.padding = '4px 6px';
      tdTotal.style.border = '1px solid #e0e0e0';
      tdTotal.style.textAlign = 'center';
      tdTotal.style.backgroundColor = '#e8f4fd';
      tdTotal.style.fontWeight = '600';
      tdTotal.innerHTML = `
        <div style="font-size: 10px;">${row.totalCount.toLocaleString('ru-RU')}</div>
        <div style="font-size: 9px;">${row.totalSum.toLocaleString('ru-RU')} ₽</div>
      `;
      tr.appendChild(tdTotal);

      tbody.appendChild(tr);
    });

    // Итоговая строка
    if (totalRow) {
      const totalTr = document.createElement('tr');
      totalTr.style.backgroundColor = '#f5f5f5';
      totalTr.style.fontWeight = '600';

      const tdTotalLabel = document.createElement('td');
      tdTotalLabel.textContent = 'ИТОГО';
      tdTotalLabel.style.padding = '6px 6px';
      tdTotalLabel.style.border = '1px solid #e0e0e0';
      tdTotalLabel.style.textAlign = 'left';
      tdTotalLabel.style.fontWeight = '700';
      tdTotalLabel.style.backgroundColor = '#e8f4fd';
      totalTr.appendChild(tdTotalLabel);

      totalRow.monthsTotal.forEach(monthTotal => {
        const td = document.createElement('td');
        td.style.padding = '4px 4px';
        td.style.border = '1px solid #e0e0e0';
        td.style.textAlign = 'center';
        td.style.backgroundColor = '#e8f4fd';
        td.style.fontWeight = '600';

        let changeHtml = '';
        if (monthTotal.changePercent !== null && monthTotal.changePercent !== 0) {
          const changeColor = monthTotal.changePercent >= 0 ? '#2e7d32' : '#c62828';
          changeHtml = `<div style="font-size: 7px; margin-top: 2px; color: ${changeColor};">${pdfExportDessertsService.formatChangePercent(monthTotal.changePercent)}</div>`;
        }

        td.innerHTML = `
          <div style="font-size: 10px;">${monthTotal.count.toLocaleString('ru-RU')}</div>
          <div style="font-size: 9px;">${monthTotal.sum.toLocaleString('ru-RU')} ₽</div>
          ${changeHtml}
        `;
        totalTr.appendChild(td);
      });

      const tdGrandTotal = document.createElement('td');
      tdGrandTotal.style.padding = '4px 6px';
      tdGrandTotal.style.border = '1px solid #e0e0e0';
      tdGrandTotal.style.textAlign = 'center';
      tdGrandTotal.style.backgroundColor = '#e8f4fd';
      tdGrandTotal.style.fontWeight = '700';
      tdGrandTotal.innerHTML = `
        <div style="font-size: 10px;">${totalRow.totalCount.toLocaleString('ru-RU')}</div>
        <div style="font-size: 9px;">${totalRow.totalSum.toLocaleString('ru-RU')} ₽</div>
      `;
      totalTr.appendChild(tdGrandTotal);

      tbody.appendChild(totalTr);
    }

    table.appendChild(tbody);
    container.appendChild(table);

    return container;
  },

  renderToPDFPage: async (
    element: HTMLElement,
    pdf: jsPDF,
    pdfWidth: number,
    pdfHeight: number,
    margin: number,
    quality: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<void> => {
    const qualitySettings = {
      low: { scale: 1, compression: 0.7 },
      medium: { scale: 1.5, compression: 0.8 },
      high: { scale: 2, compression: 0.9 }
    };

    const settings = qualitySettings[quality];

    const canvas = await html2canvas(element, {
      scale: settings.scale,
      logging: false,
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      allowTaint: false,
      imageTimeout: 0,
      removeContainer: true,
    });

    const imgData = canvas.toDataURL('image/jpeg', settings.compression); // Используем JPEG вместо PNG

    let imgWidth = pdfWidth - (margin * 2);
    let imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight > pdfHeight - margin * 2) {
      imgHeight = pdfHeight - margin * 2;
      imgWidth = (canvas.width * imgHeight) / canvas.height;
    }

    const xOffset = (pdfWidth - imgWidth) / 2;
    const yOffset = margin;

    pdf.addImage(imgData, 'JPEG', xOffset, yOffset, imgWidth, imgHeight, undefined, 'FAST');
  },

  exportDessertsToPdf: async (
    productRows: any[],
    months: Array<{ key: string; label: string; fullLabel: string }>,
    address: string,
    options: DessertsExportOptions = {}
  ): Promise<void> => {
    const {
      fileName = `Десерты_${address}_${new Date().toLocaleDateString('ru-RU')}`,
      address: reportAddress = address,
      rowsPerPage = 18,
      quality = 'medium',
    } = options;

    console.log(`Exporting desserts PDF with ${rowsPerPage} rows per page, quality: ${quality}`);

    const dessertsData: DessertsTableRow[] = productRows.map(product => {
      const monthData = months.map((month, idx) => {
        const currentData = product.months[month.key] || { count: 0, sum: 0 };
        const previousData = idx > 0
          ? product.months[months[idx - 1].key] || { count: 0, sum: 0 }
          : null;

        let changePercent: number | null = null;
        if (idx > 0 && previousData && previousData.sum > 0) {
          changePercent = ((currentData.sum - previousData.sum) / previousData.sum) * 100;
        }

        return {
          label: month.label,
          count: currentData.count,
          sum: currentData.sum,
          changePercent,
        };
      });

      return {
        productName: product.productName,
        totalCount: product.totalCount,
        totalSum: product.totalSum,
        months: monthData,
      };
    });

    const sortedData = [...dessertsData].sort((a, b) => b.totalSum - a.totalSum);

    const monthlyTotals = months.map((_, idx) => {
      let totalCount = 0;
      let totalSum = 0;

      dessertsData.forEach(product => {
        const monthData = product.months[idx];
        totalCount += monthData.count;
        totalSum += monthData.sum;
      });

      let changePercent: number | null = null;
      if (idx > 0) {
        let previousTotalSum = 0;
        dessertsData.forEach(product => {
          const previousMonthData = product.months[idx - 1];
          previousTotalSum += previousMonthData.sum;
        });
        if (previousTotalSum > 0) {
          changePercent = ((totalSum - previousTotalSum) / previousTotalSum) * 100;
        }
      }

      return {
        count: totalCount,
        sum: totalSum,
        changePercent,
      };
    });

    const grandTotal = {
      count: dessertsData.reduce((sum, p) => sum + p.totalCount, 0),
      sum: dessertsData.reduce((sum, p) => sum + p.totalSum, 0),
    };

    const totalRow: DessertsTotalRow = {
      isTotal: true,
      totalCount: grandTotal.count,
      totalSum: grandTotal.sum,
      monthsTotal: monthlyTotals,
    };

    const chunks = pdfExportDessertsService.chunkRows(sortedData, rowsPerPage);
    const totalPages = chunks.length;

    const title = `Отчет по продажам: Десерты\n${reportAddress}\n${new Date().toLocaleDateString('ru-RU')}`;

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 8;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const isFirstPage = i === 0;
      const isLastPage = i === chunks.length - 1;

      const tableHTML = pdfExportDessertsService.createTableHTML(
        chunk,
        months,
        title,
        i + 1,
        totalPages,
        isFirstPage,
        isLastPage ? totalRow : null
      );

      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.width = 'auto';
      tempDiv.style.height = 'auto';
      tempDiv.appendChild(tableHTML);
      document.body.appendChild(tempDiv);

      await new Promise(resolve => setTimeout(resolve, 50));

      if (i > 0) {
        pdf.addPage();
      }

      await pdfExportDessertsService.renderToPDFPage(tableHTML, pdf, pdfWidth, pdfHeight, margin, quality);

      document.body.removeChild(tempDiv);
    }

    pdf.save(`${fileName}.pdf`);
    console.log(`PDF saved: ${fileName}.pdf (${totalPages} pages)`);
  },
};