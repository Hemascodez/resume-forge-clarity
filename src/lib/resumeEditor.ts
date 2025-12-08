import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, TableCell, TableRow, Table, WidthType } from 'docx';
import { saveAs } from 'file-saver';

export type TemplateType = 'modern' | 'classic' | 'minimal' | 'executive';

export interface ResumeModifications {
  originalSkills: string[];
  confirmedSkills: string[];
  experienceChanges: { original: string; modified: string }[];
  jobTitle?: string;
  company?: string;
}

export interface ResumeData {
  name: string;
  title: string;
  skills: string[];
  experience: { text: string; isModified: boolean }[];
  originalExperience?: { title: string; company: string; bullets: string[] }[];
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

// Generate Modern Template DOCX
const generateModernDocx = async (
  resumeData: ResumeData,
  modifications: ResumeModifications,
): Promise<Blob> => {
  const newSkills = modifications.confirmedSkills.filter(
    skill => !modifications.originalSkills.some(os => os.toLowerCase() === skill.toLowerCase())
  );
  const allSkills = [...modifications.originalSkills, ...newSkills];

  const children: Paragraph[] = [];

  // Tailored for note
  if (modifications.jobTitle && modifications.company) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Tailored for: ${modifications.jobTitle} at ${modifications.company}`,
            italics: true,
            size: 18,
            color: '666666',
          }),
        ],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 200 },
      })
    );
  }

  // Name with left border effect (using indent)
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: resumeData.name,
          bold: true,
          size: 48,
          color: '1a1a1a',
        }),
      ],
      spacing: { after: 50 },
      border: {
        left: { style: BorderStyle.THICK, size: 24, color: '3B82F6' },
      },
      indent: { left: 200 },
    })
  );

  // Title
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: resumeData.title,
          bold: true,
          size: 24,
          color: '3B82F6',
        }),
      ],
      spacing: { after: 100 },
      indent: { left: 200 },
    })
  );

  // Contact
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'email@example.com • (555) 123-4567 • Location',
          size: 18,
          color: '666666',
        }),
      ],
      spacing: { after: 400 },
      indent: { left: 200 },
    })
  );

  // Skills Section
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'SKILLS',
          bold: true,
          size: 24,
          color: '1a1a1a',
        }),
      ],
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '3B82F6' } },
      spacing: { before: 200, after: 150 },
    })
  );

  // Skills as comma-separated with new skills highlighted
  const skillRuns: TextRun[] = [];
  allSkills.forEach((skill, i) => {
    const isNew = newSkills.includes(skill);
    skillRuns.push(
      new TextRun({
        text: skill + (isNew ? ' ✓' : ''),
        size: 20,
        color: isNew ? '22C55E' : '3B82F6',
        bold: isNew,
      })
    );
    if (i < allSkills.length - 1) {
      skillRuns.push(new TextRun({ text: ' • ', size: 20, color: '999999' }));
    }
  });
  children.push(new Paragraph({ children: skillRuns, spacing: { after: 300 } }));

  // Experience Section
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'PROFESSIONAL EXPERIENCE',
          bold: true,
          size: 24,
          color: '1a1a1a',
        }),
      ],
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '3B82F6' } },
      spacing: { before: 200, after: 150 },
    })
  );

  // Original experience entries
  if (resumeData.originalExperience && resumeData.originalExperience.length > 0) {
    for (const exp of resumeData.originalExperience) {
      // Title and company
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: exp.title, bold: true, size: 22, color: '1a1a1a' }),
            new TextRun({ text: ' — ', size: 22, color: '999999' }),
            new TextRun({ text: exp.company, size: 22, color: '666666' }),
          ],
          spacing: { before: 150, after: 100 },
        })
      );

      // Bullets
      for (const bullet of exp.bullets) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: '• ', size: 20, color: '3B82F6' }),
              new TextRun({ text: bullet, size: 20, color: '444444' }),
            ],
            indent: { left: 300 },
            spacing: { after: 50 },
          })
        );
      }
    }
  }

  // AI-enhanced additions
  const enhancedItems = resumeData.experience.filter(e => e.isModified);
  if (enhancedItems.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '✨ Verified Skill Additions',
            bold: true,
            size: 20,
            color: '22C55E',
          }),
        ],
        spacing: { before: 200, after: 100 },
      })
    );

    for (const item of enhancedItems) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: '• ', size: 20, color: '22C55E' }),
            new TextRun({ text: item.text, size: 20, color: '22C55E' }),
          ],
          indent: { left: 300 },
          spacing: { after: 50 },
        })
      );
    }
  }

  // Footer
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated with ResumeAI • ${new Date().toLocaleDateString()}`,
          italics: true,
          size: 16,
          color: '999999',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 },
    })
  );

  const doc = new Document({ sections: [{ properties: {}, children }] });
  return await Packer.toBlob(doc);
};

