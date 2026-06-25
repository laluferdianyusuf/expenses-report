import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { ReportData, ReportGenerator } from './report-generator.interface';

@Injectable()
export class ExcelGenerator implements ReportGenerator {
  extension = 'xlsx';

  async generate(data: ReportData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Report');

    sheet.mergeCells('A1:F1');
    sheet.getCell('A1').value = data.title;
    sheet.getCell('A1').font = { bold: true, size: 14 };

    sheet.getCell('A2').value = data.organizationName;
    sheet.getCell('A3').value = `Period: ${data.startDate} - ${data.endDate}`;
    sheet.getCell('A4').value = `Generated: ${data.generatedAt}`;

    const headerRow = sheet.addRow([
      'Date',
      'Type',
      'Category',
      'Description',
      'Amount',
      'Status',
    ]);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' },
    };
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    });

    for (const row of data.rows) {
      sheet.addRow([
        row.date,
        row.type,
        row.category,
        row.description,
        row.amount,
        row.status ?? '',
      ]);
    }

    sheet.addRow([]);
    sheet.addRow(['Total Income', '', '', '', data.summary.totalIncome]);
    sheet.addRow(['Total Expense', '', '', '', data.summary.totalExpense]);
    sheet.addRow(['Profit', '', '', '', data.summary.profit]);

    sheet.columns = [
      { width: 14 },
      { width: 10 },
      { width: 18 },
      { width: 30 },
      { width: 15 },
      { width: 12 },
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
