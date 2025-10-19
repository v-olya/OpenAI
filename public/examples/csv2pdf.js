import fs from 'fs';
import PDFDocument from 'pdfkit';
import { parse } from 'csv-parse/sync';

const inputCsv = process.argv[2] || 'input.csv';
const outputPdf = process.argv[3] || 'output.pdf';

const csvBuffer = fs.readFileSync(inputCsv);
const records = parse(csvBuffer, {
    relax_column_count: true,
    skip_empty_lines: true,
});

// Create PDF
const doc = new PDFDocument({ size: 'A4', margin: 40 });
doc.pipe(fs.createWriteStream(outputPdf));
doc.font('Helvetica').fontSize(10);

const pageWidth =
    doc.page.width - doc.page.margins.left - doc.page.margins.right;
const padding = 6;

// Determine max columns
const colCount = records.reduce((max, row) => Math.max(max, row.length), 0);

// Compute column widths by measuring text
let colWidths = new Array(colCount).fill(0);
for (let r = 0; r < records.length; r++) {
    for (let c = 0; c < colCount; c++) {
        const text = records[r][c] !== undefined ? String(records[r][c]) : '';
        const w = doc.widthOfString(text);
        if (w + padding * 2 > colWidths[c]) colWidths[c] = w + padding * 2;
    }
}

// If total width exceeds page, scale widths proportionally
const totalWidth = colWidths.reduce((a, b) => a + b, 0);
if (totalWidth > pageWidth) {
    const scale = pageWidth / totalWidth;
    colWidths = colWidths.map((w) => Math.floor(w * scale));
}

// Header style (first row)
let y = doc.y;
const header = records.length ? records[0] : [];
const bodyRows = records.length > 1 ? records.slice(1) : [];

// Helper to draw a row (supports wrapping within column width)
function drawRow(row, isHeader = false) {
    // compute height needed
    const cellHeights = [];
    for (let c = 0; c < colCount; c++) {
        const text = row[c] !== undefined ? String(row[c]) : '';
        const cw = colWidths[c] || 50;
        const h = doc.heightOfString(text, {
            width: cw - padding * 2,
            align: 'left',
        });
        cellHeights.push(h);
    }
    const rowHeight = Math.max(...cellHeights) + padding * 2;

    // new page if needed
    if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        y = doc.y;
    }

    // draw cells
    let x = doc.page.margins.left;
    for (let c = 0; c < colCount; c++) {
        const cw = colWidths[c] || 50;
        const text = row[c] !== undefined ? String(row[c]) : '';
        // optional header background
        if (isHeader) {
            doc.rect(x, y, cw, rowHeight).fillColor('#eeeeee').fill();
            doc.fillColor('black');
        }
        // text
        doc.fillColor('black');
        doc.font(isHeader ? 'Helvetica-Bold' : 'Helvetica')
            .fontSize(10)
            .text(text, x + padding, y + padding, {
                width: cw - padding * 2,
                height: rowHeight - padding * 2,
            });
        // cell border (optional)
        doc.rect(x, y, cw, rowHeight)
            .strokeColor('#cccccc')
            .lineWidth(0.2)
            .stroke();

        x += cw;
    }
    y += rowHeight;
}

// Draw header and body
if (header.length) {
    drawRow(header, true);
}
for (const r of bodyRows) {
    drawRow(r, false);
}

doc.end();
console.log(`Wrote PDF to ${outputPdf}`);
