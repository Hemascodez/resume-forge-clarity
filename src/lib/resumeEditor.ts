import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

export interface ResumeModifications {
  originalSkills: string[];
  confirmedSkills: string[];
  experienceChanges: { original: string; modified: string }[];
  jobTitle?: string;
  company?: string;
}

// Store the original file for later modification
let storedOriginalFile: File | null = null;
let storedOriginalText: string = '';

export const storeOriginalFile = (file: File, text: string) => {
  storedOriginalFile = file;
  storedOriginalText = text;
};

export const getStoredFile = () => storedOriginalFile;
export const getStoredText = () => storedOriginalText;

// Apply text replacements to content
const applyTextReplacements = (
  text: string, 
  modifications: ResumeModifications
): string => {
  let modifiedText = text;
  
  // Apply experience changes
  modifications.experienceChanges.forEach(change => {
    if (change.original && change.modified && change.original !== change.modified) {
      modifiedText = modifiedText.replace(change.original, change.modified);
    }
  });
  
  // Add new skills if they're not already present
  const newSkills = modifications.confirmedSkills.filter(
    skill => !modifications.originalSkills.some(
      os => os.toLowerCase() === skill.toLowerCase()
    )
  );
  
  if (newSkills.length > 0) {
    // Try to find skills section and append
    const skillsMatch = modifiedText.match(/(skills?|technologies|technical skills)[\s:]*([^\n]*)/i);
    if (skillsMatch) {
      const existingSkills = skillsMatch[2];
      const newSkillsText = newSkills.join(', ');
      modifiedText = modifiedText.replace(
        skillsMatch[0],
        `${skillsMatch[1]}: ${existingSkills}, ${newSkillsText}`
      );
    }
  }
  
  return modifiedText;
};

// Generate modified DOCX
export const generateModifiedDocx = async (
  modifications: ResumeModifications,
  resumeName: string = 'Candidate'
): Promise<void> => {
  const modifiedText = applyTextReplacements(storedOriginalText, modifications);
  const lines = modifiedText.split('\n').filter(l => l.trim());
  
  const children: Paragraph[] = [];
  
  // Parse and recreate document structure
  let inSection = '';
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Detect section headers
    if (trimmedLine.match(/^(experience|work history|education|skills|summary|objective|projects)/i)) {
      inSection = trimmedLine.toLowerCase();
      children.push(
        new Paragraph({
          text: trimmedLine.toUpperCase(),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        })
      );
    } else if (index === 0) {
      // First line is usually the name
      children.push(
        new Paragraph({
          text: trimmedLine,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
        })
      );
    } else if (index === 1 && !trimmedLine.match(/^(experience|skills)/i)) {
      // Second line is often title or contact
      children.push(
        new Paragraph({
          text: trimmedLine,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        })
      );
    } else if (trimmedLine.startsWith('-') || trimmedLine.startsWith('•') || trimmedLine.startsWith('*')) {
      // Bullet points - check if modified
      const bulletText = trimmedLine.replace(/^[-•*]\s*/, '');
      const isModified = modifications.experienceChanges.some(
        change => change.modified === bulletText
      );
      
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `• ${bulletText}`,
              color: isModified ? '228B22' : '000000', // Green if modified
              bold: isModified,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 360 },
        })
      );
    } else {
      // Regular paragraph
      children.push(
        new Paragraph({
          text: trimmedLine,
          spacing: { after: 100 },
        })
      );
    }
  });
  
  // Add tailored for note at the top
  if (modifications.jobTitle && modifications.company) {
    children.unshift(
      new Paragraph({
        children: [
          new TextRun({
            text: `Tailored for: ${modifications.jobTitle} at ${modifications.company}`,
            italics: true,
            size: 20,
            color: '666666',
          }),
        ],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 200 },
      })
    );
  }
  
  const doc = new Document({
    sections: [{
      properties: {},
      children,
    }],
  });
  
  const blob = await Packer.toBlob(doc);
  const filename = `${resumeName.replace(/[^a-zA-Z0-9]/g, '_')}_${modifications.company?.replace(/[^a-zA-Z0-9]/g, '_') || 'Tailored'}_Resume.docx`;
  saveAs(blob, filename);
};

