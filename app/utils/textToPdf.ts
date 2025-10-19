import jsPDF from 'jspdf';

export type TextToPdfOptions = {
    fontSize?: number;
    fontName?: string; // use monospace by default to preserve indentation
    pageSize?: any;
    margin?: number;
};

/**
 * Convert a plain-text File (txt, csv, py, md, json, etc.) to a PDF Blob.
 * Designed to run in the browser.
 */
export async function textFileToPdfBlob(
    file: File,
    opts: TextToPdfOptions = {}
): Promise<Blob> {
    const fontSize = opts.fontSize ?? 10;
    const fontName = opts.fontName ?? 'courier';
    const pageSize = opts.pageSize ?? 'a4';
    const margin = opts.margin ?? 40;

    const text = await file.text();
    const lines = text.split(/\r\n|\n/);

    const doc = new jsPDF({ unit: 'pt', format: pageSize });
    doc.setFont(fontName as any);
    doc.setFontSize(fontSize);

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const usableWidth = pageWidth - margin * 2;
    const lineHeight = Math.ceil(fontSize * 1.25);
    let y = margin;

    for (let i = 0; i < lines.length; i++) {
        const wrapped = doc.splitTextToSize(lines[i], usableWidth);
        for (const wline of wrapped) {
            if (y + lineHeight > pageHeight - margin) {
                doc.addPage();
                y = margin;
                doc.setFont(fontName as any);
                doc.setFontSize(fontSize);
            }
            // text baseline offset
            doc.text(String(wline), margin, y + fontSize);
            y += lineHeight;
        }
    }

    return doc.output('blob');
}

/**
 * Convert a File to a File (PDF) with same base name and .pdf extension.
 */
export async function textFileToPdfFile(
    file: File,
    opts: TextToPdfOptions = {}
): Promise<File> {
    const blob = await textFileToPdfBlob(file, opts);
    const base = (file.name || 'converted').replace(/\.[^/.]+$/, '');
    return new File([blob], `${base}.pdf`, { type: 'application/pdf' });
}
