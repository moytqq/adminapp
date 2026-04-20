import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
}

const registerFont = async (doc: jsPDF) => {
  try {
    const response = await fetch('/fonts/inter.ttf');
    const fontData = await response.arrayBuffer();

    let binary = '';
    const bytes = new Uint8Array(fontData);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const fontBase64 = btoa(binary);

    doc.addFileToVFS('inter.ttf', fontBase64);
    doc.addFont('inter.ttf', 'Inter', 'normal');
    doc.addFont('inter.ttf', 'Inter', 'bold');

    doc.setFont('Inter');

    console.log('Inter font registered successfully');
  } catch (error) {
    console.error('Error loading Inter font:', error);
    doc.setFont('helvetica');
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
      fileName = `Zakazy_${selectedMonthName}_${selectedOptionLabel}_${new Date().toLocaleDateString('ru-RU')}`,
    } = options;

    console.log(`Exporting auto orders PDF`);
    console.log(`Groups: ${groupedData.length}`);

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    await registerFont(doc);

    const margin = 15;
    let currentY = margin;

    const addText = (text: string, x: number, y: number, fontSize: number, isBold: boolean = false) => {
      doc.setFontSize(fontSize);
      if (isBold) {
        doc.setFont('Inter', 'bold');
      } else {
        doc.setFont('Inter', 'normal');
      }
      doc.text(text, x, y);
    };

    addText(`ЗАКАЗ ДЛЯ: ${selectedOptionLabel}`, margin, currentY, 14, true);
    currentY += 8;

    //Подпись периода
    /*addText(`${selectedMonthName} | ${selectedWeekLabel}`, margin, currentY, 10, false);
    currentY += 12;*/

    for (const group of groupedData) {
      if (currentY > doc.internal.pageSize.getHeight() - 50) {
        doc.addPage();
        currentY = margin;
      }

      addText(group.groupName, margin, currentY, 11, true);
      currentY += 6;

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
          font: 'Inter',
        },
        headStyles: {
          fillColor: [217, 217, 217],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          halign: 'center',
          font: 'Inter',
        },
        bodyStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          font: 'Inter',
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
      if (finalY) {
        currentY = finalY + 8;
      } else {
        currentY += 50;
      }
    }

    doc.save(`${fileName}.pdf`);
    console.log(`PDF saved: ${fileName}.pdf`);
  },
};