import * as pdfjsLib from 'pdfjs-dist';

// Use a CDN for the worker to avoid complex bundler configuration
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

import type { ParsedTransaction } from './invoice-parsers';

export interface ParseResult {
  transactions: ParsedTransaction[];
  totalAmount?: number;
  dueDate?: string; // YYYY-MM-DD
  minimumPayment?: number;
  rawText: string;
  bankName?: string;
}

/**
 * Parses text from Brazilian credit card invoices.
 * Extracts: 
 * - Transactions (Date, Description, Amount)
 * - Metadata (Due Date, Total Amount, Minimum Payment)
 */
import { bankParsers } from './invoice-parsers';
import { itauParser } from './invoice-parsers/itau';
import { bradescoParser } from './invoice-parsers/bradesco';

// Register parsers manually for now (in a real app, this could be dynamic)
if (bankParsers.length === 0) {
    bankParsers.push(itauParser);
    bankParsers.push(bradescoParser);
}

/**
 * Parses text from Brazilian credit card invoices.
 * Extracts: 
 * - Transactions (Date, Description, Amount)
 * - Metadata (Due Date, Total Amount, Minimum Payment)
 */
export function parseInvoiceText(text: string): ParseResult {
  // 1. Try to detect specific bank
  for (const parser of bankParsers) {
    if (parser.detectBank(text)) {
      const transactions = parser.parseTransactions(text);
      const metadata = parser.parseMetadata(text);
      
      return {
        transactions,
        totalAmount: metadata.totalAmount,
        dueDate: metadata.dueDate,
        minimumPayment: undefined, // specific parsers might not extract this yet
        rawText: text,
        bankName: parser.bankName
      };
    }
  }

  // 2. Fallback to default (Nubank-optimized) parser
  return parseDefault(text);
}

function parseDefault(text: string): ParseResult {
  const transactions: ParsedTransaction[] = [];
  const lines = text.split('\n');

  // Metadata Regexes
  // Vencimento: supports "Vencimento 10/05", "Vencimento: 10/05/2026", "Vencimento 10 FEV"
  const dueDateRegex = /(?:Vencimento|Vence|Vencer)[\s\S]{0,30}?(\d{2}(?:\/\d{2}(?:\/\d{2,4})?|\s+(?:JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)))/i;
  
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
  // We scan the first and last 30 lines for better performance and accuracy
  const headerLines = lines.slice(0, 30).join('\n'); 
  const footerLines = lines.slice(-20).join('\n');
  const metadataText = headerLines + '\n' + footerLines;

  const dueDateMatch = metadataText.match(dueDateRegex);
  if (dueDateMatch) {
    const rawDate = dueDateMatch[1];
    let day = '';
    let month = '';
    let year = String(currentYear);

    if (rawDate.includes('/')) {
        const parts = rawDate.split('/');
        day = parts[0];
        month = parts[1];
        if (parts[2]) {
            year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
        }
    } else {
        // Handle "DD MMM" format
        const parts = rawDate.trim().split(/\s+/);
        day = parts[0];
        const monthName = parts[1].toUpperCase();
        month = monthMap[monthName] || '01';
    }
    
    // Smart year adjustment: if extracted month is Jan and we are in Dec, it's next year
    const today = new Date();
    if (Number(month) < today.getMonth() + 1 && Number(month) === 1 && today.getMonth() === 11) {
        year = String(currentYear + 1);
    }
    
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
       let amountLineIndex = i;
       let isMultiLine = false;

       // Look ahead up to 8 lines (increased for Nubank fragmentation)
       if (!amountMatch) {
          for (let offset = 1; offset <= 8 && (i + offset) < lines.length; offset++) {
             const nextLine = lines[i + offset].trim();
             
             // Skip empty lines
             if (!nextLine) continue;

             // Skip Card Mask (e.g., •••• 8658 or similar)
             // Matches dots followed by 4 digits
             if (/^[•.*]+\s*\d{4}$/.test(nextLine)) continue;

             // If next line has a DATE, stop looking (it's a new transaction)
             const nextLineHasDate = (nextLine.match(dateSlashRegex)?.index === 0) || 
                                     (nextLine.match(dateMonthNameRegex) && nextLine.indexOf(nextLine.match(dateMonthNameRegex)![0]) === 0);
             
             if (nextLineHasDate) break;

             const nextLineAmountMatch = nextLine.match(amountRegex);
             if (nextLineAmountMatch) {
                amountMatch = nextLineAmountMatch;
                amountLineIndex = i + offset;
                isMultiLine = true;
                break;
             }
          }
       }
       
       if (amountMatch) {
          const date = `${year}-${month}-${day}`;
          const amountStr = amountMatch[1];
          const amount = parseAmount(amountStr);

          // Construct description by joining lines from current up to amount line
          let description = "";
          
          if (isMultiLine) {
             // Join lines from i to amountLineIndex
             for (let k = i; k <= amountLineIndex; k++) {
                let linePart = lines[k].trim();

                // Skip Card Mask in description too
                if (/^[•.*]+\s*\d{4}$/.test(linePart)) continue;
                
                // Remove Date from first line
                if (k === i) {
                  linePart = linePart.replace(matchedDateStr, '').trim();
                }
                // Remove Amount from last line
                if (k === amountLineIndex) {
                  linePart = linePart.replace(amountMatch[0], '').replace('R$', '').trim();
                }
                
                if (linePart) {
                   description += (description ? " " : "") + linePart;
                }
             }
             
             // Advance loop index to avoid re-processing these lines
             i = amountLineIndex; 
          } else {
             // Single line case
             description = line.replace(matchedDateStr, '').replace(amountMatch[0], '').replace('R$', '').trim();
          }

          description = description.trim();
          
          description = description.replace(/^\s*-\s*/, ''); 
          description = description.replace(/^[•.]+\s*\d+\s+/, '');
          
          // Filter out likely headers/footers
          if (description.toUpperCase().includes('TOTAL')) continue;
          if (description.toUpperCase().includes('PAGAMENTO')) continue;
          if (description.toUpperCase().includes('SALDO')) continue;
          
          // Refined Fatura filter: Only filter specific non-transaction items
          if (description.toUpperCase().includes('FATURA ANTERIOR')) continue; 
          if (description.toUpperCase() === 'FATURA') continue; // Exact match usually header

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

/**
 * Extracts text content from a PDF file using pdfjs-dist
 */
export async function extractTextFromPDF(file: File, password?: string): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  // Using legacy .promise getter if needed, but getDocument returns a loading task directly in recent versions
  const loadingTask = pdfjsLib.getDocument({ 
    data: arrayBuffer,
    password: password
  });
  const pdf = await loadingTask.promise;

  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join('\n'); // eslint-disable-line @typescript-eslint/no-explicit-any
    fullText += pageText + '\n\n';
  }

  return fullText;
}
