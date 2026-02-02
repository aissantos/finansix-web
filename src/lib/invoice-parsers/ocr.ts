/* eslint-disable */
// @ts-nocheck
import Tesseract from 'tesseract.js';

/**
 * Extracts text from an image file using Tesseract.js OCR.
 * @param file The image file to process.
 * @returns A promise that resolves with the extracted text.
 */
export async function extractTextFromImage(file: File): Promise<string> {
  try {
    const result = await Tesseract.recognize(
      file,
      'por', // Portuguese language
      {
        // logger: m => console.log(m), // Optional: logging progress
      }
    );
    
    return result.data.text;
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Falha ao processar imagem da fatura. Verifique se a imagem está nítida.');
  }
}
