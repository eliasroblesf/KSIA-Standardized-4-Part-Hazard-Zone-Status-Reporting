/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InspectionReport } from '../types';
import { format } from 'date-fns';

export const generatePDF = async (report: InspectionReport) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // --- Header ---
  doc.setFillColor(0, 86, 179); // Riyadh Airport Blue
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('KING SALMAN INTERNATIONAL AIRPORT', 15, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('STANDARDIZED 4-PART HAZARD & ZONE STATUS REPORT', 15, 30);
  doc.text('SECTION 3.1.2.4a | ISO 45001 & ISO 14001 COMPLIANT', 15, 35);

  let y = 50;

  // --- Admin Section ---
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('1. REPORT ADMINISTRATIVE CONTROL', 15, y);
  y += 10;

  autoTable(doc, {
    startY: y,
    head: [['Field', 'Record Details']],
    body: [
      ['Facility', report.facility],
      ['Terminal / Concourse', report.terminal || 'N/A'],
      ['Sector / Area', report.sector || 'N/A'],
      ['Floor / Level', report.floor || 'N/A'],
      ['Reporter Name', report.reporterName || 'N/A'],
      ['Staff ID / Role', `${report.staffId || 'N/A'} - ${report.role || 'N/A'}`],
      ['Date & Shift', `${report.reportingDate} (${report.shift})`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 }
  });

  y = (doc as any).lastAutoTable.finalY + 15;

  // --- Hazards Section ---
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('2. STANDARDIZED HAZARD & ZONE ASSESSMENT', 15, y);
  y += 10;

  for (let i = 0; i < report.hazards.length; i++) {
    const h = report.hazards[i];
    
    if (y > 230) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(245, 245, 245);
    doc.rect(15, y, pageWidth - 30, 8, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`HAZARD #${i + 1}: ${h.hazardCategory} Hazard at ${h.zoneId}`, 20, y + 6);
    y += 12;

    autoTable(doc, {
      startY: y,
      body: [
        ['PART 1: HAZARD', h.hazardDescription || 'No description provided'],
        ['PART 2: ZONE STATUS', `Status: ${h.zoneStatus} | Location: ${h.locationDetails || 'N/A'}`],
        ['PART 3: IMPACT & RISK', `Risk Index: ${h.likelihood * h.consequence} (${h.riskLevel}) | Impact: ${h.potentialImpact || 'N/A'}`],
        ['PART 4: RECOVERY', `Immediate Action: ${h.immediateActionTaken || 'N/A'} | Owner: ${h.owner || 'N/A'} | Target: ${h.targetDate || 'N/A'}`],
      ],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2.5 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40, fillColor: [250, 250, 250] }
      }
    });

    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // --- Sign-off ---
  if (y > 230) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('3. FORMAL ACKNOWLEDGEMENT & ESCALATION', 15, y);
  y += 10;

  autoTable(doc, {
    startY: y,
    head: [['Role', 'Name / Signature', 'Date / Time']],
    body: [
      ['Reporter', report.reporterSignature || '_______________________', format(new Date(), 'dd/MM/yyyy HH:mm')],
      ['Supervisor / Duty Manager', report.supervisorSignature || '_______________________', '____/____/2026'],
      ['AOC Representative', report.aocAcknowledgement || '_______________________', '____/____/2026']
    ],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 5 }
  });

  // --- Photos ---
  const allPhotos: { ref: string, photo: string }[] = [];
  report.hazards.forEach((h, idx) => {
    h.photos.forEach(p => {
      allPhotos.push({ ref: `Hazard #${idx + 1} (${h.zoneId})`, photo: p });
    });
  });

  if (allPhotos.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('APPENDIX: PHOTO EVIDENCE', 15, 20);
    
    let photoY = 30;
    let photoX = 15;
    const photoWidth = 85;
    const photoHeight = 60;

    allPhotos.forEach((item, index) => {
      if (photoY > 230) {
        doc.addPage();
        photoY = 20;
      }

      try {
        doc.addImage(item.photo, 'JPEG', photoX, photoY, photoWidth, photoHeight);
        doc.setFontSize(8);
        doc.text(`Ref: ${item.ref}`, photoX, photoY + photoHeight + 5);
      } catch (e) {
        console.error('Failed to add image to PDF', e);
      }

      if (index % 2 === 0) {
        photoX = 110;
      } else {
        photoX = 15;
        photoY += 80;
      }
    });
  }

  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `KSIA HAZARD REPORT | ID: ${report.id.substring(0, 8)} | Section 3.1.2.4a | Page ${i} of ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  doc.save(`KSIA_HAZARD_REPORT_${report.terminal || 'EXPORT'}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
};
