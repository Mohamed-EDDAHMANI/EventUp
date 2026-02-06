import { Injectable } from '@nestjs/common';

/** Minimal type for pdfkit document instance (ES module alternative to namespace) */
interface PDFDocumentInstance {
  on(event: string, fn: (...args: unknown[]) => void): void;
  font(font: string): PDFDocumentInstance;
  fontSize(size: number): PDFDocumentInstance;
  text(text: string, opts?: { align?: string }): PDFDocumentInstance;
  moveDown(n?: number): PDFDocumentInstance;
  fillColor(color: string): PDFDocumentInstance;
  end(): void;
}

// eslint-disable-next-line @typescript-eslint/no-require-imports -- pdfkit is CommonJS
const PDFDocument = require('pdfkit') as new (options?: {
  size?: string;
  margin?: number;
}) => PDFDocumentInstance;

export type TicketData = {
  eventTitle: string;
  eventDateTime: string;
  eventLocation: string;
  participantName: string;
  participantEmail: string;
  reservationId: string;
  confirmedAt?: string;
};

@Injectable()
export class PdfTicketService {
  /**
   * Génère un PDF billet/confirmation avec les détails de l'événement et du participant.
   */
  async generateTicket(data: TicketData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A5', margin: 40 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(18).font('Helvetica-Bold').text('EventUP', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').text('Billet de réservation confirmée', { align: 'center' });
      doc.moveDown(1.5);

      doc.font('Helvetica-Bold').fontSize(14).text(data.eventTitle);
      doc.moveDown(0.8);

      doc.font('Helvetica').fontSize(11);
      doc.text(`Date et heure : ${data.eventDateTime}`);
      doc.text(`Lieu : ${data.eventLocation}`);
      doc.moveDown(1);

      doc.font('Helvetica-Bold').fontSize(11).text('Participant');
      doc.font('Helvetica').fontSize(10);
      doc.text(`Nom : ${data.participantName}`);
      doc.text(`Email : ${data.participantEmail}`);
      doc.moveDown(1);

      doc.fontSize(9).fillColor('#666').text(`Réservation #${data.reservationId}`, { align: 'center' });
      if (data.confirmedAt) {
        doc.text(`Confirmée le ${data.confirmedAt}`, { align: 'center' });
      }
      doc.moveDown(0.5);
      doc.fontSize(8).text('Ce billet est valable sur présentation à l\'entrée de l\'événement.', {
        align: 'center',
      });

      doc.end();
    });
  }
}
