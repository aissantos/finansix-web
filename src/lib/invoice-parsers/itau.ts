import type { BankParser, InvoiceMetadata } from './types';
import type { ParsedTransaction } from './types';

export const itauParser: BankParser = {
  bankId: 'itau',
  bankName: 'Itaú',

  detectBank: (text: string): boolean => {
    return /itaú|itau|iuclick/i.test(text);
  },

  parseMetadata: (text: string): InvoiceMetadata => {
    const lines = text.split('\n');
    const metadataText = lines.slice(0, 50).join('\n') + '\n' + lines.slice(-50).join('\n'); // Itaú often puts totals at end

    const metadata: InvoiceMetadata = {
      bankName: 'Itaú',
    };

    // Vencimento: supports "Vencimento 10/05/2026", "Vencimento: 10/05/2026"
    const dueDateRegex = /(?:Vencimento|Vence|Data de vencimento)[\s\S]{0,30}?(\d{2}\/\d{2}\/\d{4})/i;
    const dueDateMatch = metadataText.match(dueDateRegex);
    if (dueDateMatch) {
      const [day, month, year] = dueDateMatch[1].split('/');
      metadata.dueDate = `${year}-${month}-${day}`;
    }

    // Total: "Total da fatura R$ 1.200,00", "Saldo desta fatura R$ 1.200,00"
    const totalRegex = /(?:Total(?: da fatura)?|Saldo desta fatura|Valor total)[\s\S]{0,20}?(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2})/i;
    const totalMatch = metadataText.match(totalRegex);
    if (totalMatch) {
        metadata.totalAmount = parseFloat(totalMatch[1].replace(/\./g, '').replace(',', '.'));
    }

    return metadata;
  },

  parseTransactions: (text: string): ParsedTransaction[] => {
    const transactions: ParsedTransaction[] = [];
    const lines = text.split('\n');
    const currentYear = new Date().getFullYear();

    // Itaú format: DD/MM Description Amount
    // 05/01 IFOOD OSASCO BR 96,15
    const transactionRegex = /^(\d{2})\/(\d{2})\s+(.+?)\s+(-?[\d.,]+)$/;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Skip non-transaction headers/footers common in Itaú/Itaucard
        if (/SALDO ANTERIOR|PAGAMENTO|CRÉDITOS|DÉBITOS/i.test(line)) continue;

        // Try direct match first (single line)
        const match = line.match(transactionRegex);
        if (match) {
            const day = match[1];
            const month = match[2];
            const description = match[3].trim();
            const amountStr = match[4];

            // Filter invalid descriptions
            if (description.match(/^\d{2}\/\d{2}/) || description === 'DATA') continue;

            const amount = parseFloat(amountStr.replace(/\./g, '').replace(',', '.'));
            
            // Basic year decision (assuming invoice is recent)
            // If month is > current month + 2, it's likely previous year.
            // A more robust way requires invoice date.
            const date = `${currentYear}-${month}-${day}`;

            transactions.push({
                date,
                description,
                amount
            });
        } else {
             // Handle Multi-line dates where date is on one line? 
             // Itaú PDFs usually are well formatted single lines for transactions, unlike Nubank.
             // We will keep simple for now and iterate if samples show breaking lines.
             
             // Check for "05/01" at start but rest didn't match regex
             if (/^(\d{2})\/(\d{2})/.test(line)) {
                 // Maybe amount is on next line?
                 // Pending real sample validation.
             }
        }
    }

    // Post-processing to fix years if we have metadata
    // (Ideally passing metadata to this function would be better, but we can do a 2-pass refactor later)
    
    return transactions;
  }
};
