
import { DeliveryData } from "../types";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from "./formatUtils";
import * as XLSX from 'xlsx';

export const fileToBase64 = (file: File): Promise<{ base64: string, mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      const mimeType = result.split(';')[0].split(':')[1];
      if (base64 && mimeType) {
        resolve({ base64, mimeType });
      } else {
        reject(new Error("Failed to parse file data."));
      }
    };
    reader.onerror = error => reject(error);
  });
};


export const downloadCSV = (data: DeliveryData[], title: string) => {
  if (data.length === 0) return;

  const headers = ["Data", "Coleta", "Destino", "Total", "Observacao"];
  const rows = data.map(row => 
    [row.date, row.collection, row.destination, row.total, row.observation]
    .map(value => `"${(value || '').replace(/"/g, '""')}"`) // Escape quotes and handle null/undefined
    .join(',')
  );

  const csvContent = "data:text/csv;charset=utf-8," 
    + headers.join(',') + "\n" 
    + rows.join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  const fileName = `${title.toLowerCase().replace(/\s+/g, '_') || 'planilha'}.csv`;
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadPDF = (data: DeliveryData[], title: string) => {
  if (data.length === 0) return;

  const doc = new jsPDF();
  
  const head = [["Data", "Coleta", "Destino", "Total", "Observacao"]];
  const body = data.map(row => [
    row.date || '',
    row.collection || '',
    row.destination || '',
    formatCurrency(row.total),
    row.observation || ''
  ]);
  const totalValue = data.reduce((sum, row) => sum + (parseFloat(row.total.replace(',', '.')) || 0), 0);

  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  autoTable(doc, {
    head: head,
    body: body,
    startY: 30,
    headStyles: { fillColor: [44, 62, 80] }, // Dark blue-gray
    alternateRowStyles: { fillColor: [245, 245, 245] },
    theme: 'grid',
    styles: {
        font: 'helvetica',
        fontSize: 10,
        cellPadding: 3,
    },
    didDrawPage: (hookData) => {
      // Footer
      const tableBottomY = (hookData.table.finalY || 0) + 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Total Geral:', hookData.settings.margin.left, tableBottomY);

      // FIX: Calculate X position for right-aligned text using page width and margin
      // This is more robust than using table.width, which can be unreliable inside the hook.
      const rightAlignX = doc.internal.pageSize.getWidth() - hookData.settings.margin.right;
      doc.text(formatCurrency(totalValue), rightAlignX, tableBottomY, { align: 'right' });
    }
  });

  const fileName = `${title.toLowerCase().replace(/\s+/g, '_') || 'planilha'}.pdf`;
  doc.save(fileName);
};

export const downloadXLSX = (data: DeliveryData[], title: string) => {
  if (data.length === 0) return;

  const dataForSheet = data.map(row => ({
    "Data": row.date,
    "Coleta": row.collection,
    "Destino": row.destination,
    "Total": parseFloat(row.total.replace(',', '.')) || 0,
    "Observação": row.observation,
  }));

  const totalValue = data.reduce((sum, row) => sum + (parseFloat(row.total.replace(',', '.')) || 0), 0);

  const worksheet = XLSX.utils.json_to_sheet(dataForSheet);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 12 }, // Data
    { wch: 40 }, // Coleta
    { wch: 40 }, // Destino
    { wch: 15 }, // Total
    { wch: 50 }, // Observação
  ];
  
  // Apply currency format to 'Total' column
  dataForSheet.forEach((_row, index) => {
      const cellAddress = `D${index + 2}`; // D is the 4th column, +2 because of 1-based index and header row
      if (worksheet[cellAddress]) {
          worksheet[cellAddress].t = 'n'; // Set type to number
          worksheet[cellAddress].z = 'R$ #,##0.00'; // Set format string
      }
  });

  // Add Total Row
  const totalRow = ["", "", "Total Geral", totalValue, ""];
  XLSX.utils.sheet_add_aoa(worksheet, [totalRow], { origin: -1 });
  
  const lastRowIndex = dataForSheet.length + 2;
  const totalCell = worksheet[`D${lastRowIndex}`];
  if(totalCell) {
    totalCell.t = 'n';
    totalCell.z = 'R$ #,##0.00';
    totalCell.s = { font: { bold: true } };
  }
  const totalLabelCell = worksheet[`C${lastRowIndex}`];
  if(totalLabelCell) {
    totalLabelCell.s = { font: { bold: true } };
  }


  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Entregas');

  const fileName = `${title.toLowerCase().replace(/\s+/g, '_') || 'planilha'}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};