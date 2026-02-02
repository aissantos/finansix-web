import { itauParser } from './itau';
import { bradescoParser } from './bradesco';
import { santanderParser } from './santander';
import { interParser } from './inter';
import { c6Parser } from './c6';
import { btgParser } from './btg';

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

// Registry will be populated as we add parsers
export const bankParsers: BankParser[] = [
  itauParser,
  bradescoParser,
  santanderParser,
  interParser,
  c6Parser,
  btgParser
];

export function registerParser(parser: BankParser) {
  bankParsers.push(parser);
}
