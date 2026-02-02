import type { BankParser, InvoiceMetadata } from './types';
import type { ParsedTransaction } from './types';

const MONTH_MAP: Record<string, string> = {
  'JAN': '01', 'FEV': '02', 'MAR': '03', 'ABR': '04', 'MAI': '05', 'JUN': '06',
  'JUL': '07', 'AGO': '08', 'SET': '09', 'OUT': '10', 'NOV': '11', 'DEZ': '12'
};

export const santanderParser: BankParser = {
  bankId: 'santander',
  bankName: 'Santander',

  detectBank: (text: string): boolean => {
    return /santander|getnet/i.test(text);
  },

  parseMetadata: (text: string): InvoiceMetadata => {
    const metadata: InvoiceMetadata = {};
    
    // Total: Total da fatura R$ 1.234,56
    const totalMatch = text.match(/total\s+da\s+fatura[:\s]*R\$\s*([\d.,]+)/i);
    if (totalMatch) {
      metadata.totalAmount = parseFloat(totalMatch[1].replace(/\./g, '').replace(',', '.'));
    }

    // Due Date: Vencimento 15/01/2026
    const dateMatch = text.match(/vencimento[:\s]*(\d{2}\/\d{2}\/\d{4})/i);
    if (dateMatch) {
      const [day, month, year] = dateMatch[1].split('/');
      metadata.dueDate = `${year}-${month}-${day}`;
    }

    return metadata;
  },

  parseTransactions: (text: string): ParsedTransaction[] => {
    const transactions: ParsedTransaction[] = [];
    const lines = text.split('\n');
    const currentYear = new Date().getFullYear();

    // Santander format: 15 JAN Description Amount
    // Regex: Start of line -> 2 digits -> space -> 3 letters -> space -> description -> space -> amount -> end
    const transactionRegex = /^(\d{2})\s+([A-Z]{3})\s+(.+?)\s+(-?[\d.,]+)$/;

    for (const line of lines) {
       const trimmed = line.trim();
       if (!trimmed) continue;

       const match = trimmed.match(transactionRegex);
       if (match) {
         const day = match[1];
         const monthStr = match[2];
         const description = match[3].trim();
         const amountStr = match[4];

         const month = MONTH_MAP[monthStr];
         if (!month) continue; // Invalid month string
         
         const amount = parseFloat(amountStr.replace(/\./g, '').replace(',', '.'));
         
         // Simple heuristic for year crossing (if month is Dec and current is Jan, assume prev year)
         // For now, defaulting to currentYear
         
         transactions.push({
           date: `${currentYear}-${month}-${day}`,
           description,
           amount
         });
       }
    }

    return transactions;
  }
};
