import AdmZip from 'adm-zip';
import * as XLSX from 'xlsx';

// Safe dynamic or standard import for pdf-parse
async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  try {
    const pdfModule = await import('pdf-parse');
    // @ts-ignore
    const pdf = pdfModule.default || pdfModule;
    const data = await pdf(buffer);
    if (!data || !data.text || !data.text.trim()) {
      return 'Documento PDF procesado sin texto seleccionable (posible imagen escaneada).';
    }
    return data.text.trim();
  } catch (err: any) {
    console.error('Error parsing PDF:', err);
    throw new Error(`Error al procesar el archivo PDF: ${err.message || 'Formato no legible'}`);
  }
}

// Parse Excel files (.xlsx, .xls, .csv, .tsv)
function parseExcelBuffer(buffer: Buffer, filename: string): string {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetNames = workbook.SheetNames;
    if (!sheetNames || sheetNames.length === 0) {
      return 'Libro de Excel vacío.';
    }

    const sections: string[] = [];
    sections.push(`DOCUMENTO EXCEL: ${filename}`);

    for (const sheetName of sheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) continue;

      // Convert sheet to clean CSV text format with commas
      const csv = XLSX.utils.sheet_to_csv(worksheet, { blankrows: false }).trim();
      if (csv) {
        sections.push(`--- HOJA: ${sheetName} ---\n${csv}`);
      }
    }

    return sections.join('\n\n');
  } catch (err: any) {
    console.error('Error parsing Excel:', err);
    throw new Error(`Error al procesar archivo de Excel: ${err.message || 'Formato corrupto o inválido'}`);
  }
}

// Parse PowerPoint (.pptx)
function parsePptxBuffer(buffer: Buffer, filename: string): string {
  try {
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();

    // Find all slide XML files (e.g. ppt/slides/slide1.xml)
    const slideEntries = zipEntries
      .filter((entry) => entry.entryName.startsWith('ppt/slides/slide') && entry.entryName.endsWith('.xml'))
      .sort((a, b) => {
        const numA = parseInt(a.entryName.replace(/\D/g, '') || '0', 10);
        const numB = parseInt(b.entryName.replace(/\D/g, '') || '0', 10);
        return numA - numB;
      });

    if (slideEntries.length === 0) {
      return `Presentación de PowerPoint: ${filename} (Sin diapositivas legibles).`;
    }

    const slidesText: string[] = [];
    slidesText.push(`PRESENTACIÓN POWERPOINT: ${filename}\nTotal de Diapositivas: ${slideEntries.length}`);

    slideEntries.forEach((entry, index) => {
      const xml = entry.getData().toString('utf8');
      // Extract all text inside <a:t>...</a:t> tags
      const textMatches = xml.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g);
      if (textMatches && textMatches.length > 0) {
        const slideLines: string[] = [];
        textMatches.forEach((tag) => {
          const text = tag.replace(/<[^>]+>/g, '').trim();
          if (text) {
            slideLines.push(text);
          }
        });

        if (slideLines.length > 0) {
          slidesText.push(`--- DIAPOSITIVA ${index + 1} ---\n${slideLines.join('\n')}`);
        }
      }
    });

    return slidesText.join('\n\n');
  } catch (err: any) {
    console.error('Error parsing PPTX:', err);
    throw new Error(`Error al procesar la presentación PowerPoint (.pptx): ${err.message || 'Formato inválido'}`);
  }
}

// Parse Word (.docx)
function parseDocxBuffer(buffer: Buffer, filename: string): string {
  try {
    const zip = new AdmZip(buffer);
    const docEntry = zip.getEntry('word/document.xml');
    if (!docEntry) {
      return `Documento Word: ${filename} (Sin contenido XML legible).`;
    }

    const xml = docEntry.getData().toString('utf8');
    // Group by paragraphs <w:p>
    const paragraphs = xml.match(/<w:p[^>]*>[\s\S]*?<\/w:p>/g) || [];
    const lines: string[] = [];

    paragraphs.forEach((p) => {
      const textMatches = p.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g);
      if (textMatches) {
        const pText = textMatches.map((t) => t.replace(/<[^>]+>/g, '')).join('');
        if (pText.trim()) {
          lines.push(pText.trim());
        }
      }
    });

    return `DOCUMENTO WORD: ${filename}\n\n${lines.join('\n\n')}`;
  } catch (err: any) {
    console.error('Error parsing DOCX:', err);
    throw new Error(`Error al procesar documento Word (.docx): ${err.message}`);
  }
}

/**
 * Main extractor supporting PDF, PowerPoint, Excel, Word, Text, Markdown, CSV, JSON
 */
export async function extractTextFromBuffer(
  buffer: Buffer,
  filename: string,
  mimeType?: string
): Promise<{ text: string; fileType: string; formatLabel: string }> {
  const ext = (filename.split('.').pop() || '').toLowerCase();

  // 1. PDF
  if (ext === 'pdf' || mimeType?.includes('pdf')) {
    const text = await parsePdfBuffer(buffer);
    return { text, fileType: 'application/pdf', formatLabel: 'PDF' };
  }

  // 2. Excel (.xlsx, .xls, .csv)
  if (['xlsx', 'xls', 'csv', 'tsv'].includes(ext) || mimeType?.includes('spreadsheet') || mimeType?.includes('excel')) {
    const text = parseExcelBuffer(buffer, filename);
    return {
      text,
      fileType: ext === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      formatLabel: ext.toUpperCase()
    };
  }

  // 3. PowerPoint (.pptx)
  if (ext === 'pptx' || mimeType?.includes('presentation') || mimeType?.includes('powerpoint')) {
    const text = parsePptxBuffer(buffer, filename);
    return {
      text,
      fileType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      formatLabel: 'PowerPoint (PPTX)'
    };
  }

  // 4. Word (.docx)
  if (ext === 'docx' || mimeType?.includes('wordprocessingml')) {
    const text = parseDocxBuffer(buffer, filename);
    return {
      text,
      fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      formatLabel: 'Word (DOCX)'
    };
  }

  // 5. Plain Text / Markdown / JSON
  const rawText = buffer.toString('utf8');
  return {
    text: rawText,
    fileType: ext === 'md' ? 'text/markdown' : ext === 'json' ? 'application/json' : 'text/plain',
    formatLabel: ext.toUpperCase() || 'Texto Plano'
  };
}
