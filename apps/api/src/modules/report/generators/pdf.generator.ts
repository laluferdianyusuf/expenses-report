import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { ReportData, ReportGenerator } from './report-generator.interface';

@Injectable()
export class PdfGenerator implements ReportGenerator {
  extension = 'pdf';

  generate(data: ReportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(18).text(data.title, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).text(data.organizationName, { align: 'center' });
      doc.text(`Period: ${data.startDate} - ${data.endDate}`, { align: 'center' });
      doc.text(`Generated: ${data.generatedAt}`, { align: 'center' });
      doc.moveDown();

      doc.fontSize(10);
      const tableTop = doc.y;
      const colX = [50, 110, 170, 260, 420, 490];

      doc.font('Helvetica-Bold');
      doc.text('Date', colX[0], tableTop);
      doc.text('Type', colX[1], tableTop);
      doc.text('Category', colX[2], tableTop);
      doc.text('Description', colX[3], tableTop);
      doc.text('Amount', colX[4], tableTop);
      doc.moveDown();

      doc.font('Helvetica');
      for (const row of data.rows) {
        if (doc.y > 720) {
          doc.addPage();
        }
        const y = doc.y;
        doc.text(row.date, colX[0], y, { width: 55 });
        doc.text(row.type, colX[1], y, { width: 55 });
        doc.text(row.category, colX[2], y, { width: 85 });
        doc.text(row.description.slice(0, 40), colX[3], y, { width: 155 });
        doc.text(row.amount.toLocaleString('id-ID'), colX[4], y, { width: 65 });
        doc.moveDown(0.8);
      }

      doc.moveDown();
      doc.font('Helvetica-Bold');
      doc.text(`Total Income: Rp ${data.summary.totalIncome.toLocaleString('id-ID')}`);
      doc.text(`Total Expense: Rp ${data.summary.totalExpense.toLocaleString('id-ID')}`);
      doc.text(`Profit: Rp ${data.summary.profit.toLocaleString('id-ID')}`);

      doc.end();
    });
  }
}