// Generate Classic Template DOCX
const generateClassicDocx = async (
  resumeData: ResumeData,
  modifications: ResumeModifications,
): Promise<Blob> => {
  const newSkills = modifications.confirmedSkills.filter(
    skill => !modifications.originalSkills.some(os => os.toLowerCase() === skill.toLowerCase())
  );
  const allSkills = [...modifications.originalSkills, ...newSkills];

  const children: Paragraph[] = [];

  // Tailored for note
  if (modifications.jobTitle && modifications.company) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Tailored for: ${modifications.jobTitle} at ${modifications.company}`,
            italics: true,
            size: 18,
            color: '666666',
          }),
        ],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 200 },
      })
    );
  }

  // Name centered
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: resumeData.name.toUpperCase(),
          bold: true,
          size: 48,
          color: '000000',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 50 },
    })
  );

  // Title
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: resumeData.title,
          size: 24,
          color: '444444',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    })
  );

  // Contact
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'email@example.com | (555) 123-4567 | Location',
          size: 18,
          color: '666666',
        }),
      ],
      alignment: AlignmentType.CENTER,
      border: { bottom: { style: BorderStyle.DOUBLE, size: 6, color: '000000' } },
      spacing: { after: 300 },
    })
  );

  // Skills Section
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'PROFESSIONAL SKILLS',
          bold: true,
          size: 22,
          color: '000000',
        }),
      ],
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' } },
      spacing: { before: 200, after: 100 },
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: allSkills.join(' • '),
          size: 20,
          color: '444444',
        }),
      ],
      spacing: { after: 300 },
    })
  );

  // Experience Section
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'PROFESSIONAL EXPERIENCE',
          bold: true,
          size: 22,
          color: '000000',
        }),
      ],
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' } },
      spacing: { before: 200, after: 100 },
    })
  );

  if (resumeData.originalExperience && resumeData.originalExperience.length > 0) {
    for (const exp of resumeData.originalExperience) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: exp.title, bold: true, size: 22, color: '000000' }),
          ],
        })
      );
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: exp.company, italics: true, size: 20, color: '666666' }),
          ],
          spacing: { after: 100 },
        })
      );

      for (const bullet of exp.bullets) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: '• ' + bullet, size: 20, color: '444444' }),
            ],
            indent: { left: 300 },
            spacing: { after: 50 },
          })
        );
      }
    }
  }

  const doc = new Document({ sections: [{ properties: {}, children }] });
  return await Packer.toBlob(doc);
};

// Generate Minimal Template DOCX
const generateMinimalDocx = async (
  resumeData: ResumeData,
  modifications: ResumeModifications,
): Promise<Blob> => {
  const newSkills = modifications.confirmedSkills.filter(
    skill => !modifications.originalSkills.some(os => os.toLowerCase() === skill.toLowerCase())
  );
  const allSkills = [...modifications.originalSkills, ...newSkills];

  const children: Paragraph[] = [];

  // Tailored for note
  if (modifications.jobTitle && modifications.company) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `For: ${modifications.jobTitle}, ${modifications.company}`,
            italics: true,
            size: 18,
            color: '888888',
          }),
        ],
        spacing: { after: 200 },
      })
    );
  }

  // Name
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: resumeData.name,
          bold: true,
          size: 44,
          color: '000000',
        }),
      ],
      spacing: { after: 50 },
    })
  );

  // Title with skills inline
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${resumeData.title} • ${allSkills.slice(0, 4).join(', ')}`,
          size: 20,
          color: '666666',
        }),
      ],
      spacing: { after: 300 },
    })
  );

  // Experience
  if (resumeData.originalExperience && resumeData.originalExperience.length > 0) {
    for (const exp of resumeData.originalExperience) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${exp.title} — ${exp.company}`, bold: true, size: 22, color: '000000' }),
          ],
          spacing: { before: 150, after: 100 },
        })
      );

      for (const bullet of exp.bullets.slice(0, 3)) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: '• ' + bullet, size: 20, color: '444444' }),
            ],
            indent: { left: 300 },
            spacing: { after: 50 },
          })
        );
      }
    }
  }

  // New skills note
  if (newSkills.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Additional verified skills: ${newSkills.join(', ')}`,
            size: 18,
            color: '22C55E',
          }),
        ],
        spacing: { before: 200 },
      })
    );
  }

  const doc = new Document({ sections: [{ properties: {}, children }] });
  return await Packer.toBlob(doc);
};

