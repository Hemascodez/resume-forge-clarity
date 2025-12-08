import jsPDF from 'jspdf';

interface ResumeData {
  name: string;
  title: string;
  skills: string[];
  experience: { text: string; isModified: boolean }[];
  jobTitle?: string;
  company?: string;
}

export const generateResumePDF = (resume: ResumeData): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;

  // Header - Name
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(33, 33, 33);
  doc.text(resume.name, margin, yPos);
  yPos += 10;

  // Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(66, 133, 244); // Primary blue
  doc.text(resume.title, margin, yPos);
  yPos += 15;

  // Divider line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Target Position (if available)
  if (resume.jobTitle && resume.company) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text(`Tailored for: ${resume.jobTitle} at ${resume.company}`, margin, yPos);
    yPos += 15;
  }

  // Skills Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(33, 33, 33);
  doc.text('SKILLS', margin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(66, 66, 66);
  
  // Wrap skills text
  const skillsText = resume.skills.join(' • ');
  const skillsLines = doc.splitTextToSize(skillsText, contentWidth);
  doc.text(skillsLines, margin, yPos);
  yPos += skillsLines.length * 5 + 10;

  // Divider
  doc.setDrawColor(230, 230, 230);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Experience Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(33, 33, 33);
  doc.text('EXPERIENCE', margin, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  resume.experience.forEach((item) => {
    // Check if we need a new page
    if (yPos > 270) {
      doc.addPage();
      yPos = margin;
    }

    // Bullet point
    doc.setFillColor(66, 133, 244);
    doc.circle(margin + 2, yPos - 1, 1.5, 'F');

    // Experience text with highlight for modified items
    if (item.isModified) {
      doc.setTextColor(34, 139, 34); // Green for enhanced items
    } else {
      doc.setTextColor(66, 66, 66);
    }

    const lines = doc.splitTextToSize(item.text, contentWidth - 10);
    doc.text(lines, margin + 8, yPos);
    yPos += lines.length * 5 + 5;
  });

  // Footer
  yPos = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Generated with ResumeAI', margin, yPos);
  doc.text(new Date().toLocaleDateString(), pageWidth - margin - 30, yPos);

  // Generate filename
  const sanitizedName = resume.name.replace(/[^a-zA-Z0-9]/g, '_');
  const sanitizedCompany = resume.company?.replace(/[^a-zA-Z0-9]/g, '_') || 'Resume';
  const filename = `${sanitizedName}_${sanitizedCompany}_Resume.pdf`;

  // Download
  doc.save(filename);
};
