import * as pdfjsLib from 'pdfjs-dist';

// Use a CDN for the worker to avoid complex bundler configuration
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export interface ParsedTransaction {
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
}

export interface ParseResult {
  transactions: ParsedTransaction[];
  totalAmount?: number;
  dueDate?: string; // YYYY-MM-DD
  minimumPayment?: number;
  rawText: string;
}

/**
 * Parses text from Brazilian credit card invoices.
 * Extracts: 
 * - Transactions (Date, Description, Amount)
 * - Metadata (Due Date, Total Amount, Minimum Payment)
 */
export function parseInvoiceText(text: string): ParseResult {
  const transactions: ParsedTransaction[] = [];
  const lines = text.split('\n');

  // Metadata Regexes
  // Vencimento: supports "Vencimento 10/05", "Vencimento: 10/05/2026"
  const dueDateRegex = /(?:Vencimento|Vence|Vencer)[\s\S]{0,20}?(\d{2}\/\d{2}(?:\/\d{2,4})?)/i;
  
  // Total: supports "Total da fatura R$ 1.200,00", "Total R$ 1.200,00"
  const totalAmountRegex = /(?:Total(?: da fatura)?|Valor total)[\s\S]{0,20}?(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2})/i;
  
  // Min Payment: supports "Pagamento mínimo R$ 100,00", "Mínimo R$ 100,00"
  const minPaymentRegex = /(?:Pagamento m[ií]nimo|M[ií]nimo)[\s\S]{0,20}?(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2})/i;

  // Transaction Regexes
  const dateSlashRegex = /(\d{2})\/(\d{2})(?:\/(\d{2,4}))?/;
  // Nubank format: 03 FEV
  const dateMonthNameRegex = /(\d{2})\s+(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)/i;
  const amountRegex = /(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2})/;

  const monthMap: Record<string, string> = {
    'JAN': '01', 'FEV': '02', 'MAR': '03', 'ABR': '04', 'MAI': '05', 'JUN': '06',
    'JUL': '07', 'AGO': '08', 'SET': '09', 'OUT': '10', 'NOV': '11', 'DEZ': '12'
  };

  const parseAmount = (str: string) => {
    return parseFloat(str.replace(/\./g, '').replace(',', '.'));
  };

  const currentYear = new Date().getFullYear();
  const metadataFound = {
    dueDate: '',
    totalAmount: 0,
    minimumPayment: 0
  };

  // First pass: Metadata extraction (usually in header/footer)
  // We scan the first and last 20 lines for better performance and accuracy
  const headerLines = lines.slice(0, 30).join('\n'); // Increased to 30 to catch Nubank header
  const footerLines = lines.slice(-20).join('\n');
  const metadataText = headerLines + '\n' + footerLines;

  const dueDateMatch = metadataText.match(dueDateRegex);
  if (dueDateMatch) {
    const parts = dueDateMatch[1].split('/');
    const day = parts[0];
    const month = parts[1];
    // If year is missing, assume current year. If 2 digit year, add 20 prefix.
    let year = parts[2];
    if (!year) year = String(currentYear);
    else if (year.length === 2) year = '20' + year;
    
    metadataFound.dueDate = `${year}-${month}-${day}`;
  }

  const totalMatch = metadataText.match(totalAmountRegex);
  if (totalMatch) {
    metadataFound.totalAmount = parseAmount(totalMatch[1]);
  }

  const minMatch = metadataText.match(minPaymentRegex);
  if (minMatch) {
    metadataFound.minimumPayment = parseAmount(minMatch[1]);
  }

  // Second pass: Transactions
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    let day = '';
    let month = '';
    let year = currentYear;
    let matchedDateStr = '';
    
    // Check for DD/MM at start of line
    const dateSlashMatch = line.match(dateSlashRegex);
    // Check for DD MMM at start of line
    const dateMonthMatch = line.match(dateMonthNameRegex);

    let isDateAtStart = false;

    if (dateSlashMatch && dateSlashMatch.index === 0) {
      day = dateSlashMatch[1];
      month = dateSlashMatch[2];
      year = dateSlashMatch[3] ? parseInt(dateSlashMatch[3]) : currentYear;
      matchedDateStr = dateSlashMatch[0];
      isDateAtStart = true;
    } else if (dateMonthMatch) {
       if (line.indexOf(dateMonthMatch[0]) === 0) {
         day = dateMonthMatch[1];
         const monthName = dateMonthMatch[2].toUpperCase();
         month = monthMap[monthName] || '01';
         matchedDateStr = dateMonthMatch[0];
         isDateAtStart = true;
       }
    }

    if (isDateAtStart) {
       let amountMatch = line.match(amountRegex);
       let isMultiLine = false;

       if (!amountMatch && i + 1 < lines.length) {
         const nextLine = lines[i + 1].trim();
         const nextLineHasDate = (nextLine.match(dateSlashRegex)?.index === 0) || 
                                 (nextLine.match(dateMonthNameRegex) && nextLine.indexOf(nextLine.match(dateMonthNameRegex)![0]) === 0);
         
         if (!nextLineHasDate) {
            const nextLineAmountMatch = nextLine.match(amountRegex);
            if (nextLineAmountMatch) {
              amountMatch = nextLineAmountMatch;
              isMultiLine = true;
            }
         }
       }

       if (amountMatch) {
          const date = `${year}-${month}-${day}`;
          const amountStr = amountMatch[1];
          const amount = parseAmount(amountStr);

          let description = line;
          
          if (!isMultiLine) {
             description = description.replace(amountMatch[0], '');
          }

          description = description
            .replace(matchedDateStr, '')
            .replace('R$', '')
            .trim();
          
          description = description.replace(/^\s*-\s*/, ''); 
          description = description.replace(/^[•.]+\s*\d+\s+/, '');
          
          // Filter out likely headers/footers
          if (description.toUpperCase().includes('TOTAL')) continue;
          if (description.toUpperCase().includes('PAGAMENTO')) continue;
          if (description.toUpperCase().includes('SALDO')) continue;

          if (description.length > 2 && amount > 0) {
             transactions.push({
               date,
               description,
               amount
             });
          }
       }
    }
  }

  return {
    transactions,
    totalAmount: metadataFound.totalAmount > 0 ? metadataFound.totalAmount : undefined,
    dueDate: metadataFound.dueDate || undefined,
    minimumPayment: metadataFound.minimumPayment > 0 ? metadataFound.minimumPayment : undefined,
    rawText: text
  };
}
