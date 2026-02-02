import type { BankParser, ParsedTransaction, InvoiceMetadata } from './index';

export const btgParser: BankParser = {
  bankId: 'btg',
  bankName: 'BTG Pactual',

  detectBank: (text: string): boolean => {
    return /btg\s*pactual|btg\s*banking/i.test(text);
  },

  parseMetadata: (text: string): InvoiceMetadata => {
    const metadata: InvoiceMetadata = {};
    
    // Total: Valor total R$ 1.234,56
    const totalMatch = text.match(/valor\s+total[:\s]*R\$\s*([\d.,]+)/i);
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

    // BTG format: DD/MM Description Installment Value
    // Example: 10/05 UBER BR 01/01 12,90
    // Regex needs to be flexible for optional installment info
    const transactionRegex = /^(\d{2}\/\d{2})\s+(.+?)\s+(?:(\d{2}\/\d{2})\s+)?(-?[\d.,]+)$/;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const match = trimmed.match(transactionRegex);
        if (match) {
            const datePart = match[1]; // DD/MM
            const description = match[2].trim();
            // match[3] is installment info, ignored for now
            const amountStr = match[4];

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