// Generate modified PDF (overlay approach for simple cases)
export const generateModifiedPdf = async (
  modifications: ResumeModifications,
  resumeName: string = 'Candidate'
): Promise<void> => {
  // If we have the original PDF, try to add annotations
  if (storedOriginalFile && storedOriginalFile.type === 'application/pdf') {
    try {
      const arrayBuffer = await storedOriginalFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { height } = firstPage.getSize();
      
      // Add a note about tailoring at the top
      if (modifications.jobTitle && modifications.company) {
        const font = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
        firstPage.drawText(
          `Tailored for: ${modifications.jobTitle} at ${modifications.company}`,
          {
            x: 50,
            y: height - 30,
            size: 9,
            font,
            color: rgb(0.4, 0.4, 0.4),
          }
        );
      }
      
      // Add new skills at the bottom of first page if any
      const newSkills = modifications.confirmedSkills.filter(
        skill => !modifications.originalSkills.some(
          os => os.toLowerCase() === skill.toLowerCase()
        )
      );
      
      if (newSkills.length > 0) {
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        firstPage.drawText('Additional Skills (Verified):', {
          x: 50,
          y: 80,
          size: 10,
          font: boldFont,
          color: rgb(0.13, 0.55, 0.13), // Green
        });
        
        firstPage.drawText(newSkills.join(' • '), {
          x: 50,
          y: 65,
          size: 9,
          font,
          color: rgb(0.13, 0.55, 0.13),
        });
      }
      
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as ArrayBuffer], { type: 'application/pdf' });
      const filename = `${resumeName.replace(/[^a-zA-Z0-9]/g, '_')}_${modifications.company?.replace(/[^a-zA-Z0-9]/g, '_') || 'Tailored'}_Resume.pdf`;
      saveAs(blob, filename);
      return;
    } catch (error) {
      console.error('Error modifying PDF:', error);
      // Fall through to generate new PDF
    }
  }
  
  // Fallback: Generate a new PDF with the modified content
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  
  let page = pdfDoc.addPage([612, 792]); // Letter size
  const { width, height } = page.getSize();
  const margin = 50;
  let yPos = height - margin;
  
  // Add tailoring note
  if (modifications.jobTitle && modifications.company) {
    page.drawText(`Tailored for: ${modifications.jobTitle} at ${modifications.company}`, {
      x: margin,
      y: yPos,
      size: 9,
      font: italicFont,
      color: rgb(0.4, 0.4, 0.4),
    });
    yPos -= 25;
  }
  
  // Parse and render content
  const modifiedText = applyTextReplacements(storedOriginalText, modifications);
  const lines = modifiedText.split('\n').filter(l => l.trim());
  
  lines.forEach((line, index) => {
    if (yPos < margin + 50) {
      page = pdfDoc.addPage([612, 792]);
      yPos = height - margin;
    }
    
    const trimmedLine = line.trim();
    const isBullet = trimmedLine.startsWith('-') || trimmedLine.startsWith('•') || trimmedLine.startsWith('*');
    const isModified = modifications.experienceChanges.some(
      change => trimmedLine.includes(change.modified)
    );
    
    if (index === 0) {
      // Name
      page.drawText(trimmedLine, {
        x: margin,
        y: yPos,
        size: 20,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.1),
      });
      yPos -= 30;
    } else if (trimmedLine.match(/^(experience|work history|education|skills|summary|objective|projects)/i)) {
      // Section header
      yPos -= 10;
      page.drawText(trimmedLine.toUpperCase(), {
        x: margin,
        y: yPos,
        size: 12,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      yPos -= 20;
    } else if (isBullet) {
      const bulletText = trimmedLine.replace(/^[-•*]\s*/, '');
      page.drawText(`• ${bulletText}`, {
        x: margin + 15,
        y: yPos,
        size: 10,
        font: font,
        color: isModified ? rgb(0.13, 0.55, 0.13) : rgb(0.2, 0.2, 0.2),
      });
      yPos -= 15;
    } else {
      page.drawText(trimmedLine, {
        x: margin,
        y: yPos,
        size: 10,
        font: font,
        color: rgb(0.2, 0.2, 0.2),
      });
      yPos -= 15;
    }
  });
  
  // Footer
  const firstPage = pdfDoc.getPages()[0];
  firstPage.drawText('Generated with ResumeAI', {
    x: margin,
    y: 30,
    size: 8,
    font: italicFont,
    color: rgb(0.6, 0.6, 0.6),
  });
  
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as unknown as ArrayBuffer], { type: 'application/pdf' });
  const filename = `${resumeName.replace(/[^a-zA-Z0-9]/g, '_')}_${modifications.company?.replace(/[^a-zA-Z0-9]/g, '_') || 'Tailored'}_Resume.pdf`;
  saveAs(blob, filename);
};

// Main export function - determines format and generates accordingly
export const downloadModifiedResume = async (
  modifications: ResumeModifications,
  resumeName: string = 'Candidate',
  preferDocx: boolean = false
): Promise<void> => {
  const file = storedOriginalFile;
  
  if (file?.name.endsWith('.docx') || file?.name.endsWith('.doc') || preferDocx) {
    await generateModifiedDocx(modifications, resumeName);
  } else {
    await generateModifiedPdf(modifications, resumeName);
  }
};
