import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export interface CodeItem {
    code: string;
    createdAt?: string;
    usedBy?: string | {
        fullName: string;
        universityId: string;
    } | null;
    usedAt?: string | null;
}

export interface PDFOptions {
    title: string;
    courseName: string;
    codes: CodeItem[];
    showQRCode?: boolean;
    codesPerPage?: number;
}

/**
 * Generates a PDF document with course codes and optional QR codes
 */
export async function generateCodesPDF(options: PDFOptions): Promise<void> {
    const {
        title,
        courseName,
        codes,
        showQRCode = true,
        codesPerPage = 6, // 2 columns x 3 rows
    } = options;

    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;
    const contentHeight = pageHeight - 2 * margin - 30; // 30 for header/footer

    // Header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, pageWidth / 2, 20, { align: 'center' });

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Course: ${courseName}`, pageWidth / 2, 28, { align: 'center' });
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 34, { align: 'center' });
    pdf.text(`Total Codes: ${codes.length}`, pageWidth / 2, 40, { align: 'center' });

    // Draw header line
    pdf.setLineWidth(0.5);
    pdf.line(margin, 45, pageWidth - margin, 45);

    const itemsPerRow = 2;
    const itemWidth = (contentWidth - 10) / itemsPerRow; // 10 for spacing between items
    const itemHeight = showQRCode ? 60 : 20;
    const itemSpacing = 5;
    const qrCodeSize = 40;
    const rowsPerPage = Math.floor(codesPerPage / itemsPerRow);
    let currentRow = 0;
    let currentPage = 1;

    for (let i = 0; i < codes.length; i++) {
        const col = i % itemsPerRow;
        const rowInPage = currentRow % rowsPerPage;

        // Check if we need a new page (when starting a new row and we've filled the page)
        if (col === 0 && rowInPage === 0 && currentRow > 0) {
            pdf.addPage();
            currentPage++;
            // Add header to new page
            pdf.setFontSize(20);
            pdf.setFont('helvetica', 'bold');
            pdf.text(title, pageWidth / 2, 20, { align: 'center' });
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`Course: ${courseName}`, pageWidth / 2, 28, { align: 'center' });
            pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 34, { align: 'center' });
            pdf.text(`Total Codes: ${codes.length}`, pageWidth / 2, 40, { align: 'center' });
            pdf.setLineWidth(0.5);
            pdf.line(margin, 45, pageWidth - margin, 45);
        }

        // Calculate position for this item
        const xPosition = margin + col * (itemWidth + 10);
        const yPosition = 55 + rowInPage * (itemHeight + itemSpacing);

        const code = codes[i];

        // Draw border around code item
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.3);
        pdf.rect(xPosition, yPosition, itemWidth, itemHeight);

        // Generate and add QR code if enabled
        if (showQRCode) {
            try {
                const qrDataUrl = await QRCode.toDataURL(code.code, {
                    width: 200,
                    margin: 1,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF',
                    },
                });

                // Add QR code image
                const qrX = xPosition + (itemWidth - qrCodeSize) / 2;
                const qrY = yPosition + 5;
                pdf.addImage(qrDataUrl, 'PNG', qrX, qrY, qrCodeSize, qrCodeSize);

                // Add code text below QR code
                pdf.setFontSize(10);
                pdf.setFont('helvetica', 'bold');
                const codeTextY = qrY + qrCodeSize + 5;
                const codeText = code.code.length > 20 ? code.code.substring(0, 20) + '...' : code.code;
                pdf.text(codeText, xPosition + itemWidth / 2, codeTextY, { align: 'center', maxWidth: itemWidth - 4 });

                // Add additional info if available
                if (code.usedBy || code.usedAt) {
                    pdf.setFontSize(8);
                    pdf.setFont('helvetica', 'normal');
                    let infoY = codeTextY + 5;

                    if (code.usedBy && typeof code.usedBy === 'object') {
                        pdf.text(`Used by: ${code.usedBy.fullName}`, xPosition + itemWidth / 2, infoY, { align: 'center', maxWidth: itemWidth - 4 });
                        infoY += 4;
                    }

                    if (code.usedAt) {
                        const usedDate = new Date(code.usedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                        });
                        pdf.text(`Used: ${usedDate}`, xPosition + itemWidth / 2, infoY, { align: 'center', maxWidth: itemWidth - 4 });
                    }
                }
            } catch (error) {
                console.error('Error generating QR code:', error);
                // Fallback: just show the code text
                pdf.setFontSize(12);
                pdf.setFont('helvetica', 'bold');
                pdf.text(code.code, xPosition + itemWidth / 2, yPosition + itemHeight / 2, { align: 'center', maxWidth: itemWidth - 4 });
            }
        } else {
            // Just text without QR code
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text(code.code, xPosition + itemWidth / 2, yPosition + itemHeight / 2, { align: 'center', maxWidth: itemWidth - 4 });
        }

        // Move to next row when we complete a row
        if (col === itemsPerRow - 1) {
            currentRow++;
        }
    }

    // Add page numbers
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(
            `Page ${i} of ${totalPages}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
        );
    }

    // Generate filename
    const filename = `${courseName.replace(/[^a-z0-9]/gi, '_')}_${title.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

    // Save the PDF
    pdf.save(filename);
}

