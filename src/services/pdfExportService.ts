// services/pdfExportService.ts

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PdfExportOptions {
  fileName?: string;
  title?: string;
  orientation?: 'portrait' | 'landscape';
  scale?: number;
}

export const pdfExportService = {
  /**
   * Экспорт HTML элемента в PDF
   */
  exportToPdf: async (
    element: HTMLElement,
    options: PdfExportOptions = {}
  ) => {
    const {
      fileName = `report_${new Date().toLocaleDateString('ru-RU')}`,
      title = '',
      orientation = 'landscape',
      scale = 2,
    } = options;

    try {
      // Создаем временный контейнер для клонирования элемента
      const originalElement = element;
      const cloneContainer = document.createElement('div');
      cloneContainer.style.position = 'absolute';
      cloneContainer.style.left = '-9999px';
      cloneContainer.style.top = '-9999px';
      cloneContainer.style.width = `${originalElement.scrollWidth}px`;
      document.body.appendChild(cloneContainer);

      // Клонируем элемент
      const clone = originalElement.cloneNode(true) as HTMLElement;
      clone.style.width = `${originalElement.scrollWidth}px`;
      clone.style.margin = '0';
      clone.style.padding = '0';
      clone.style.background = 'white';

      // Добавляем заголовок
      if (title) {
        const titleElement = document.createElement('div');
        titleElement.style.textAlign = 'center';
        titleElement.style.marginBottom = '20px';
        titleElement.style.fontSize = '12px';
        titleElement.style.fontWeight = 'bold';
        titleElement.style.color = '#333';
        titleElement.textContent = title;
        clone.insertBefore(titleElement, clone.firstChild);
      }

      cloneContainer.appendChild(clone);

      // Создаем PDF
      const canvas = await html2canvas(clone, {
        scale,
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }

      pdf.save(`${fileName}.pdf`);

      // Очищаем временные элементы
      document.body.removeChild(cloneContainer);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      throw error;
    }
  },

  /**
   * Экспорт таблицы отчетов в PDF
   */
  exportReportToPdf: async (
    tableElement: HTMLElement,
    address: string,
    reportType: string
  ) => {
    const title = `Отчет по продажам ${reportType}\n${address}\n${new Date().toLocaleDateString('ru-RU')}`;

    await pdfExportService.exportToPdf(tableElement, {
      fileName: `Отчет_${address}_${new Date().toLocaleDateString('ru-RU')}`,
      title,
      orientation: 'landscape',
      scale: 2,
    });
  },
};