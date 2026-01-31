
// @ts-nocheck
import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { parseInvoiceText } from './invoice-parser';
// import * as pdfjsLib from 'pdfjs-dist';

// Configure worker for Node.js environment
// We need to use the legacy build or proper worker setup for node
// For this debug script, we'll try to use the standard getDocument if possible,
// or mock if we only wanted to test the parser logic, but here we WANT to test the extraction.
// However, pdfjs-dist in node requires some setup.
// Let's try to just use the parser logic on a hardcoded string if extraction fails, 
// but the goal is to SEE the extraction.

describe.skip('Real PDF Debugging', () => {
    it('should extract and parse text from the real PDF', async () => {
        const pdfPath = path.resolve(__dirname, '../../docs/Nubank_2026-02-03.pdf');
        
        console.log(`Reading PDF from: ${pdfPath}`);
        
        if (!fs.existsSync(pdfPath)) {
            console.error('PDF file not found!');
            return;
        }

        const dataBuffer = fs.readFileSync(pdfPath);
        const data = new Uint8Array(dataBuffer);

        // In Node, we might need to set up the worker differently or use the main entry
        // pdfjsLib.GlobalWorkerOptions.workerSrc is for browser.
        // For node, we usually don't need worker if we import 'pdfjs-dist/legacy/build/pdf' or just rely on main.
        
        // Dynamic import to avoid loading pdfjs-dist during CI/test collection
        const pdfjsLib = await import('pdfjs-dist');

        const loadingTask = pdfjsLib.getDocument({
            data: data,
            useSystemFonts: true, // Sometimes helps in node
            disableFontFace: true 
        });

        const pdf = await loadingTask.promise;
        console.log(`PDF loaded. Pages: ${pdf.numPages}`);

        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join('\n');
            fullText += pageText + '\n\n';
        }

        console.log('--- START RAW TEXT ---');
        console.log(fullText);
        console.log('--- END RAW TEXT ---');

        const result = parseInvoiceText(fullText);
        console.log('Parsed Result:', JSON.stringify(result, null, 2));

        expect(result.transactions.length).toBeGreaterThan(0);
    });
});
