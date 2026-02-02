import type { BankParser, InvoiceMetadata } from './types';
import type { ParsedTransaction } from './types';

export const bradescoParser: BankParser = {
  bankId: 'bradesco',
  bankName: 'Bradesco',

  detectBank: (text: string): boolean => {
    return /bradesco|bradescard/i.test(text);
  },

  parseMetadata: (text: string): InvoiceMetadata => {
    const lines = text.split('\n');
    const metadataText = lines.slice(0, 50).join('\n') + '\n' + lines.slice(-50).join('\n');

    const metadata: InvoiceMetadata = {
      bankName: 'Bradesco',
    };

    // Vencimento: "Vencimento 10/05/2026"
    const dueDateRegex = /vencimento\s+(\d{2}\/\d{2}\/\d{4})/i;
    const dueDateMatch = metadataText.match(dueDateRegex);
    if (dueDateMatch) {
      const [day, month, year] = dueDateMatch[1].split('/');
      metadata.dueDate = `${year}-${month}-${day}`;
    }

    // Total: "Total desta fatura R$ 1.200,00"
    const totalRegex = /(?:Total(?: desta)? fatura|Valor total)[\s\S]{0,20}?(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2})/i;
    const totalMatch = metadataText.match(totalRegex);
    if (totalMatch) {
        metadata.totalAmount = parseFloat(totalMatch[1].replace(/\./g, '').replace(',', '.'));
    }

    return metadata;
  },

  parseTransactions: (text: string): ParsedTransaction[] => {
    const transactions: ParsedTransaction[] = [];
    const lines = text.split('\n');
    
    // Bradesco format often: DD/MM/YYYY Description Value or DD/MM Description Value
    // We'll target the DD/MM/YYYY format first as it's more standard in big bank PDFs
    const transactionRegex = /^(\d{2})\/(\d{2})(?:\/(\d{4}))?\s+(.+?)\s+(-?[\d.,]+)$/;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        
        // Skip headers
        if (/SALDO|ANTERIOR|PAGAMENTO|ENCARGOS|IOF/i.test(trimmed)) continue;

        const match = trimmed.match(transactionRegex);
        if (match) {
            const day = match[1];
            const month = match[2];
            const year = match[3] || new Date().getFullYear().toString();
            let description = match[4].trim();
            const amountStr = match[5];

             // Cleanup description
             description = description.replace(/PARC \d+\/\d+/, '').trim(); // Remove installment info from desc if mixed

            const amount = parseFloat(amountStr.replace(/\./g, '').replace(',', '.'));
            const date = `${year}-${month}-${day}`;

            if (amount !== 0) { // Sometimes Bradesco lists 0.00 items
                transactions.push({
                    date,
                    description,
                    amount
                });
            }
        }
    }

    return transactions;
  }
};
