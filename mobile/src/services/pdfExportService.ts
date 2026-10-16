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
    // 1. Fetch publication HTML with KaTeX and responsive print layout from backend
    const { html } = await api.getPaperHtml(paper, includeAnswerKey, includeSolutions);

    // 2. Render to PDF file
    const file = await Print.printToFileAsync({
      html,
      base64: false,
    });

    return { uri: file.uri };
  }

  /**
   * Print directly to airprint / WiFi printer
   */
  public static async printDirectly(
    paper: GeneratedPaper,
    includeAnswerKey = true,
    includeSolutions = false
  ): Promise<void> {
    const { html } = await api.getPaperHtml(paper, includeAnswerKey, includeSolutions);
    await Print.printAsync({ html });
  }

  /**
   * Native Share Sheet integration: Opens the device share dialog for PDF
   */
  public static async sharePdf(pdfUri: string, dialogTitle: string = 'Share Question Paper PDF'): Promise<void> {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Native sharing is not available on this device.');
    }

    await Sharing.shareAsync(pdfUri, {
      mimeType: 'application/pdf',
      dialogTitle,
      UTI: 'com.adobe.pdf',
    });
  }
}