// Generate Executive Template DOCX
const generateExecutiveDocx = async (
  resumeData: ResumeData,
  modifications: ResumeModifications,
): Promise<Blob> => {
  const newSkills = modifications.confirmedSkills.filter(
    skill => !modifications.originalSkills.some(os => os.toLowerCase() === skill.toLowerCase())
  );
  const allSkills = [...modifications.originalSkills, ...newSkills];

  const children: Paragraph[] = [];

  // Header with background effect
  if (modifications.jobTitle && modifications.company) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Prepared for: ${modifications.jobTitle} at ${modifications.company}`,
            italics: true,
            size: 18,
            color: '3B82F6',
          }),
        ],
        spacing: { after: 100 },
      })
    );
  }

  // Name
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: resumeData.name,
          bold: true,
          size: 52,
          color: '1a1a1a',
        }),
      ],
      shading: { fill: 'EFF6FF' },
      spacing: { after: 50 },
    })
  );

  // Title
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: resumeData.title,
          bold: true,
          size: 28,
          color: '3B82F6',
        }),
      ],
      shading: { fill: 'EFF6FF' },
      spacing: { after: 100 },
    })
  );

  // Contact
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'email@example.com | (555) 123-4567',
          size: 18,
          color: '666666',
        }),
      ],
      shading: { fill: 'EFF6FF' },
      border: { bottom: { style: BorderStyle.THICK, size: 12, color: '3B82F6' } },
      spacing: { after: 300 },
    })
  );

  // Core Competencies
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'CORE COMPETENCIES',
          bold: true,
          size: 24,
          color: '3B82F6',
        }),
      ],
      spacing: { before: 200, after: 150 },
    })
  );

  for (const skill of allSkills.slice(0, 8)) {
    const isNew = newSkills.includes(skill);
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '✓ ' + skill,
            size: 20,
            color: isNew ? '22C55E' : '444444',
            bold: isNew,
          }),
        ],
        indent: { left: 200 },
        spacing: { after: 50 },
      })
    );
  }

  // Key Achievements
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'KEY ACHIEVEMENTS',
          bold: true,
          size: 24,
          color: '3B82F6',
        }),
      ],
      spacing: { before: 200, after: 150 },
    })
  );

  for (const exp of resumeData.experience.slice(0, 5)) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '• ' + exp.text,
            size: 20,
            color: exp.isModified ? '22C55E' : '444444',
          }),
        ],
        indent: { left: 200 },
        spacing: { after: 50 },
      })
    );
  }

  const doc = new Document({ sections: [{ properties: {}, children }] });
  return await Packer.toBlob(doc);
};

// Main export function - generates template-based resume
export const downloadTemplateResume = async (
  template: TemplateType,
  resumeData: ResumeData,
  modifications: ResumeModifications,
): Promise<void> => {
  let blob: Blob;
  
  switch (template) {
    case 'modern':
      blob = await generateModernDocx(resumeData, modifications);
      break;
    case 'classic':
      blob = await generateClassicDocx(resumeData, modifications);
      break;
    case 'minimal':
      blob = await generateMinimalDocx(resumeData, modifications);
      break;
    case 'executive':
      blob = await generateExecutiveDocx(resumeData, modifications);
      break;
    default:
      blob = await generateModernDocx(resumeData, modifications);
  }
  
  const filename = `${resumeData.name.replace(/[^a-zA-Z0-9]/g, '_')}_${modifications.company?.replace(/[^a-zA-Z0-9]/g, '_') || 'Tailored'}_${template}_Resume.docx`;
  saveAs(blob, filename);
};

// Legacy function for backward compatibility
export const downloadModifiedResume = async (
  modifications: ResumeModifications,
  resumeName: string = 'Candidate',
  preferDocx: boolean = false
): Promise<void> => {
  const resumeData: ResumeData = {
    name: resumeName,
    title: 'Professional',
    skills: modifications.originalSkills,
    experience: modifications.experienceChanges.map(c => ({
      text: c.modified,
      isModified: c.original !== c.modified,
    })),
  };
  
  await downloadTemplateResume('modern', resumeData, modifications);
};
