// services/pdfExportAutoOrdersService.ts
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface OrderItem {
  id: number;
  order_id: string;
  address: string;
  supplier: string;
  product_id: number;
  count: number;
  date: string;
  product_name: string;
  packaging_supplier: string;
  supplier_name: string;
}

interface GroupedItem {
  groupKey: string;
  groupName: string;
  items: OrderItem[];
  totalCount: number;
}

interface AutoOrdersExportOptions {
  fileName?: string;
  rowsPerPage?: number;
  quality?: 'low' | 'medium' | 'high';
}

export const pdfExportAutoOrdersService = {
  chunkRows: <T>(rows: T[], rowsPerPage: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < rows.length; i += rowsPerPage) {
      chunks.push(rows.slice(i, i + rowsPerPage));
    }
    return chunks;
  },

  createTableHTML: (
    items: OrderItem[],
    title: string,
    groupName: string,
    pageNumber: number,
    totalPages: number,
    isFirstPage: boolean,
    totalCount: number
  ): HTMLElement => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.padding = '10px';
    container.style.backgroundColor = 'white';
    container.style.fontFamily = 'Arial, sans-serif';

    const header = document.createElement('div');
    header.style.textAlign = 'center';
    header.style.marginBottom = '10px';

    let headerHtml = `
      <h2 style="margin: 0 0 4px 0; font-size: 14px; color: #333;">${title}</h2>
      <h3 style="margin: 0 0 4px 0; font-size: 12px; color: #666; font-weight: 500;">${groupName}</h3>
    `;

    headerHtml += `
      ${!isFirstPage ? `<p style="margin: 0; font-size: 10px; color: #666;">Продолжение таблицы</p>` : ''}
      <p style="margin: 4px 0 0 0; font-size: 9px; color: #999;">Страница ${pageNumber} из ${totalPages}</p>
    `;

    header.innerHTML = headerHtml;
    container.appendChild(header);

    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.fontSize = '9px';
    table.style.border = '1px solid #d5d5d5';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.style.backgroundColor = '#f5f5f5';

    const thProduct = document.createElement('th');
    thProduct.textContent = 'Наименование';
    thProduct.style.padding = '6px 6px';
    thProduct.style.border = '1px solid #d5d5d5';
    thProduct.style.textAlign = 'left';
    thProduct.style.fontWeight = '600';
    thProduct.style.backgroundColor = '#4472c4';
    thProduct.style.color = '#ffffff';
    headerRow.appendChild(thProduct);

    const thCount = document.createElement('th');
    thCount.textContent = 'Кол-во';
    thCount.style.padding = '6px 6px';
    thCount.style.border = '1px solid #d5d5d5';
    thCount.style.textAlign = 'center';
    thCount.style.fontWeight = '600';
    thCount.style.backgroundColor = '#4472c4';
    thCount.style.color = '#ffffff';
    thCount.style.width = '80px';
    headerRow.appendChild(thCount);

    const thPackaging = document.createElement('th');
    thPackaging.textContent = 'Фасовка';
    thPackaging.style.padding = '6px 6px';
    thPackaging.style.border = '1px solid #d5d5d5';
    thPackaging.style.textAlign = 'center';
    thPackaging.style.fontWeight = '600';
    thPackaging.style.backgroundColor = '#4472c4';
    thPackaging.style.color = '#ffffff';
    thPackaging.style.width = '100px';
    headerRow.appendChild(thPackaging);

    const thDate = document.createElement('th');
    thDate.textContent = 'Дата';
    thDate.style.padding = '6px 6px';
    thDate.style.border = '1px solid #d5d5d5';
    thDate.style.textAlign = 'center';
    thDate.style.fontWeight = '600';
    thDate.style.backgroundColor = '#4472c4';
    thDate.style.color = '#ffffff';
    thDate.style.width = '100px';
    headerRow.appendChild(thDate);

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    items.forEach((item, rowIndex) => {
      const tr = document.createElement('tr');
      tr.style.backgroundColor = rowIndex % 2 === 0 ? '#ffffff' : '#d9e1f2';

      const tdProduct = document.createElement('td');
      tdProduct.textContent = item.product_name;
      tdProduct.style.padding = '4px 6px';
      tdProduct.style.border = '1px solid #d5d5d5';
      tdProduct.style.textAlign = 'left';
      tdProduct.style.fontWeight = '500';
      tdProduct.style.wordBreak = 'break-word';
      tr.appendChild(tdProduct);

      const tdCount = document.createElement('td');
      tdCount.textContent = item.count.toString();
      tdCount.style.padding = '4px 6px';
      tdCount.style.border = '1px solid #d5d5d5';
      tdCount.style.textAlign = 'center';
      tr.appendChild(tdCount);

      const tdPackaging = document.createElement('td');
      tdPackaging.textContent = item.packaging_supplier;
      tdPackaging.style.padding = '4px 6px';
      tdPackaging.style.border = '1px solid #d5d5d5';
      tdPackaging.style.textAlign = 'center';
      tr.appendChild(tdPackaging);

      const tdDate = document.createElement('td');
      tdDate.textContent = new Date(item.date).toLocaleDateString('ru-RU');
      tdDate.style.padding = '4px 6px';
      tdDate.style.border = '1px solid #d5d5d5';
      tdDate.style.textAlign = 'center';
      tr.appendChild(tdDate);

      tbody.appendChild(tr);
    });

    if (totalCount > 0) {
      const totalTr = document.createElement('tr');
      totalTr.style.backgroundColor = '#8aabe4';
      totalTr.style.fontWeight = '600';

      const tdTotalLabel = document.createElement('td');
      tdTotalLabel.textContent = 'ИТОГО';
      tdTotalLabel.style.padding = '6px 6px';
      tdTotalLabel.style.border = '1px solid #d5d5d5';
      tdTotalLabel.style.textAlign = 'left';
      tdTotalLabel.style.fontWeight = '600';
      tdTotalLabel.style.backgroundColor = '#8aabe4';
      tdTotalLabel.style.color = '#000000';
      totalTr.appendChild(tdTotalLabel);

      const tdTotalCount = document.createElement('td');
      tdTotalCount.textContent = totalCount.toString();
      tdTotalCount.style.padding = '6px 6px';
      tdTotalCount.style.border = '1px solid #d5d5d5';
      tdTotalCount.style.textAlign = 'center';
      tdTotalCount.style.fontWeight = '600';
      tdTotalCount.style.backgroundColor = '#8aabe4';
      tdTotalCount.style.color = '#000000';
      totalTr.appendChild(tdTotalCount);

      const tdEmpty1 = document.createElement('td');
      tdEmpty1.style.padding = '6px 6px';
      tdEmpty1.style.border = '1px solid #d5d5d5';
      tdEmpty1.style.backgroundColor = '#8aabe4';
      totalTr.appendChild(tdEmpty1);

      const tdEmpty2 = document.createElement('td');
      tdEmpty2.style.padding = '6px 6px';
      tdEmpty2.style.border = '1px solid #d5d5d5';
      tdEmpty2.style.backgroundColor = '#8aabe4';
      totalTr.appendChild(tdEmpty2);

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

    const imgData = canvas.toDataURL('image/jpeg', settings.compression);

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

  exportAutoOrdersToPdf: async (
    groupedData: GroupedItem[],
    selectedMonthName: string,
    selectedType: 'address' | 'supplier',
    selectedOptionLabel: string,
    selectedWeekLabel: string,
    options: AutoOrdersExportOptions = {}
  ): Promise<void> => {
    const {
      fileName = `Автозаказы_${selectedMonthName}_${selectedOptionLabel}_${new Date().toLocaleDateString('ru-RU')}`,
      rowsPerPage = 30,
      quality = 'medium',
    } = options;

    console.log(`Exporting auto orders PDF with ${rowsPerPage} rows per page, quality: ${quality}`);
    console.log(`Groups: ${groupedData.length}`);

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 8;

    const title = `Автозаказы\n${selectedMonthName}\n${selectedType === 'address' ? 'Поставщик' : 'Адрес'}: ${selectedOptionLabel}\nПериод: ${selectedWeekLabel}`;

    let isFirstPage = true;
    let pageCounter = 1;
    let totalPages = 0;

    // Подсчитываем общее количество страниц
    for (const group of groupedData) {
      const chunks = pdfExportAutoOrdersService.chunkRows(group.items, rowsPerPage);
      totalPages += chunks.length;
    }

    // Экспортируем каждую группу
    for (const group of groupedData) {
      const chunks = pdfExportAutoOrdersService.chunkRows(group.items, rowsPerPage);
      const groupName = group.groupName;

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const isLastChunk = i === chunks.length - 1;
        const totalCount = isLastChunk ? group.totalCount : 0;

        const tableHTML = pdfExportAutoOrdersService.createTableHTML(
          chunk,
          title,
          `${selectedType === 'address' ? 'Поставщик' : 'Адрес'}: ${groupName}`,
          pageCounter,
          totalPages,
          isFirstPage && pageCounter === 1,
          totalCount
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

        if (!isFirstPage) {
          pdf.addPage();
        }

        await pdfExportAutoOrdersService.renderToPDFPage(tableHTML, pdf, pdfWidth, pdfHeight, margin, quality);

        document.body.removeChild(tempDiv);

        isFirstPage = false;
        pageCounter++;
      }
    }

    pdf.save(`${fileName}.pdf`);
    console.log(`PDF saved: ${fileName}.pdf (${totalPages} pages)`);
  },
};