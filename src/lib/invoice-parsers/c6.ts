import type { BankParser, ParsedTransaction, InvoiceMetadata } from './index';

export const c6Parser: BankParser = {
  bankId: 'c6',
  bankName: 'C6 Bank',

  detectBank: (text: string): boolean => {
    return /c6\s*bank/i.test(text);
  },

  parseMetadata: (text: string): InvoiceMetadata => {
    const metadata: InvoiceMetadata = {};
    
    // Total: Total da fatura R$ 1.234,56
    const totalMatch = text.match(/total\s+da\s+fatura[:\s]*R\$\s*([\d.,]+)/i);
    if (totalMatch) {
      metadata.totalAmount = parseFloat(totalMatch[1].replace(/\./g, '').replace(',', '.'));
    }

    // Due Date: Vencimento 10/05/2026
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

    // C6 format: DD/MM Description Value
    // Example: 10/05 UBER BR 12,90
    const transactionRegex = /^(\d{2}\/\d{2})\s+(.+?)\s+(-?[\d.,]+)$/;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const match = trimmed.match(transactionRegex);
        if (match) {
            const datePart = match[1]; // DD/MM
            const description = match[2].trim();
            const amountStr = match[3];

            const [day, month] = datePart.split('/');
            const amount = parseFloat(amountStr.replace(/\./g, '').replace(',', '.'));

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
