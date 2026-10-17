import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { GeneratedPaper } from '../types';
import { api } from './api';

export class PdfExportService {
  /**
   * Generates a PDF file from the paper's publication HTML using expo-print.
   * STRICT ENFORCEMENT: PDF ONLY (no DOCX/Word exports permitted).
   */
  public static async generatePdf(
    paper: GeneratedPaper,
    includeAnswerKey = true,
    includeSolutions = false
  ): Promise<{ uri: string }> {
    const { html } = await api.getPaperHtml(paper, includeAnswerKey, includeSolutions);

    if (Platform.OS === 'web') {
      // On Web, use Blob URI or trigger Print directly
      const blob = new Blob([html], { type: 'text/html' });
      const uri = URL.createObjectURL(blob);
      return { uri };
    }

    const file = await Print.printToFileAsync({
      html,
      base64: false,
    });

    return { uri: file.uri };
  }

  /**
   * Print directly to airprint / WiFi printer or trigger browser print dialog
   */
  public static async printDirectly(
    paper: GeneratedPaper,
    includeAnswerKey = true,
    includeSolutions = false
  ): Promise<void> {
    const { html } = await api.getPaperHtml(paper, includeAnswerKey, includeSolutions);

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
        }, 600);
        return;
      }
    }

    await Print.printAsync({ html });
  }

  /**
   * Native Share Sheet integration: Opens the device share dialog for PDF
   * On Web: Opens print view or downloads file
   */
  public static async sharePdf(pdfUri: string, dialogTitle: string = 'Share Question Paper PDF'): Promise<void> {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(pdfUri, '_blank');
      return;
    }

    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Device does not support native sharing sheet.');
    }

    await Sharing.shareAsync(pdfUri, {
      mimeType: 'application/pdf',
      dialogTitle,
      UTI: 'com.adobe.pdf',
    });
  }
}
