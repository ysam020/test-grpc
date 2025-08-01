import { PDFDocument } from 'pdf-lib';
import { fromBuffer } from 'pdf2pic';
import PDFKit from 'pdfkit';
import stream from 'stream';

async function mergePdf(buffers: Buffer[]): Promise<Buffer> {
    console.log('Merging PDFs');

    const merged = await PDFDocument.create();

    for (const buf of buffers) {
        const doc = await PDFDocument.load(ensureBuffer(buf));
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
    }

    console.log('PDF merged');

    return Buffer.from(await merged.save());
}

async function pdfToImages(pdfBuffer: any): Promise<Buffer[]> {
    console.log('Converting PDF to images');

    const converter = fromBuffer(ensureBuffer(pdfBuffer), {
        density: 200,
        format: 'jpeg',
        width: 1200,
        height: 1600,
    });

    const results = await converter.bulk(-1, { responseType: 'base64' });

    console.log('PDF converted to images');

    return results.map((page) => {
        return Buffer.from(page.base64!, 'base64');
    });
}

async function imagesToPdf(images: Buffer[]): Promise<Buffer> {
    console.log('Converting images to PDF');

    const doc = new PDFKit({ autoFirstPage: false });
    const passThrough = new stream.PassThrough();
    const buffers: Buffer[] = [];

    doc.pipe(passThrough);

    // Collect buffer chunks
    passThrough.on('data', (chunk: Buffer) => buffers.push(chunk));

    // Add one page per image
    for (const img of images) {
        doc.addPage({ size: 'A4' });
        doc.image(ensureBuffer(img), 0, 0, { fit: [595.28, 841.89] }); // A4 in pt
    }

    doc.end();

    // Wait until writing finishes
    await new Promise((resolve) => passThrough.on('end', resolve));

    console.log('Images converted to PDF');

    return Buffer.concat(buffers);
}

function unwrapCodeFence(s: string): string {
    return s
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/```$/, '')
        .trim();
}

const ensureBuffer = (input: any) =>
    input?.type === 'Buffer' && Array.isArray(input.data)
        ? Buffer.from(input.data)
        : input;

export { mergePdf, pdfToImages, imagesToPdf, unwrapCodeFence, ensureBuffer };
