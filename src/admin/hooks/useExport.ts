import { useCallback } from 'react';

export type ExportFormat = 'csv' | 'excel' | 'json';

interface ExportOptions {
  filename?: string;
  headers?: string[];
}

/**
 * Hook for data export functionality
 */
export function useExport() {
  /**
   * Export data to CSV format
   */
  const exportToCSV = useCallback((data: Record<string, unknown>[], options: ExportOptions = {}) => {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    const { filename = 'export.csv', headers } = options;

    // Get headers from first object if not provided
    const csvHeaders = headers || Object.keys(data[0]);

    // Create CSV content
    const csvContent = [
      csvHeaders.join(','), // Header row
      ...data.map((row) =>
        csvHeaders
          .map((header) => {
            const value = row[header];
            // Escape quotes and wrap in quotes if contains comma
            const stringValue = String(value ?? '');
            return stringValue.includes(',') || stringValue.includes('"')
              ? `"${stringValue.replace(/"/g, '""')}"`
              : stringValue;
          })
          .join(',')
      ),
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  /**
   * Export data to JSON format
   */
  const exportToJSON = useCallback((data: Record<string, unknown>[], options: ExportOptions = {}) => {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    const { filename = 'export.json' } = options;

    const jsonContent = JSON.stringify(data, null, 2);

    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  /**
   * Export data to Excel format (requires xlsx library)
   * Note: Install with: pnpm add xlsx
   */
  const exportToExcel = useCallback(async (data: Record<string, unknown>[], options: ExportOptions = {}) => {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    const { filename = 'export.xlsx' } = options;

    try {
      // Dynamic import to avoid bundling if not used
      const XLSX = await import('xlsx');

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(data);

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

      // Generate file
      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error('Excel export error:', error);
      throw new Error('Failed to export to Excel. Make sure xlsx library is installed.');
    }
  }, []);

  /**
   * Copy data to clipboard as JSON
   */
  const copyToClipboard = useCallback(async (data: Record<string, unknown>[]) => {
    if (!data || data.length === 0) {
      throw new Error('No data to copy');
    }

    const jsonContent = JSON.stringify(data, null, 2);

    try {
      await navigator.clipboard.writeText(jsonContent);
      return true;
    } catch (error) {
      console.error('Clipboard copy error:', error);
      throw new Error('Failed to copy to clipboard');
    }
  }, []);

  return {
    exportToCSV,
    exportToJSON,
    exportToExcel,
    copyToClipboard,
  };
}
