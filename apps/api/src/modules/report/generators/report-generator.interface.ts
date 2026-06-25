export interface ReportRow {
  date: string;
  category: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  status?: string;
}

export interface ReportData {
  title: string;
  organizationName: string;
  startDate: string;
  endDate: string;
  generatedAt: string;
  rows: ReportRow[];
  summary: {
    totalIncome: number;
    totalExpense: number;
    profit: number;
  };
}

export interface ReportGenerator {
  generate(data: ReportData): Promise<Buffer>;
  extension: string;
}
