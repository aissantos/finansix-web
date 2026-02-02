export interface InvoiceMetadata {
  totalAmount?: number;
  dueDate?: string;
  minimumPayment?: number;
  bankName?: string;
}

export interface ParsedTransaction {
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
}

export interface BankParser {
  bankId: string;
  bankName: string;
  detectBank: (text: string) => boolean;
  parseTransactions: (text: string) => ParsedTransaction[];
  parseMetadata: (text: string) => InvoiceMetadata;
}
