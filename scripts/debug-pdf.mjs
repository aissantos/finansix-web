
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
// Use legacy build for Node.js
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function extractText() {
    const pdfPath = path.resolve(__dirname, '../docs/Nubank_2026-02-03.pdf');
    console.log(`Reading PDF from: ${pdfPath}`);

    if (!fs.existsSync(pdfPath)) {
        console.error('PDF file not found!');
        return;
    }

    const dataBuffer = fs.readFileSync(pdfPath);
    const data = new Uint8Array(dataBuffer);

    // Load PDF
    const loadingTask = pdfjsLib.getDocument({
        data: data,
        useSystemFonts: true,
        disableFontFace: true,
    });

    try {
        const pdf = await loadingTask.promise;
        console.log(`PDF loaded. Pages: ${pdf.numPages}`);

        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            // Join items with a separator to see structure
            const pageText = textContent.items.map((item) => item.str).join('\n'); 
            fullText += pageText + '\n\n';
        }

        console.log('--- START RAW TEXT ---');
        // console.log(fullText); // Too large for some terminals
        fs.writeFileSync(path.resolve(__dirname, 'debug_output.txt'), fullText);
        console.log('Text written to debug_output.txt');
        console.log('--- END RAW TEXT ---');
        
    } catch (error) {
        console.error('Error parsing PDF:', error);
    }
}

extractText();
