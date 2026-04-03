import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

export interface ChartExportOptions {
  quality?: number;
  pixelRatio?: number;
  backgroundColor?: string;
}

interface StoredStyles {
  element: HTMLElement;
  originalStyles: {
    width: string;
    minWidth: string;
    maxWidth: string;
    overflow: string;
    position: string;
  };
  containerOriginalStyles: {
    width: string;
    minWidth: string;
    maxWidth: string;
    overflow: string;
  } | null;
  chartContainersOriginalStyles: { width: string; minWidth: string; height: string }[];
  customLegendStyles: { display: string; flexWrap: string; justifyContent: string; gap: string }[];
  buttonsOriginalDisplay: string[];
}

export const chartExportService = {
  storedStyles: new Map<HTMLElement, StoredStyles>(),

  applyDesktopStylesToAllCharts: (chartGroups: HTMLElement[], isMobile: boolean): void => {
    if (!isMobile) return;

    chartGroups.forEach(chartGroup => {
      const originalStyles = {
        width: chartGroup.style.width,
        minWidth: chartGroup.style.minWidth,
        maxWidth: chartGroup.style.maxWidth,
        overflow: chartGroup.style.overflow,
        position: chartGroup.style.position,
      };

      const container = chartGroup.closest(`.chartGroup`) as HTMLElement;
      const containerOriginalStyles = container ? {
        width: container.style.width,
        minWidth: container.style.minWidth,
        maxWidth: container.style.maxWidth,
        overflow: container.style.overflow,
      } : null;

      const chartContainers = chartGroup.querySelectorAll('.recharts-responsive-container, .recharts-wrapper');
      const chartContainersOriginalStyles: { width: string; minWidth: string; height: string }[] = [];
      chartContainers.forEach((container) => {
        const el = container as HTMLElement;
        chartContainersOriginalStyles.push({
          width: el.style.width,
          minWidth: el.style.minWidth,
          height: el.style.height,
        });
      });

      const customLegends = chartGroup.querySelectorAll('.customLegend');
      const customLegendStyles: { display: string; flexWrap: string; justifyContent: string; gap: string }[] = [];
      customLegends.forEach((legend) => {
        const el = legend as HTMLElement;
        customLegendStyles.push({
          display: el.style.display,
          flexWrap: el.style.flexWrap,
          justifyContent: el.style.justifyContent,
          gap: el.style.gap,
        });
      });

      const buttons = chartGroup.querySelectorAll('button');
      const buttonsOriginalDisplay: string[] = [];
      buttons.forEach((btn) => {
        const element = btn as HTMLElement;
        buttonsOriginalDisplay.push(element.style.display);
        element.style.display = 'none';
      });

      chartExportService.storedStyles.set(chartGroup, {
        element: chartGroup,
        originalStyles,
        containerOriginalStyles,
        chartContainersOriginalStyles,
        customLegendStyles,
        buttonsOriginalDisplay,
      });

      chartGroup.style.width = '100%';
      chartGroup.style.minWidth = '1000px';
      chartGroup.style.maxWidth = '1200px';
      chartGroup.style.overflow = 'visible';
      chartGroup.style.position = 'relative';

      if (container) {
        container.style.width = '100%';
        container.style.minWidth = '1000px';
        container.style.maxWidth = '1200px';
        container.style.overflow = 'visible';
      }

      chartContainers.forEach((container) => {
        const el = container as HTMLElement;
        el.style.width = '100%';
        el.style.minWidth = '1000px';
        el.style.height = '450px';
      });

      customLegends.forEach((legend) => {
        const el = legend as HTMLElement;
        el.style.display = 'flex';
        el.style.flexWrap = 'wrap';
        el.style.justifyContent = 'center';
        el.style.gap = '12px';
        el.style.marginTop = '12px';
      });

      const style = document.createElement('style');
      style.textContent = `
        .recharts-wrapper {
          width: 100% !important;
          min-width: 1000px !important;
        }
        .recharts-responsive-container {
          width: 100% !important;
          min-width: 1000px !important;
        }
        .recharts-surface {
          width: 95% !important;
        }
        .customLegend {
          display: flex !important;
          flex-wrap: wrap !important;
          justify-content: center !important;
          gap: 12px !important;
          margin-top: 12px !important;
        }
        .legendItem {
          display: inline-flex !important;
          align-items: center !important;
          gap: 4px !important;
        }
      `;
      chartGroup.appendChild(style);
    });
  },

  restoreAllStyles: (): void => {
    chartExportService.storedStyles.forEach((stored) => {
      const { element, originalStyles, containerOriginalStyles, chartContainersOriginalStyles, customLegendStyles, buttonsOriginalDisplay } = stored;

      element.style.width = originalStyles.width;
      element.style.minWidth = originalStyles.minWidth;
      element.style.maxWidth = originalStyles.maxWidth;
      element.style.overflow = originalStyles.overflow;
      element.style.position = originalStyles.position;

      const container = element.closest(`.chartGroup`) as HTMLElement;
      if (container && containerOriginalStyles) {
        container.style.width = containerOriginalStyles.width;
        container.style.minWidth = containerOriginalStyles.minWidth;
        container.style.maxWidth = containerOriginalStyles.maxWidth;
        container.style.overflow = containerOriginalStyles.overflow;
      }

      const chartContainers = element.querySelectorAll('.recharts-responsive-container, .recharts-wrapper');
      chartContainers.forEach((container, idx) => {
        if (chartContainersOriginalStyles[idx]) {
          (container as HTMLElement).style.width = chartContainersOriginalStyles[idx].width;
          (container as HTMLElement).style.minWidth = chartContainersOriginalStyles[idx].minWidth;
          (container as HTMLElement).style.height = chartContainersOriginalStyles[idx].height;
        }
      });

      const customLegends = element.querySelectorAll('.customLegend');
      customLegends.forEach((legend, idx) => {
        if (customLegendStyles[idx]) {
          const el = legend as HTMLElement;
          el.style.display = customLegendStyles[idx].display;
          el.style.flexWrap = customLegendStyles[idx].flexWrap;
          el.style.justifyContent = customLegendStyles[idx].justifyContent;
          el.style.gap = customLegendStyles[idx].gap;
        }
      });

      const buttons = element.querySelectorAll('button');
      buttons.forEach((btn, idx) => {
        if (buttonsOriginalDisplay[idx]) {
          (btn as HTMLElement).style.display = buttonsOriginalDisplay[idx];
        }
      });

      const tempStyle = element.querySelector('style:last-child');
      if (tempStyle && tempStyle.textContent?.includes('recharts-wrapper')) {
        tempStyle.remove();
      }
    });

    chartExportService.storedStyles.clear();
  },

  exportChartToDataUrl: async (
    chartElement: HTMLElement,
    options: ChartExportOptions = {}
  ): Promise<string> => {
    const {
      quality = 1,
      pixelRatio = 2,
      backgroundColor = '#ffffff',
    } = options;

    try {
      const dataUrl = await toPng(chartElement, {
        quality,
        pixelRatio,
        backgroundColor,
      });
      return dataUrl;
    } catch (error) {
      console.error('Error exporting chart to PNG:', error);
      throw error;
    }
  },

  mergeImagesToPdf: async (
    imagesData: { dataUrl: string; title: string }[],
    fileName: string,
    options: { orientation?: 'portrait' | 'landscape'; margin?: number } = {}
  ): Promise<void> => {
    const { orientation = 'landscape', margin = 5 } = options;

    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const availableWidth = pdfWidth - (margin * 2);

    for (let i = 0; i < imagesData.length; i++) {
      const { dataUrl, title } = imagesData[i];

      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      let imgWidth = availableWidth;
      let imgHeight = (img.height * imgWidth) / img.width;
      let yOffset = 25;

      if (imgHeight > pdfHeight - yOffset - margin) {
        imgHeight = pdfHeight - yOffset - margin;
        imgWidth = (img.width * imgHeight) / img.height;
      }

      if (i > 0) {
        pdf.addPage();
      }

      pdf.setFontSize(14);
      pdf.text(title, pdfWidth / 2, 15, { align: 'center' });

      pdf.addImage(
        dataUrl,
        'PNG',
        (pdfWidth - imgWidth) / 2,
        yOffset,
        imgWidth,
        imgHeight
      );
    }

    pdf.save(`${fileName}.pdf`);
  },

  exportAllChartsToPdf: async (
    chartGroups: NodeListOf<Element> | HTMLElement[],
    baseFileName: string,
    isMobile: boolean,
    onProgress?: (current: number, total: number) => void
  ): Promise<void> => {
    const chartGroupsArray = Array.from(chartGroups) as HTMLElement[];
    const imagesData: { dataUrl: string; title: string }[] = [];

    if (isMobile) {
      chartExportService.applyDesktopStylesToAllCharts(chartGroupsArray, isMobile);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    for (let i = 0; i < chartGroupsArray.length; i++) {
      const chartGroup = chartGroupsArray[i];

      if (onProgress) {
        onProgress(i + 1, chartGroupsArray.length);
      }

      const titleElement = chartGroup.querySelector('h4');
      const title = titleElement?.textContent || `График ${i + 1}`;

      const dataUrl = await chartExportService.exportChartToDataUrl(chartGroup);
      imagesData.push({ dataUrl, title });

      await new Promise(resolve => setTimeout(resolve, 300));
    }

    if (isMobile) {
      chartExportService.restoreAllStyles();
    }

    await chartExportService.mergeImagesToPdf(
      imagesData,
      `${baseFileName}_charts`,
      { orientation: 'landscape', margin: 5 }
    );
  },

  exportAllChartsToPng: async (
    chartGroups: NodeListOf<Element> | HTMLElement[],
    baseFileName: string,
    isMobile: boolean,
    onProgress?: (current: number, total: number) => void
  ): Promise<void> => {
    const chartGroupsArray = Array.from(chartGroups) as HTMLElement[];

    if (isMobile) {
      chartExportService.applyDesktopStylesToAllCharts(chartGroupsArray, isMobile);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    for (let i = 0; i < chartGroupsArray.length; i++) {
      const chartGroup = chartGroupsArray[i];

      if (onProgress) {
        onProgress(i + 1, chartGroupsArray.length);
      }

      const dataUrl = await chartExportService.exportChartToDataUrl(chartGroup);

      const link = document.createElement('a');
      link.download = `${baseFileName}_chart_${i + 1}.png`;
      link.href = dataUrl;
      link.click();

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (isMobile) {
      chartExportService.restoreAllStyles();
    }
  },
};