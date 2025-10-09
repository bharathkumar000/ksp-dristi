import { jsPDF } from 'jspdf';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  evidenceTrail?: string;
  leads?: string[];
  roleUsed?: string;
}

export function exportDossierToPDF(
  chatHistory: ChatMessage[],
  activeRole: string,
  sessionTitle: string = 'Investigation Briefing'
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;

  let yOffset = 20;

  // Helper to add new page if needed
  const checkPageOverflow = (heightNeeded: number) => {
    if (yOffset + heightNeeded > pageHeight - margin) {
      doc.addPage();
      drawPageBorder();
      drawFooter();
      yOffset = 20;
    }
  };

  // Border & Header details
  const drawPageBorder = () => {
    doc.setDrawColor(20, 30, 45); // Dark blue frame
    doc.setLineWidth(0.5);
    doc.rect(5, 5, pageWidth - 10, pageHeight - 10);
  };

  const drawFooter = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      'CONFIDENTIAL - FOR INTERNAL KSP USE ONLY',
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  };

  // Draw Page 1 header
  drawPageBorder();
  drawFooter();

  // Top Title banner
  doc.setFillColor(15, 23, 42); // slate-900 background
  doc.rect(5, 5, pageWidth - 10, 20, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('KARNATAKA STATE POLICE CRIME INTELLIGENCE PLATFORM', pageWidth / 2, 17, { align: 'center' });

  yOffset = 35;

  // Metadata block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('DOSSIER METADATA', margin, yOffset);
  yOffset += 5;

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yOffset, pageWidth - margin, yOffset);
  yOffset += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Export Time: ${new Date().toLocaleString()}`, margin, yOffset);
  doc.text(`Authorized Role: ${activeRole.toUpperCase()}`, margin + 80, yOffset);
  yOffset += 5;
  doc.text(`Session Context: ${sessionTitle}`, margin, yOffset);
  yOffset += 10;

  // Chat conversation
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('CHAT LOGS & CRIMINOLOGICAL SUMMARY', margin, yOffset);
  yOffset += 5;
  doc.line(margin, yOffset, pageWidth - margin, yOffset);
  yOffset += 8;

  chatHistory.forEach((msg) => {
    checkPageOverflow(25);

    // Header for Sender
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    if (msg.sender === 'user') {
      doc.setTextColor(30, 41, 59); // Slate
      doc.text(`[INVESTIGATOR QUERY - ${msg.roleUsed || activeRole}]`, margin, yOffset);
    } else {
      doc.setTextColor(3, 105, 161); // Light Blue (AI)
      doc.text('[CRIME INTEL ANALYTICS ENGINE]', margin, yOffset);
    }
    yOffset += 5;

    // Body Text wrap
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    
    // Split the text to fit the page width
    const textLines = doc.splitTextToSize(msg.text, contentWidth);
    const textHeight = textLines.length * 5;
    checkPageOverflow(textHeight + 10);
    
    doc.text(textLines, margin, yOffset);
    yOffset += textHeight + 4;

    // If AI message, render Evidence Trail and Leads
    if (msg.sender === 'ai') {
      if (msg.evidenceTrail) {
        checkPageOverflow(20);
        doc.setFillColor(248, 250, 252); // pale gray background
        doc.setDrawColor(226, 232, 240);
        
        const trailLines = doc.splitTextToSize(`Evidence Trail: ${msg.evidenceTrail}`, contentWidth - 4);
        const trailHeight = trailLines.length * 4.5 + 4;
        
        doc.rect(margin, yOffset, contentWidth, trailHeight, 'FD');
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        doc.text(trailLines, margin + 2, yOffset + 4);
        yOffset += trailHeight + 4;
      }

      if (msg.leads && msg.leads.length > 0) {
        checkPageOverflow(25);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(194, 65, 12); // Orange dark
        doc.text('Recommended Actionable Leads:', margin, yOffset);
        yOffset += 4.5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        msg.leads.forEach((lead) => {
          checkPageOverflow(6);
          doc.text(`- ${lead}`, margin + 3, yOffset);
          yOffset += 4.5;
        });
        yOffset += 3;
      }
    }

    yOffset += 6; // gap between messages
  });

  // Save the PDF document
  const fileName = `KSP_Intel_Briefing_${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(fileName);
}
