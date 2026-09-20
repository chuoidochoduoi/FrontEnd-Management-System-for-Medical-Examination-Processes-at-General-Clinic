import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/** Render a prepared A4 document to a local PDF; no document data leaves the browser. */
export async function downloadElementAsPdf(element, filename) {
    if (!element) throw new Error('Không tìm thấy nội dung để tạo PDF.');

    const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        windowWidth: element.scrollWidth,
    });
    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });
    const pageWidth = 210;
    const pageHeight = 297;
    const imageHeight = (canvas.height * pageWidth) / canvas.width;
    const image = canvas.toDataURL('image/jpeg', 0.96);

    let offset = 0;
    while (offset < imageHeight) {
        if (offset > 0) pdf.addPage();
        pdf.addImage(image, 'JPEG', 0, -offset, pageWidth, imageHeight, undefined, 'FAST');
        offset += pageHeight;
    }
    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}
