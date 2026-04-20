import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { INTER_FONT_BASE64 } from './pdfFonts';

interface OrderItem {
  id: number;
  order_id: string;
  address: string;
  address_full: string;
  address_ip: string;
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
  address?: string;
  addressFull?: string;
  addressIp?: string;
}

interface AutoOrdersExportOptions {
  fileName?: string;
}

const registerFontInline = (doc: jsPDF) => {
  try {
    if (INTER_FONT_BASE64 && INTER_FONT_BASE64.length > 0) {
      doc.addFileToVFS('inter.ttf', INTER_FONT_BASE64);
      doc.addFont('inter.ttf', 'Inter', 'normal');
      doc.addFont('inter.ttf', 'Inter', 'bold');
      doc.setFont('Inter');
      console.log('Inter font registered successfully from inline base64');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error registering inline font:', error);
    return false;
  }
};

export const pdfExportAutoOrdersService = {
  exportAutoOrdersToPdf: async (
    groupedData: GroupedItem[],
    selectedMonthName: string,
    selectedType: 'address' | 'supplier',
    selectedOptionLabel: string,
    selectedWeekLabel: string,
    options: AutoOrdersExportOptions = {}
  ): Promise<void> => {
    const {
      fileName = `Avtozakazy_${selectedMonthName}_${selectedOptionLabel}_${new Date().toLocaleDateString('ru-RU')}`,
    } = options;

    console.log(`Exporting auto orders PDF`);

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const fontRegistered = registerFontInline(doc);

    if (!fontRegistered) {
      console.warn('Font not registered, using helvetica');
      doc.setFont('helvetica');
    }

    const margin = 15;
    let currentY = margin;

    const addText = (text: string, x: number, y: number, fontSize: number, isBold: boolean = false) => {
      doc.setFontSize(fontSize);
      if (fontRegistered) {
        doc.setFont('Inter', isBold ? 'bold' : 'normal');
      } else {
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      }
      doc.text(text, x, y);
    };

    addText(`ЗАКАЗ ДЛЯ: ${selectedOptionLabel}`, margin, currentY, 14, true);
    currentY += 8;
    addText(`${selectedMonthName} | ${selectedWeekLabel}`, margin, currentY, 10, false);
    currentY += 12;

    for (const group of groupedData) {
      if (currentY > doc.internal.pageSize.getHeight() - 80) {
        doc.addPage();
        currentY = margin;
      }

      //addText(group.groupName, margin, currentY, 11, true);
      //currentY += 5;

      if (selectedType === 'supplier' && (group.address || group.addressFull || group.addressIp)) {
        if (group.address) {
          addText(group.address, margin, currentY, 12, false);
          currentY += 6;
        }
        if (group.addressFull) {
          addText(group.addressFull, margin, currentY, 12, false);
          currentY += 6;
        }
        if (group.addressIp) {
          addText(group.addressIp, margin, currentY, 12, false);
          currentY += 6;
        }
      }

      const tableData = group.items.map(item => [
        item.product_name,
        item.count.toString(),
        item.packaging_supplier,
        new Date(item.date).toLocaleDateString('ru-RU')
      ]);

      const tableHeaders = [['Наименование', 'Кол-во', 'Фасовка', 'Дата']];

      autoTable(doc, {
        head: tableHeaders,
        body: tableData,
        startY: currentY,
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 9,
          cellPadding: 3,
          textColor: [0, 0, 0],
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
          font: fontRegistered ? 'Inter' : 'helvetica',
        },
        headStyles: {
          fillColor: [217, 217, 217],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          halign: 'center',
          font: fontRegistered ? 'Inter' : 'helvetica',
        },
        bodyStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          font: fontRegistered ? 'Inter' : 'helvetica',
        },
        columnStyles: {
          0: { cellWidth: 'auto', halign: 'left' },
          1: { cellWidth: 20, halign: 'center' },
          2: { cellWidth: 30, halign: 'center' },
          3: { cellWidth: 30, halign: 'center' },
        },
        alternateRowStyles: {
          fillColor: [255, 255, 255],
        },
      });

      const finalY = (doc as any).lastAutoTable?.finalY;
      currentY = finalY ? finalY + 8 : currentY + 50;
    }

    doc.save(`${fileName}.pdf`);
    console.log(`PDF saved: ${fileName}.pdf`);
  },
};