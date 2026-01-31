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
  closingDate?: string; // YYYY-MM-DD
  rawText: string;
}

/**
 * Extracts text from a PDF file.
 * Handles password-protected files if password is provided.
 */
export async function extractTextFromPDF(
  file: File, 
  password?: string
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      password: password,
    });

    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => {
          const textItem = item as { str: string; hasEOL: boolean };
          if ('str' in textItem) {
             return textItem.str + (textItem.hasEOL ? '\n' : ' ');
          }
          return '';
        })
        .join('');
      fullText += pageText + '\n';
    }

    return fullText;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'PasswordException') {
      throw new Error('PASSWORD_REQUIRED');
    }
    // Also check for object-like error with name property (common in pdfjs)
    if (typeof error === 'object' && error !== null && 'name' in error && (error as { name: string }).name === 'PasswordException') {
       throw new Error('PASSWORD_REQUIRED');
    }
    throw error;
  }
}

/**
 * Basic regex parser for Brazilian credit card invoices.
 * Tries to find dates (DD/MM), descriptions and amounts (R$ X,XX).
 */
export function parseInvoiceText(text: string): ParseResult {
  const transactions: ParsedTransaction[] = [];
  const lines = text.split('\n');

  // Regex for DD/MM or DD/MM/YYYY
  const dateSlashRegex = /(\d{2})\/(\d{2})(?:\/(\d{2,4}))?/;
  
  // Regex for DD MMM (Nubank format: 03 FEV)
  const dateMonthNameRegex = /(\d{2})\s+(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)/i;

  // Regex for currency R$ 1.234,56 or 1234,56
  const amountRegex = /(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2})/;

  const monthMap: Record<string, string> = {
    'JAN': '01', 'FEV': '02', 'MAR': '03', 'ABR': '04', 'MAI': '05', 'JUN': '06',
    'JUL': '07', 'AGO': '08', 'SET': '09', 'OUT': '10', 'NOV': '11', 'DEZ': '12'
  };

  // Helper to parse amount string to number
  const parseAmount = (str: string) => {
    return parseFloat(str.replace(/\./g, '').replace(',', '.'));
  };

  const currentYear = new Date().getFullYear();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
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
       // For MMM format, check if it's at start (ignoring small whitespace)
       // The regex finds it anywhere, let's verfiy index valid for start
       if (line.trim().indexOf(dateMonthMatch[0]) === 0) {
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

       // If no amount on this line, check next line
       if (!amountMatch && i + 1 < lines.length) {
         const nextLine = lines[i + 1];
         // Ensure next line is not a new transaction start
         const nextLineHasDate = (nextLine.match(dateSlashRegex)?.index === 0) || 
                                 (nextLine.match(dateMonthNameRegex) && nextLine.trim().indexOf(nextLine.match(dateMonthNameRegex)![0]) === 0);
         
         if (!nextLineHasDate) {
            const nextLineAmountMatch = nextLine.match(amountRegex);
            if (nextLineAmountMatch) {
              amountMatch = nextLineAmountMatch;
              isMultiLine = true;
              // We don't advance i here automatically because we only wanted the amount. 
              // Usually the next line shouldn't be processed as its own transaction if it has no date.
            }
         }
       }

       if (amountMatch) {
          // Formatting date YYYY-MM-DD
          const date = `${year}-${month}-${day}`;
          const amountStr = amountMatch[1];
          const amount = parseAmount(amountStr);

          // Description extraction
          // If multi-line, description is primarily on the first line.
          // We might ignore the text on the second line if it looks like metadata (e.g. "Total a pagar")
          let description = line;
          
          if (!isMultiLine) {
             // Remove amount from description if it was on the same line
             description = description.replace(amountMatch[0], '');
          }

          description = description
            .replace(matchedDateStr, '')
            .replace('R$', '')
            .trim();
          
          // Clean up extra spaces/chars
          description = description.replace(/^\s*-\s*/, ''); 
          description = description.replace(/^[•.]+\s*\d+\s+/, '');
          
          // Filter out likely headers/footers
          if (description.toUpperCase().includes('TOTAL')) continue;
          if (description.toUpperCase().includes('PAGAMENTO')) continue;

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
    rawText: text
  };
}
