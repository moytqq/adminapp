import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface DrinksTableRow {
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

interface DrinksTotalRow {
  isTotal: true;
  totalCount: number;
  totalSum: number;
  monthsTotal: Array<{
    count: number;
    sum: number;
    changePercent: number | null;
  }>;
}

interface DrinksExportOptions {
  fileName?: string;
  address?: string;
  rowsPerPage?: number;
}

export const pdfExportDrinksService = {
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
    rows: DrinksTableRow[],
    months: Array<{ label: string; fullLabel: string }>,
    title: string,
    pageNumber: number,
    totalPages: number,
    isFirstPage: boolean,
    totalRow: DrinksTotalRow | null = null
  ): HTMLElement => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.padding = '20px';
    container.style.backgroundColor = 'white';
    container.style.fontFamily = 'Arial, sans-serif';

    // Заголовок
    const header = document.createElement('div');
    header.style.textAlign = 'center';
    header.style.marginBottom = '20px';
    header.innerHTML = `
      <h2 style="margin: 0 0 8px 0; font-size: 16px; color: #333;">${title}</h2>
      ${!isFirstPage ? `<p style="margin: 0; font-size: 12px; color: #666;">Продолжение таблицы</p>` : ''}
      <p style="margin: 8px 0 0 0; font-size: 11px; color: #999;">Страница ${pageNumber} из ${totalPages}</p>
    `;
    container.appendChild(header);

    // Таблица
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.fontSize = '11px';
    table.style.border = '1px solid #e0e0e0';

    // Заголовок таблицы
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.style.backgroundColor = '#f5f5f5';

    const thProduct = document.createElement('th');
    thProduct.textContent = 'Товар';
    thProduct.style.padding = '10px 8px';
    thProduct.style.border = '1px solid #e0e0e0';
    thProduct.style.textAlign = 'left';
    thProduct.style.fontWeight = '600';
    thProduct.style.backgroundColor = '#f5f5f5';
    headerRow.appendChild(thProduct);

    months.forEach(month => {
      const th = document.createElement('th');
      th.textContent = month.label;
      th.style.padding = '10px 8px';
      th.style.border = '1px solid #e0e0e0';
      th.style.textAlign = 'center';
      th.style.fontWeight = '600';
      th.style.backgroundColor = '#fafafa';
      th.style.minWidth = '90px';
      headerRow.appendChild(th);
    });

    const thTotal = document.createElement('th');
    thTotal.textContent = 'Итого';
    thTotal.style.padding = '10px 8px';
    thTotal.style.border = '1px solid #e0e0e0';
    thTotal.style.textAlign = 'center';
    thTotal.style.fontWeight = '600';
    thTotal.style.backgroundColor = '#e3f2fd';
    headerRow.appendChild(thTotal);

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Тело таблицы
    const tbody = document.createElement('tbody');

    rows.forEach((row, rowIndex) => {
      const tr = document.createElement('tr');
      tr.style.backgroundColor = rowIndex % 2 === 0 ? '#ffffff' : '#fafafa';

      // Название товара
      const tdProduct = document.createElement('td');
      tdProduct.textContent = row.productName;
      tdProduct.style.padding = '8px';
      tdProduct.style.border = '1px solid #e0e0e0';
      tdProduct.style.textAlign = 'left';
      tdProduct.style.fontWeight = '500';
      tdProduct.style.maxWidth = '180px';
      tdProduct.style.wordBreak = 'break-word';
      tr.appendChild(tdProduct);

      // Данные по месяцам
      row.months.forEach(monthData => {
        const td = document.createElement('td');
        td.style.padding = '8px 6px';
        td.style.border = '1px solid #e0e0e0';
        td.style.textAlign = 'center';
        td.style.verticalAlign = 'middle';

        let changeHtml = '';
        if (monthData.changePercent !== null && monthData.changePercent !== 0) {
          const changeColor = monthData.changePercent >= 0 ? '#2e7d32' : '#c62828';
          changeHtml = `<div style="font-size: 9px; margin-top: 4px; color: ${changeColor}; font-weight: 500;">${pdfExportDrinksService.formatChangePercent(monthData.changePercent)}</div>`;
        }

        td.innerHTML = `
          <div style="font-weight: 600; font-size: 12px;">${monthData.count.toLocaleString('ru-RU')}</div>
          <div style="color: #666; font-size: 11px;">${monthData.sum.toLocaleString('ru-RU')} ₽</div>
          ${changeHtml}
        `;
        tr.appendChild(td);
      });

      // Итого по товару
      const tdTotal = document.createElement('td');
      tdTotal.style.padding = '8px';
      tdTotal.style.border = '1px solid #e0e0e0';
      tdTotal.style.textAlign = 'center';
      tdTotal.style.backgroundColor = '#e3f2fd';
      tdTotal.style.fontWeight = '600';
      tdTotal.innerHTML = `
        <div style="font-size: 12px;">${row.totalCount.toLocaleString('ru-RU')}</div>
        <div style="font-size: 11px;">${row.totalSum.toLocaleString('ru-RU')} ₽</div>
      `;
      tr.appendChild(tdTotal);

      tbody.appendChild(tr);
    });

    // Итоговая строка
    if (totalRow) {
      const totalTr = document.createElement('tr');
      totalTr.style.backgroundColor = '#f5f5f5';
      totalTr.style.fontWeight = '600';

      // Ячейка "ИТОГО"
      const tdTotalLabel = document.createElement('td');
      tdTotalLabel.textContent = 'ИТОГО';
      tdTotalLabel.style.padding = '10px 8px';
      tdTotalLabel.style.border = '1px solid #e0e0e0';
      tdTotalLabel.style.textAlign = 'left';
      tdTotalLabel.style.fontWeight = '700';
      tdTotalLabel.style.backgroundColor = '#e8f4fd';
      totalTr.appendChild(tdTotalLabel);

      // Итоги по месяцам
      totalRow.monthsTotal.forEach(monthTotal => {
        const td = document.createElement('td');
        td.style.padding = '8px 6px';
        td.style.border = '1px solid #e0e0e0';
        td.style.textAlign = 'center';
        td.style.backgroundColor = '#e8f4fd';
        td.style.fontWeight = '600';

        let changeHtml = '';
        if (monthTotal.changePercent !== null && monthTotal.changePercent !== 0) {
          const changeColor = monthTotal.changePercent >= 0 ? '#2e7d32' : '#c62828';
          changeHtml = `<div style="font-size: 9px; margin-top: 4px; color: ${changeColor};">${pdfExportDrinksService.formatChangePercent(monthTotal.changePercent)}</div>`;
        }

        td.innerHTML = `
          <div style="font-size: 12px;">${monthTotal.count.toLocaleString('ru-RU')}</div>
          <div style="font-size: 11px;">${monthTotal.sum.toLocaleString('ru-RU')} ₽</div>
          ${changeHtml}
        `;
        totalTr.appendChild(td);
      });

      // Общий итог
      const tdGrandTotal = document.createElement('td');
      tdGrandTotal.style.padding = '8px';
      tdGrandTotal.style.border = '1px solid #e0e0e0';
      tdGrandTotal.style.textAlign = 'center';
      tdGrandTotal.style.backgroundColor = '#e8f4fd';
      tdGrandTotal.style.fontWeight = '700';
      tdGrandTotal.innerHTML = `
        <div style="font-size: 12px;">${totalRow.totalCount.toLocaleString('ru-RU')}</div>
        <div style="font-size: 11px;">${totalRow.totalSum.toLocaleString('ru-RU')} ₽</div>
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
    margin: number
  ): Promise<void> => {
    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
    });

    const imgData = canvas.toDataURL('image/png');
    let imgWidth = pdfWidth - (margin * 2);
    let imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight > pdfHeight - margin * 2) {
      imgHeight = pdfHeight - margin * 2;
      imgWidth = (canvas.width * imgHeight) / canvas.height;
    }

    const xOffset = (pdfWidth - imgWidth) / 2;
    const yOffset = margin;

    pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);
  },

  exportDrinksToPdf: async (
    productRows: any[],
    months: Array<{ key: string; label: string; fullLabel: string }>,
    address: string,
    options: DrinksExportOptions = {}
  ): Promise<void> => {
    const {
      fileName = `Напитки_${address}_${new Date().toLocaleDateString('ru-RU')}`,
      address: reportAddress = address,
      rowsPerPage = 15,
    } = options;

    console.log(`Exporting drinks PDF with ${rowsPerPage} rows per page`);

    const drinksData: DrinksTableRow[] = productRows.map(product => {
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

    const sortedData = [...drinksData].sort((a, b) => b.totalSum - a.totalSum);

    const monthlyTotals = months.map((_, idx) => {
      let totalCount = 0;
      let totalSum = 0;

      drinksData.forEach(product => {
        const monthData = product.months[idx];
        totalCount += monthData.count;
        totalSum += monthData.sum;
      });

      let changePercent: number | null = null;
      if (idx > 0) {
        let previousTotalSum = 0;
        drinksData.forEach(product => {
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
      count: drinksData.reduce((sum, p) => sum + p.totalCount, 0),
      sum: drinksData.reduce((sum, p) => sum + p.totalSum, 0),
    };

    const totalRow: DrinksTotalRow = {
      isTotal: true,
      totalCount: grandTotal.count,
      totalSum: grandTotal.sum,
      monthsTotal: monthlyTotals,
    };

    const chunks = pdfExportDrinksService.chunkRows(sortedData, rowsPerPage);
    const totalPages = chunks.length;

    const title = `Отчет по продажам: Напитки\n${reportAddress}\n${new Date().toLocaleDateString('ru-RU')}`;

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const isFirstPage = i === 0;
      const isLastPage = i === chunks.length - 1;

      const tableHTML = pdfExportDrinksService.createTableHTML(
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

      await new Promise(resolve => setTimeout(resolve, 100));

      if (i > 0) {
        pdf.addPage();
      }

      await pdfExportDrinksService.renderToPDFPage(tableHTML, pdf, pdfWidth, pdfHeight, margin);

      document.body.removeChild(tempDiv);
    }

    pdf.save(`${fileName}.pdf`);
    console.log(`PDF saved: ${fileName}.pdf (${totalPages} pages)`);
  },
};