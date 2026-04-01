import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PdfExportOptions {
  fileName?: string;
  title?: string;
  orientation?: 'portrait' | 'landscape';
  scale?: number;
  margin?: number;
  isMobile?: boolean;
}

export const pdfExportService = {

  isMobileDevice: (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  },

  exportToPdf: async (
    element: HTMLElement,
    options: PdfExportOptions = {}
  ) => {
    const {
      fileName = `report_${new Date().toLocaleDateString('ru-RU')}`,
      title = '',
      orientation = 'landscape',
      scale = 2,
      margin = 5,
      isMobile = false,
    } = options;

    const originalOverflow = document.body.style.overflow;
    try {
      document.body.style.overflow = 'hidden';

      const baseFontSize = isMobile ? 10 : 16;
      const changeRowFontSize = Math.round(baseFontSize * 0.85);

      console.log(`Exporting PDF - isMobile: ${isMobile}, fontSize: ${baseFontSize}px`);

      const cloneContainer = document.createElement('div');
      cloneContainer.style.position = 'absolute';
      cloneContainer.style.left = '-9999px';
      cloneContainer.style.top = '-9999px';
      cloneContainer.style.width = 'auto';
      cloneContainer.style.minWidth = '1200px';
      cloneContainer.style.backgroundColor = 'white';
      cloneContainer.style.padding = '20px';
      document.body.appendChild(cloneContainer);

      const clone = element.cloneNode(true) as HTMLElement;

      clone.style.position = 'static';
      clone.style.transform = 'none';
      clone.style.width = '100%';
      clone.style.margin = '0';
      clone.style.padding = '0';
      clone.style.background = 'white';
      clone.style.overflow = 'visible';

      const stickyElements = clone.querySelectorAll('[style*="sticky"], [class*="sticky"]');
      stickyElements.forEach(el => {
        (el as HTMLElement).style.position = 'static';
        (el as HTMLElement).style.top = 'auto';
        (el as HTMLElement).style.left = 'auto';
      });

      const style = document.createElement('style');
      style.textContent = `
        /* Сброс всех sticky-эффектов */
        * {
          position: static !important;
          top: auto !important;
          left: auto !important;
          transform: none !important;
        }
        
        /* Переопределяем CSS переменную */
        :root {
          --reports-table-font-size: ${baseFontSize}px !important;
        }
        
        /* Принудительно устанавливаем размер шрифта для таблицы */
        .reportTable,
        .reportTable * {
          font-size: ${baseFontSize}px !important;
        }
        
        .reportTable th,
        .reportTable td {
          font-size: ${baseFontSize}px !important;
          padding: 2px 4px !important;
        }
        
        .changeRow {
          font-size: ${changeRowFontSize}px !important;
          padding: 2px 6px !important;
        }
        
        .combinedCell {
          font-size: ${baseFontSize}px !important;
          padding: 2px 4px !important;
        }
        
        .countRow,
        .sumRow {
          font-size: ${baseFontSize}px !important;
        }
        
        .totalCell {
          font-size: ${baseFontSize}px !important;
          padding: 6px 8px !important;
        }
        
        .totalCountRow,
        .totalSumRow {
          font-size: ${baseFontSize}px !important;
        }
        
        .monthHeader {
          font-size: ${baseFontSize}px !important;
        }
        
        .productCell {
          font-size: ${baseFontSize}px !important;
        }
        
        /* Убираем медиа-запросы */
        @media (max-width: 2000px) {
          .reportTable th,
          .reportTable td {
            padding: 2px 4px !important;
            font-size: ${baseFontSize}px !important;
          }
        }
        
        /* Убираем минимальную ширину для нормального отображения */
        .reportTable {
          min-width: auto !important;
          width: 100% !important;
        }
        
        .monthHeader {
          min-width: 75px !important;
        }
        
        .totalHeader {
          min-width: auto !important;
        }
        
        .productColumn {
          min-width: 50px !important;
        }
        
        /* Скрываем элементы управления */
        .controls,
        .fullscreenButton,
        .exportButtons,
        .fontSizeControls,
        .fullscreenOverlay,
        .fullscreenHeader,
        .fullscreenCloseButton,
        .noData {
          display: none !important;
        }
      `;
      clone.appendChild(style);

      const contentWrapper = document.createElement('div');
      contentWrapper.style.padding = `0 ${margin}px`;
      contentWrapper.style.width = '100%';
      contentWrapper.style.boxSizing = 'border-box';

      if (title) {
        const titleElement = document.createElement('div');
        titleElement.style.textAlign = 'center';
        titleElement.style.marginBottom = '20px';
        titleElement.style.fontSize = `${baseFontSize + 2}px`;
        titleElement.style.fontWeight = 'bold';
        titleElement.style.color = '#333';
        titleElement.textContent = title;
        contentWrapper.appendChild(titleElement);
      }

      contentWrapper.appendChild(clone);
      cloneContainer.appendChild(contentWrapper);

      await new Promise(resolve => setTimeout(resolve, 200));

      const canvas = await html2canvas(cloneContainer, {
        scale,
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: cloneContainer.scrollWidth,
        windowHeight: cloneContainer.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const availableWidth = pdfWidth - (margin * 2);
      let imgWidth = availableWidth;
      let imgHeight = (canvas.height * imgWidth) / canvas.width;

      const xOffset = margin;
      let yOffset = margin;

      let heightLeft = imgHeight;
      let position = -yOffset;

      pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
      position -= pdfHeight;

      while (heightLeft > 0) {
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', xOffset, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
        position -= pdfHeight;
      }

      pdf.save(`${fileName}.pdf`);

      document.body.removeChild(cloneContainer);
      document.body.style.overflow = originalOverflow;
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      document.body.style.overflow = originalOverflow;
      throw error;
    }
  },

  exportReportToPdf: async (
    tableElement: HTMLElement,
    address: string,
    reportType: string
  ) => {
    const title = `Отчет по продажам ${reportType}\n${address}\n${new Date().toLocaleDateString('ru-RU')}`;
    const isMobile = pdfExportService.isMobileDevice();

    const margin = isMobile ? 0 : 0;

    await pdfExportService.exportToPdf(tableElement, {
      fileName: `Отчет_${address}_${new Date().toLocaleDateString('ru-RU')}`,
      title,
      orientation: 'landscape',
      scale: 2,
      margin,
      isMobile,
    });
  },
};