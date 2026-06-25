import { Injectable } from '@nestjs/common';
import { ReportData, ReportGenerator } from './report-generator.interface';

@Injectable()
export class CsvGenerator implements ReportGenerator {
  extension = 'csv';

  async generate(data: ReportData): Promise<Buffer> {
    const lines: string[] = [
      `"${data.title}"`,
      `"${data.organizationName}"`,
      `"Period: ${data.startDate} - ${data.endDate}"`,
      `"Generated: ${data.generatedAt}"`,
      '',
      '"Date","Type","Category","Description","Amount","Status"',
    ];

    for (const row of data.rows) {
      lines.push(
        `"${row.date}","${row.type}","${row.category}","${row.description.replace(/"/g, '""')}",${row.amount},"${row.status ?? ''}"`,
      );
    }

    lines.push('');
    lines.push(`"Total Income",,,,${data.summary.totalIncome},`);
    lines.push(`"Total Expense",,,,${data.summary.totalExpense},`);
    lines.push(`"Profit",,,,${data.summary.profit},`);

    return Buffer.from(lines.join('\n'), 'utf-8');
  }
}
