import { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle, TableCell, TableRow, Table, WidthType, convertInchesToTwip, Header, Footer } from 'docx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';

export type TemplateType = 'creative' | 'professional' | 'sidebar' | 'bold' | 'compact';

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
  email?: string;
  phone?: string;
  location?: string;
  website?: string;
  summary?: string;
  skills: string[];
  tools?: string[];
  experience: { text: string; isModified: boolean }[];
  originalExperience?: { title: string; company: string; date?: string; bullets: string[] }[];
  newExperience?: { title: string; company: string; date?: string; bullets: string[] }[];
  education?: { degree: string; school: string; date?: string }[];
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

// Template 1: Creative - Two column with left content and right sidebar
const generateCreativeDocx = async (
  resumeData: ResumeData,
  modifications: ResumeModifications,
): Promise<Blob> => {
  const newSkills = modifications.confirmedSkills.filter(
    skill => !modifications.originalSkills.some(os => os.toLowerCase() === skill.toLowerCase())
  );
  const allSkills = [...modifications.originalSkills, ...newSkills];

  // Create left column content
  const leftContent: Paragraph[] = [];
  
  // Name
  leftContent.push(
    new Paragraph({
      children: [
        new TextRun({
          text: resumeData.name,
          bold: true,
          size: 56,
          color: '1a1a1a',
          font: 'Arial',
        }),
      ],
      spacing: { after: 80 },
    })
  );

  // Title
  leftContent.push(
    new Paragraph({
      children: [
        new TextRun({
          text: resumeData.title,
          size: 24,
          color: '666666',
          font: 'Arial',
        }),
      ],
      spacing: { after: 300 },
    })
  );

  // Summary
  if (resumeData.summary) {
    leftContent.push(
      new Paragraph({
        children: [
          new TextRun({
            text: resumeData.summary,
            italics: true,
            size: 22,
            color: '444444',
            font: 'Arial',
          }),
        ],
        spacing: { after: 400 },
      })
    );
  }

  // Work Experience
  leftContent.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Work Experience',
          bold: true,
          size: 28,
          color: '1a1a1a',
          font: 'Arial',
        }),
      ],
      spacing: { before: 200, after: 200 },
    })
  );

  if (resumeData.originalExperience) {
    for (const exp of resumeData.originalExperience) {
      leftContent.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${exp.title} `, bold: true, size: 24, color: '1a1a1a', font: 'Arial' }),
            new TextRun({ text: `@ ${exp.company}`, bold: true, size: 24, color: '1a1a1a', font: 'Arial' }),
          ],
          spacing: { before: 150, after: 50 },
        })
      );
      
      if (exp.date) {
        leftContent.push(
          new Paragraph({
            children: [
              new TextRun({ text: exp.date.toUpperCase(), size: 18, color: '888888', font: 'Arial' }),
            ],
            spacing: { after: 100 },
          })
        );
      }

      for (const bullet of exp.bullets) {
        leftContent.push(
          new Paragraph({
            children: [
              new TextRun({ text: '• ', size: 20, color: '1a1a1a', font: 'Arial' }),
              new TextRun({ text: bullet, size: 20, color: '444444', font: 'Arial' }),
            ],
            indent: { left: 200 },
            spacing: { after: 80 },
          })
        );
      }
    }
  }

  // Add new experience entries from AI interrogation
  if (resumeData.newExperience && resumeData.newExperience.length > 0) {
    for (const exp of resumeData.newExperience) {
      leftContent.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${exp.title} `, bold: true, size: 24, color: '1a1a1a', font: 'Arial' }),
            new TextRun({ text: `@ ${exp.company}`, bold: true, size: 24, color: '1a1a1a', font: 'Arial' }),
          ],
          spacing: { before: 150, after: 50 },
        })
      );
      
      if (exp.date) {
        leftContent.push(
          new Paragraph({
            children: [
              new TextRun({ text: exp.date.toUpperCase(), size: 18, color: '888888', font: 'Arial' }),
            ],
            spacing: { after: 100 },
          })
        );
      }

      for (const bullet of exp.bullets) {
        leftContent.push(
          new Paragraph({
            children: [
              new TextRun({ text: '• ', size: 20, color: '1a1a1a', font: 'Arial' }),
              new TextRun({ text: bullet, size: 20, color: '444444', font: 'Arial' }),
            ],
            indent: { left: 200 },
            spacing: { after: 80 },
          })
        );
      }
    }
  }

  // Education
  if (resumeData.education && resumeData.education.length > 0) {
    leftContent.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Education',
            bold: true,
            size: 28,
            color: '1a1a1a',
            font: 'Arial',
          }),
        ],
        spacing: { before: 300, after: 200 },
      })
    );

    for (const edu of resumeData.education) {
      leftContent.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${edu.degree} `, bold: true, size: 24, color: '1a1a1a', font: 'Arial' }),
            new TextRun({ text: `@ ${edu.school}`, bold: true, size: 24, color: '1a1a1a', font: 'Arial' }),
          ],
          spacing: { before: 100, after: 50 },
        })
      );
      if (edu.date) {
        leftContent.push(
          new Paragraph({
            children: [
              new TextRun({ text: edu.date.toUpperCase(), size: 18, color: '888888', font: 'Arial' }),
            ],
            spacing: { after: 150 },
          })
        );
      }
    }
  }

  // Right sidebar content
  const rightContent: Paragraph[] = [];

  // Contact section
  rightContent.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Contact',
          bold: true,
          size: 24,
          color: '1a1a1a',
          font: 'Arial',
        }),
      ],
      spacing: { after: 150 },
    })
  );

  if (resumeData.website) {
    rightContent.push(
      new Paragraph({
        children: [new TextRun({ text: resumeData.website, size: 20, color: '1a1a1a', font: 'Arial' })],
        spacing: { after: 80 },
      })
    );
  }
  if (resumeData.email) {
    rightContent.push(
      new Paragraph({
        children: [new TextRun({ text: resumeData.email, size: 20, color: '1a1a1a', font: 'Arial' })],
        spacing: { after: 80 },
      })
    );
  }
  if (resumeData.phone) {
    rightContent.push(
      new Paragraph({
        children: [new TextRun({ text: resumeData.phone, size: 20, color: '1a1a1a', font: 'Arial' })],
        spacing: { after: 200 },
      })
    );
  }

  // Skills section
  rightContent.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Skills',
          bold: true,
          size: 24,
          color: '1a1a1a',
          font: 'Arial',
        }),
      ],
      spacing: { before: 150, after: 150 },
    })
  );

  for (const skill of allSkills) {
    const isNew = newSkills.includes(skill);
    rightContent.push(
      new Paragraph({
        children: [
          new TextRun({ text: '• ', size: 20, color: '1a1a1a', font: 'Arial' }),
          new TextRun({ text: skill + (isNew ? ' ✓' : ''), size: 20, color: isNew ? '22C55E' : '444444', font: 'Arial', bold: isNew }),
        ],
        spacing: { after: 60 },
      })
    );
  }

  // Tools section
  if (resumeData.tools && resumeData.tools.length > 0) {
    rightContent.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Tools',
            bold: true,
            size: 24,
            color: '1a1a1a',
            font: 'Arial',
          }),
        ],
        spacing: { before: 200, after: 150 },
      })
    );

    for (const tool of resumeData.tools) {
      rightContent.push(
        new Paragraph({
          children: [
            new TextRun({ text: '• ', size: 20, color: '1a1a1a', font: 'Arial' }),
            new TextRun({ text: tool, size: 20, color: '444444', font: 'Arial' }),
          ],
          spacing: { after: 60 },
        })
      );
    }
  }

  // Create table with two columns
  const table = new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: leftContent,
            width: { size: 65, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
          }),
          new TableCell({
            children: rightContent,
            width: { size: 35, type: WidthType.PERCENTAGE },
            shading: { fill: 'F5F5F0' },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
          }),
        ],
      }),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(0.5),
            bottom: convertInchesToTwip(0.5),
            left: convertInchesToTwip(0.5),
            right: convertInchesToTwip(0.5),
          },
        },
      },
      children: [table],
    }],
  });

  return await Packer.toBlob(doc);
};

// Template 2: Professional - Header with contact right, two column body
const generateProfessionalDocx = async (
  resumeData: ResumeData,
  modifications: ResumeModifications,
): Promise<Blob> => {
  const newSkills = modifications.confirmedSkills.filter(
    skill => !modifications.originalSkills.some(os => os.toLowerCase() === skill.toLowerCase())
  );
  const allSkills = [...modifications.originalSkills, ...newSkills];

  const children: Paragraph[] = [];

  // Header table with name/title left, contact right
  const headerTable = new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: `${resumeData.name},`, bold: true, size: 52, color: '1a1a1a', font: 'Arial' }),
                ],
                spacing: { after: 50 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: resumeData.title, bold: true, size: 36, color: '1a1a1a', font: 'Arial' }),
                ],
              }),
            ],
            width: { size: 60, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: resumeData.website || '', size: 20, color: '1a1a1a', font: 'Arial' })],
                alignment: AlignmentType.RIGHT,
                spacing: { after: 50 },
              }),
              new Paragraph({
                children: [new TextRun({ text: resumeData.email || '', size: 20, color: '1a1a1a', font: 'Arial' })],
                alignment: AlignmentType.RIGHT,
                spacing: { after: 50 },
              }),
              new Paragraph({
                children: [new TextRun({ text: resumeData.phone || '', size: 20, color: '1a1a1a', font: 'Arial' })],
                alignment: AlignmentType.RIGHT,
              }),
            ],
            width: { size: 40, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          }),
        ],
      }),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });

  // Left column (experience, education)
  const leftContent: Paragraph[] = [];

  leftContent.push(
    new Paragraph({
      children: [new TextRun({ text: 'Work Experience', bold: true, size: 26, color: '1a1a1a', font: 'Arial' })],
      spacing: { before: 200, after: 200 },
    })
  );

  if (resumeData.originalExperience) {
    for (const exp of resumeData.originalExperience) {
      leftContent.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${exp.company} `, bold: true, size: 24, color: '1a1a1a', font: 'Arial' }),
            new TextRun({ text: exp.title, size: 24, color: '444444', font: 'Arial' }),
          ],
          spacing: { before: 150, after: 50 },
        })
      );
      if (exp.date) {
        leftContent.push(
          new Paragraph({
            children: [new TextRun({ text: exp.date.toUpperCase(), size: 18, color: '888888', font: 'Arial' })],
            spacing: { after: 100 },
          })
        );
      }
      for (const bullet of exp.bullets) {
        leftContent.push(
          new Paragraph({
            children: [
              new TextRun({ text: '• ', size: 20, color: '1a1a1a', font: 'Arial' }),
              new TextRun({ text: bullet, size: 20, color: '444444', font: 'Arial' }),
            ],
            indent: { left: 200 },
            spacing: { after: 60 },
          })
        );
      }
    }
  }

  // Add new experience entries from AI interrogation
  if (resumeData.newExperience && resumeData.newExperience.length > 0) {
    for (const exp of resumeData.newExperience) {
      leftContent.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${exp.company} `, bold: true, size: 24, color: '1a1a1a', font: 'Arial' }),
            new TextRun({ text: exp.title, size: 24, color: '444444', font: 'Arial' }),
          ],
          spacing: { before: 150, after: 50 },
        })
      );
      if (exp.date) {
        leftContent.push(
          new Paragraph({
            children: [new TextRun({ text: exp.date.toUpperCase(), size: 18, color: '888888', font: 'Arial' })],
            spacing: { after: 100 },
          })
        );
      }
      for (const bullet of exp.bullets) {
        leftContent.push(
          new Paragraph({
            children: [
              new TextRun({ text: '• ', size: 20, color: '1a1a1a', font: 'Arial' }),
              new TextRun({ text: bullet, size: 20, color: '444444', font: 'Arial' }),
            ],
            indent: { left: 200 },
            spacing: { after: 60 },
          })
        );
      }
    }
  }

  // Education
  if (resumeData.education && resumeData.education.length > 0) {
    leftContent.push(
      new Paragraph({
        children: [new TextRun({ text: 'Education', bold: true, size: 26, color: '1a1a1a', font: 'Arial' })],
        spacing: { before: 300, after: 200 },
      })
    );

    for (const edu of resumeData.education) {
      leftContent.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${edu.school} `, bold: true, size: 24, color: '1a1a1a', font: 'Arial' }),
            new TextRun({ text: edu.degree, size: 24, color: '444444', font: 'Arial' }),
          ],
          spacing: { before: 100, after: 50 },
        })
      );
      if (edu.date) {
        leftContent.push(
          new Paragraph({
            children: [new TextRun({ text: edu.date.toUpperCase(), size: 18, color: '888888', font: 'Arial' })],
            spacing: { after: 100 },
          })
        );
      }
    }
  }

  // Right column (skills, tools)
  const rightContent: Paragraph[] = [];

  rightContent.push(
    new Paragraph({
      children: [new TextRun({ text: 'Skills', bold: true, size: 26, color: '1a1a1a', font: 'Arial' })],
      spacing: { before: 200, after: 150 },
    })
  );

  for (const skill of allSkills) {
    const isNew = newSkills.includes(skill);
    rightContent.push(
      new Paragraph({
        children: [
          new TextRun({ text: '• ', size: 20, color: '1a1a1a', font: 'Arial' }),
          new TextRun({ text: skill + (isNew ? ' ✓' : ''), size: 20, color: isNew ? '22C55E' : '444444', font: 'Arial', bold: isNew }),
        ],
        spacing: { after: 50 },
      })
    );
  }

  if (resumeData.tools && resumeData.tools.length > 0) {
    rightContent.push(
      new Paragraph({
        children: [new TextRun({ text: 'Tools', bold: true, size: 26, color: '1a1a1a', font: 'Arial' })],
        spacing: { before: 200, after: 150 },
      })
    );

    for (const tool of resumeData.tools) {
      rightContent.push(
        new Paragraph({
          children: [
            new TextRun({ text: '• ', size: 20, color: '1a1a1a', font: 'Arial' }),
            new TextRun({ text: tool, size: 20, color: '444444', font: 'Arial' }),
          ],
          spacing: { after: 50 },
        })
      );
    }
  }

  // Body table
  const bodyTable = new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: leftContent,
            width: { size: 65, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          }),
          new TableCell({
            children: rightContent,
            width: { size: 35, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          }),
        ],
      }),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(0.6),
            bottom: convertInchesToTwip(0.6),
            left: convertInchesToTwip(0.6),
            right: convertInchesToTwip(0.6),
          },
        },
      },
      children: [headerTable, bodyTable],
    }],
  });

  return await Packer.toBlob(doc);
};

// Template 3: Sidebar - Left sidebar with contact/skills, right main content
const generateSidebarDocx = async (
  resumeData: ResumeData,
  modifications: ResumeModifications,
): Promise<Blob> => {
  const newSkills = modifications.confirmedSkills.filter(
    skill => !modifications.originalSkills.some(os => os.toLowerCase() === skill.toLowerCase())
  );
  const allSkills = [...modifications.originalSkills, ...newSkills];

  // Left sidebar content
  const leftContent: Paragraph[] = [];

  // Name and title at top
  leftContent.push(
    new Paragraph({
      children: [
        new TextRun({ text: `${resumeData.name},`, bold: true, size: 48, color: '1a1a1a', font: 'Arial' }),
      ],
      spacing: { after: 50 },
    })
  );
  leftContent.push(
    new Paragraph({
      children: [
        new TextRun({ text: resumeData.title, bold: true, size: 32, color: '1a1a1a', font: 'Arial' }),
      ],
      spacing: { after: 300 },
    })
  );

  // Contact
  leftContent.push(
    new Paragraph({
      children: [new TextRun({ text: 'Contact', bold: true, size: 24, color: '1a1a1a', font: 'Arial' })],
      spacing: { after: 150 },
    })
  );
  if (resumeData.website) {
    leftContent.push(new Paragraph({ children: [new TextRun({ text: resumeData.website, size: 20, color: '444444', font: 'Arial' })], spacing: { after: 50 } }));
  }
  if (resumeData.email) {
    leftContent.push(new Paragraph({ children: [new TextRun({ text: resumeData.email, size: 20, color: '444444', font: 'Arial' })], spacing: { after: 50 } }));
  }
  if (resumeData.phone) {
    leftContent.push(new Paragraph({ children: [new TextRun({ text: resumeData.phone, size: 20, color: '444444', font: 'Arial' })], spacing: { after: 200 } }));
  }

  // Skills
  leftContent.push(
    new Paragraph({
      children: [new TextRun({ text: 'Skills', bold: true, size: 24, color: '1a1a1a', font: 'Arial' })],
      spacing: { before: 100, after: 150 },
    })
  );
  for (const skill of allSkills) {
    const isNew = newSkills.includes(skill);
    leftContent.push(
      new Paragraph({
        children: [
          new TextRun({ text: '• ', size: 20, color: '1a1a1a', font: 'Arial' }),
          new TextRun({ text: skill + (isNew ? ' ✓' : ''), size: 20, color: isNew ? '22C55E' : '444444', font: 'Arial', bold: isNew }),
        ],
        spacing: { after: 50 },
      })
    );
  }

  // Tools
  if (resumeData.tools && resumeData.tools.length > 0) {
    leftContent.push(
      new Paragraph({
        children: [new TextRun({ text: 'Tools', bold: true, size: 24, color: '1a1a1a', font: 'Arial' })],
        spacing: { before: 200, after: 150 },
      })
    );
    for (const tool of resumeData.tools) {
      leftContent.push(
        new Paragraph({
          children: [
            new TextRun({ text: '• ', size: 20, color: '1a1a1a', font: 'Arial' }),
            new TextRun({ text: tool, size: 20, color: '444444', font: 'Arial' }),
          ],
          spacing: { after: 50 },
        })
      );
    }
  }

  // Right main content
  const rightContent: Paragraph[] = [];

  // Work Experience
  rightContent.push(
    new Paragraph({
      children: [new TextRun({ text: 'Work Experience', bold: true, size: 26, color: '1a1a1a', font: 'Arial' })],
      spacing: { after: 200 },
    })
  );

  if (resumeData.originalExperience) {
    for (const exp of resumeData.originalExperience) {
      rightContent.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${exp.company} `, bold: true, size: 24, color: '1a1a1a', font: 'Arial' }),
            new TextRun({ text: exp.title, size: 24, color: '444444', font: 'Arial' }),
          ],
          spacing: { before: 100, after: 50 },
        })
      );
      if (exp.date) {
        rightContent.push(
          new Paragraph({
            children: [new TextRun({ text: exp.date.toUpperCase(), size: 18, color: '888888', font: 'Arial' })],
            spacing: { after: 100 },
          })
        );
      }
      for (const bullet of exp.bullets) {
        rightContent.push(
          new Paragraph({
            children: [
              new TextRun({ text: '• ', size: 20, color: '1a1a1a', font: 'Arial' }),
              new TextRun({ text: bullet, size: 20, color: '444444', font: 'Arial' }),
            ],
            indent: { left: 200 },
            spacing: { after: 60 },
          })
        );
      }
    }
  }

  // Add new experience entries from AI interrogation
  if (resumeData.newExperience && resumeData.newExperience.length > 0) {
    for (const exp of resumeData.newExperience) {
      rightContent.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${exp.company} `, bold: true, size: 24, color: '1a1a1a', font: 'Arial' }),
            new TextRun({ text: exp.title, size: 24, color: '444444', font: 'Arial' }),
          ],
          spacing: { before: 100, after: 50 },
        })
      );
      if (exp.date) {
        rightContent.push(
          new Paragraph({
            children: [new TextRun({ text: exp.date.toUpperCase(), size: 18, color: '888888', font: 'Arial' })],
            spacing: { after: 100 },
          })
        );
      }
      for (const bullet of exp.bullets) {
        rightContent.push(
          new Paragraph({
            children: [
              new TextRun({ text: '• ', size: 20, color: '1a1a1a', font: 'Arial' }),
              new TextRun({ text: bullet, size: 20, color: '444444', font: 'Arial' }),
            ],
            indent: { left: 200 },
            spacing: { after: 60 },
          })
        );
      }
    }
  }

  // Education
  if (resumeData.education && resumeData.education.length > 0) {
    rightContent.push(
      new Paragraph({
        children: [new TextRun({ text: 'Education', bold: true, size: 26, color: '1a1a1a', font: 'Arial' })],
        spacing: { before: 300, after: 200 },
      })
    );

    for (const edu of resumeData.education) {
      rightContent.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${edu.school} `, bold: true, size: 24, color: '1a1a1a', font: 'Arial' }),
            new TextRun({ text: edu.degree, size: 24, color: '444444', font: 'Arial' }),
          ],
          spacing: { before: 100, after: 50 },
        })
      );
      if (edu.date) {
        rightContent.push(
          new Paragraph({
            children: [new TextRun({ text: edu.date.toUpperCase(), size: 18, color: '888888', font: 'Arial' })],
            spacing: { after: 100 },
          })
        );
      }
    }
  }

  const table = new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: leftContent,
            width: { size: 35, type: WidthType.PERCENTAGE },
            shading: { fill: 'F5F5F0' },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          }),
          new TableCell({
            children: rightContent,
            width: { size: 65, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          }),
        ],
      }),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(0.5),
            bottom: convertInchesToTwip(0.5),
            left: convertInchesToTwip(0.5),
            right: convertInchesToTwip(0.5),
          },
        },
      },
      children: [table],
    }],
  });

  return await Packer.toBlob(doc);
};

// Template 4: Bold - Similar to professional with summary and underlined headers
const generateBoldDocx = async (
  resumeData: ResumeData,
  modifications: ResumeModifications,
): Promise<Blob> => {
  const newSkills = modifications.confirmedSkills.filter(
    skill => !modifications.originalSkills.some(os => os.toLowerCase() === skill.toLowerCase())
  );
  const allSkills = [...modifications.originalSkills, ...newSkills];

  const children: Paragraph[] = [];

  // Header with name/title left, contact right
  const headerTable = new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: `${resumeData.name},`, bold: true, size: 52, color: '1a1a1a', font: 'Arial' }),
                ],
                spacing: { after: 50 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: resumeData.title, bold: true, size: 36, color: '1a1a1a', font: 'Arial' }),
                ],
              }),
            ],
            width: { size: 60, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: resumeData.website || '', size: 20, color: '1a1a1a', font: 'Arial' })],
                alignment: AlignmentType.RIGHT,
                spacing: { after: 50 },
              }),
              new Paragraph({
                children: [new TextRun({ text: resumeData.email || '', size: 20, color: '1a1a1a', font: 'Arial' })],
                alignment: AlignmentType.RIGHT,
                spacing: { after: 50 },
              }),
              new Paragraph({
                children: [new TextRun({ text: resumeData.phone || '', size: 20, color: '1a1a1a', font: 'Arial' })],
                alignment: AlignmentType.RIGHT,
              }),
            ],
            width: { size: 40, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          }),
        ],
      }),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });

  // Left column with summary and experience
  const leftContent: Paragraph[] = [];

  // Summary
  if (resumeData.summary) {
    leftContent.push(
      new Paragraph({
        children: [
          new TextRun({ text: resumeData.summary, bold: true, size: 22, color: '1a1a1a', font: 'Arial' }),
        ],
        spacing: { before: 200, after: 300 },
      })
    );
  }

  // Work Experience with underline
  leftContent.push(
    new Paragraph({
      children: [new TextRun({ text: 'WORK EXPERIENCE', bold: true, size: 24, color: '1a1a1a', font: 'Arial' })],
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '1a1a1a' } },
      spacing: { after: 200 },
    })
  );

  if (resumeData.originalExperience) {
    for (const exp of resumeData.originalExperience) {
      leftContent.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${exp.company} `, bold: true, size: 24, color: '1a1a1a', font: 'Arial' }),
            new TextRun({ text: exp.title, size: 24, color: '444444', font: 'Arial' }),
          ],
          spacing: { before: 150, after: 50 },
        })
      );
      if (exp.date) {
        leftContent.push(
          new Paragraph({
            children: [new TextRun({ text: exp.date.toUpperCase(), size: 18, color: '888888', font: 'Arial' })],
            spacing: { after: 100 },
          })
        );
      }
      for (const bullet of exp.bullets) {
        leftContent.push(
          new Paragraph({
            children: [
              new TextRun({ text: '• ', size: 20, color: '1a1a1a', font: 'Arial' }),
              new TextRun({ text: bullet, size: 20, color: '444444', font: 'Arial' }),
            ],
            indent: { left: 200 },
            spacing: { after: 60 },
          })
        );
      }
    }
  }

  // Add new experience entries from AI interrogation
  if (resumeData.newExperience && resumeData.newExperience.length > 0) {
    for (const exp of resumeData.newExperience) {
      leftContent.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${exp.company} `, bold: true, size: 24, color: '1a1a1a', font: 'Arial' }),
            new TextRun({ text: exp.title, size: 24, color: '444444', font: 'Arial' }),
          ],
          spacing: { before: 150, after: 50 },
        })
      );
      if (exp.date) {
        leftContent.push(
          new Paragraph({
            children: [new TextRun({ text: exp.date.toUpperCase(), size: 18, color: '888888', font: 'Arial' })],
            spacing: { after: 100 },
          })
        );
      }
      for (const bullet of exp.bullets) {
        leftContent.push(
          new Paragraph({
            children: [
              new TextRun({ text: '• ', size: 20, color: '1a1a1a', font: 'Arial' }),
              new TextRun({ text: bullet, size: 20, color: '444444', font: 'Arial' }),
            ],
            indent: { left: 200 },
            spacing: { after: 60 },
          })
        );
      }
    }
  }

  // Education
  if (resumeData.education && resumeData.education.length > 0) {
    leftContent.push(
      new Paragraph({
        children: [new TextRun({ text: 'EDUCATION', bold: true, size: 24, color: '1a1a1a', font: 'Arial' })],
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '1a1a1a' } },
        spacing: { before: 300, after: 200 },
      })
    );

    for (const edu of resumeData.education) {
      leftContent.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${edu.school} `, bold: true, size: 24, color: '1a1a1a', font: 'Arial' }),
            new TextRun({ text: edu.degree, size: 24, color: '444444', font: 'Arial' }),
          ],
          spacing: { before: 100, after: 50 },
        })
      );
      if (edu.date) {
        leftContent.push(
          new Paragraph({
            children: [new TextRun({ text: edu.date.toUpperCase(), size: 18, color: '888888', font: 'Arial' })],
            spacing: { after: 100 },
          })
        );
      }
    }
  }

  // Right column
  const rightContent: Paragraph[] = [];

  rightContent.push(
    new Paragraph({
      children: [new TextRun({ text: 'SKILLS', bold: true, size: 24, color: '1a1a1a', font: 'Arial' })],
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '1a1a1a' } },
      spacing: { before: 200, after: 150 },
    })
  );

  for (const skill of allSkills) {
    const isNew = newSkills.includes(skill);
    rightContent.push(
      new Paragraph({
        children: [
          new TextRun({ text: skill + (isNew ? ' ✓' : ''), size: 20, color: isNew ? '22C55E' : '444444', font: 'Arial', bold: isNew }),
        ],
        spacing: { after: 50 },
      })
    );
  }

  rightContent.push(
    new Paragraph({
      children: [new TextRun({ text: 'TOOLS', bold: true, size: 24, color: '1a1a1a', font: 'Arial' })],
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '1a1a1a' } },
      spacing: { before: 200, after: 150 },
    })
  );

  if (resumeData.tools) {
    for (const tool of resumeData.tools) {
      rightContent.push(
        new Paragraph({
          children: [new TextRun({ text: tool, size: 20, color: '444444', font: 'Arial' })],
          spacing: { after: 50 },
        })
      );
    }
  }

  const bodyTable = new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: leftContent,
            width: { size: 65, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          }),
          new TableCell({
            children: rightContent,
            width: { size: 35, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          }),
        ],
      }),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(0.6),
            bottom: convertInchesToTwip(0.6),
            left: convertInchesToTwip(0.6),
            right: convertInchesToTwip(0.6),
          },
        },
      },
      children: [headerTable, bodyTable],
    }],
  });

  return await Packer.toBlob(doc);
};

// Template 5: Compact - Education first, two column with underlined headers
const generateCompactDocx = async (
  resumeData: ResumeData,
  modifications: ResumeModifications,
): Promise<Blob> => {
  const newSkills = modifications.confirmedSkills.filter(
    skill => !modifications.originalSkills.some(os => os.toLowerCase() === skill.toLowerCase())
  );
  const allSkills = [...modifications.originalSkills, ...newSkills];

  // Left column
  const leftContent: Paragraph[] = [];

  // Name and title
  leftContent.push(
    new Paragraph({
      children: [new TextRun({ text: resumeData.name, bold: true, size: 52, color: '1a1a1a', font: 'Arial' })],
      spacing: { after: 50 },
    })
  );
  leftContent.push(
    new Paragraph({
      children: [new TextRun({ text: resumeData.title, size: 24, color: '666666', font: 'Arial' })],
      spacing: { after: 300 },
    })
  );

  // Education first
  if (resumeData.education && resumeData.education.length > 0) {
    leftContent.push(
      new Paragraph({
        children: [new TextRun({ text: 'EDUCATION', bold: true, size: 22, color: '1a1a1a', font: 'Arial' })],
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '1a1a1a' } },
        spacing: { after: 150 },
      })
    );

    for (const edu of resumeData.education) {
      leftContent.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${edu.degree} `, bold: true, size: 22, color: '1a1a1a', font: 'Arial' }),
            new TextRun({ text: `@ ${edu.school}`, bold: true, size: 22, color: '1a1a1a', font: 'Arial' }),
          ],
          spacing: { before: 100, after: 50 },
        })
      );
      if (edu.date) {
        leftContent.push(
          new Paragraph({
            children: [new TextRun({ text: edu.date.toUpperCase(), size: 16, color: '888888', font: 'Arial' })],
            spacing: { after: 100 },
          })
        );
      }
    }
  }

  // Contact
  leftContent.push(
    new Paragraph({
      children: [new TextRun({ text: 'CONTACT', bold: true, size: 22, color: '1a1a1a', font: 'Arial' })],
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '1a1a1a' } },
      spacing: { before: 200, after: 150 },
    })
  );
  if (resumeData.website) {
    leftContent.push(new Paragraph({ children: [new TextRun({ text: `Website: ${resumeData.website}`, size: 20, color: '444444', font: 'Arial' })], spacing: { after: 50 } }));
  }
  if (resumeData.email) {
    leftContent.push(new Paragraph({ children: [new TextRun({ text: `Email: ${resumeData.email}`, size: 20, color: '444444', font: 'Arial' })], spacing: { after: 50 } }));
  }
  if (resumeData.phone) {
    leftContent.push(new Paragraph({ children: [new TextRun({ text: `Phone: ${resumeData.phone}`, size: 20, color: '444444', font: 'Arial' })], spacing: { after: 150 } }));
  }

  // Right column
  const rightContent: Paragraph[] = [];

  // Work Experience
  rightContent.push(
    new Paragraph({
      children: [new TextRun({ text: 'WORK EXPERIENCE', bold: true, size: 22, color: '1a1a1a', font: 'Arial' })],
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '1a1a1a' } },
      spacing: { after: 150 },
    })
  );

  if (resumeData.originalExperience) {
    for (const exp of resumeData.originalExperience) {
      rightContent.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${exp.title} `, bold: true, size: 22, color: '1a1a1a', font: 'Arial' }),
            new TextRun({ text: `@ ${exp.company}`, bold: true, size: 22, color: '1a1a1a', font: 'Arial' }),
          ],
          spacing: { before: 100, after: 50 },
        })
      );
      if (exp.date) {
        rightContent.push(
          new Paragraph({
            children: [new TextRun({ text: exp.date.toUpperCase(), size: 16, color: '888888', font: 'Arial' })],
            spacing: { after: 80 },
          })
        );
      }
      for (const bullet of exp.bullets) {
        rightContent.push(
          new Paragraph({
            children: [
              new TextRun({ text: '• ', size: 20, color: '1a1a1a', font: 'Arial' }),
              new TextRun({ text: bullet, size: 20, color: '444444', font: 'Arial' }),
            ],
            indent: { left: 200 },
            spacing: { after: 50 },
          })
        );
      }
    }
  }

  // Add new experience entries from AI interrogation
  if (resumeData.newExperience && resumeData.newExperience.length > 0) {
    for (const exp of resumeData.newExperience) {
      rightContent.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${exp.title} `, bold: true, size: 22, color: '1a1a1a', font: 'Arial' }),
            new TextRun({ text: `@ ${exp.company}`, bold: true, size: 22, color: '1a1a1a', font: 'Arial' }),
          ],
          spacing: { before: 100, after: 50 },
        })
      );
      if (exp.date) {
        rightContent.push(
          new Paragraph({
            children: [new TextRun({ text: exp.date.toUpperCase(), size: 16, color: '888888', font: 'Arial' })],
            spacing: { after: 80 },
          })
        );
      }
      for (const bullet of exp.bullets) {
        rightContent.push(
          new Paragraph({
            children: [
              new TextRun({ text: '• ', size: 20, color: '1a1a1a', font: 'Arial' }),
              new TextRun({ text: bullet, size: 20, color: '444444', font: 'Arial' }),
            ],
            indent: { left: 200 },
            spacing: { after: 50 },
          })
        );
      }
    }
  }

  // Skills
  rightContent.push(
    new Paragraph({
      children: [new TextRun({ text: 'SKILLS', bold: true, size: 22, color: '1a1a1a', font: 'Arial' })],
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '1a1a1a' } },
      spacing: { before: 200, after: 150 },
    })
  );

  for (const skill of allSkills) {
    const isNew = newSkills.includes(skill);
    rightContent.push(
      new Paragraph({
        children: [
          new TextRun({ text: '• ', size: 20, color: '1a1a1a', font: 'Arial' }),
          new TextRun({ text: skill + (isNew ? ' ✓' : ''), size: 20, color: isNew ? '22C55E' : '444444', font: 'Arial', bold: isNew }),
        ],
        spacing: { after: 40 },
      })
    );
  }

  // Tools
  if (resumeData.tools && resumeData.tools.length > 0) {
    rightContent.push(
      new Paragraph({
        children: [new TextRun({ text: 'TOOLS', bold: true, size: 22, color: '1a1a1a', font: 'Arial' })],
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '1a1a1a' } },
        spacing: { before: 200, after: 150 },
      })
    );

    for (const tool of resumeData.tools) {
      rightContent.push(
        new Paragraph({
          children: [
            new TextRun({ text: '• ', size: 20, color: '1a1a1a', font: 'Arial' }),
            new TextRun({ text: tool, size: 20, color: '444444', font: 'Arial' }),
          ],
          spacing: { after: 40 },
        })
      );
    }
  }

  const table = new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: leftContent,
            width: { size: 40, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          }),
          new TableCell({
            children: rightContent,
            width: { size: 60, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          }),
        ],
      }),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(0.6),
            bottom: convertInchesToTwip(0.6),
            left: convertInchesToTwip(0.6),
            right: convertInchesToTwip(0.6),
          },
        },
      },
      children: [table],
    }],
  });

  return await Packer.toBlob(doc);
};

// Generate PDF resume with complete content (original + modifications)
const generatePdfResume = (
  resumeData: ResumeData,
  modifications: ResumeModifications,
): jsPDF => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  let yPos = margin;

  const newSkills = modifications.confirmedSkills.filter(
    skill => !modifications.originalSkills.some(os => os.toLowerCase() === skill.toLowerCase())
  );
  const allSkills = [...modifications.originalSkills, ...newSkills];

  // Helper function to add text with word wrap
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number, color: string = '#444444'): number => {
    pdf.setFontSize(fontSize);
    pdf.setTextColor(color);
    const lines = pdf.splitTextToSize(text, maxWidth);
    pdf.text(lines, x, y);
    return y + (lines.length * fontSize * 0.4);
  };

  // Header - Name
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(24);
  pdf.setTextColor('#1a1a1a');
  pdf.text(resumeData.name, margin, yPos);
  yPos += 8;

  // Title
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(14);
  pdf.setTextColor('#666666');
  pdf.text(resumeData.title, margin, yPos);
  yPos += 6;

  // Contact info line
  const contactParts = [resumeData.email, resumeData.phone, resumeData.location].filter(Boolean);
  if (contactParts.length > 0) {
    pdf.setFontSize(10);
    pdf.setTextColor('#888888');
    pdf.text(contactParts.join(' | '), margin, yPos);
    yPos += 8;
  }

  // Summary
  if (resumeData.summary) {
    yPos += 4;
    pdf.setFont('helvetica', 'italic');
    yPos = addWrappedText(resumeData.summary, margin, yPos, contentWidth, 10, '#444444');
    yPos += 6;
  }

  // Skills Section
  yPos += 4;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor('#1a1a1a');
  pdf.text('SKILLS', margin, yPos);
  yPos += 2;
  pdf.setDrawColor('#3b82f6');
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPos, margin + 30, yPos);
  yPos += 6;

  // Skills as comma-separated - all in consistent style
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor('#444444');
  
  const skillsText = allSkills.join(', ');
  const skillLines = pdf.splitTextToSize(skillsText, contentWidth);
  pdf.text(skillLines, margin, yPos);
  yPos += skillLines.length * 4 + 6;

  // Experience Section
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor('#1a1a1a');
  pdf.text('EXPERIENCE', margin, yPos);
  yPos += 2;
  pdf.setDrawColor('#3b82f6');
  pdf.line(margin, yPos, margin + 40, yPos);
  yPos += 8;

  // Add original experience entries with their bullets
  if (resumeData.originalExperience && resumeData.originalExperience.length > 0) {
    for (const exp of resumeData.originalExperience) {
      // Check if we need a new page
      if (yPos > 270) {
        pdf.addPage();
        yPos = margin;
      }

      // Job title and company
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor('#1a1a1a');
      pdf.text(`${exp.title} @ ${exp.company}`, margin, yPos);
      yPos += 5;

      // Date
      if (exp.date) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor('#888888');
        pdf.text(exp.date, margin, yPos);
        yPos += 5;
      }

      // Original bullets
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      for (const bullet of exp.bullets) {
        if (yPos > 275) {
          pdf.addPage();
          yPos = margin;
        }
        pdf.setTextColor('#444444');
        yPos = addWrappedText(`• ${bullet}`, margin + 3, yPos, contentWidth - 6, 10, '#444444');
        yPos += 2;
      }
      yPos += 4;
    }
  }

  // Add AI-enhanced experience entries (if any new experience was added)
  // These should be properly formatted experience entries, not generic bullets
  const newExperienceEntries = resumeData.newExperience || [];
  for (const exp of newExperienceEntries) {
    if (yPos > 265) {
      pdf.addPage();
      yPos = margin;
    }
    
    // Job title and company - same style as original
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor('#1a1a1a');
    pdf.text(`${exp.title} @ ${exp.company}`, margin, yPos);
    yPos += 5;
    
    if (exp.date) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor('#888888');
      pdf.text(exp.date, margin, yPos);
      yPos += 5;
    }
    
    // Bullets - same style as original
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    for (const bullet of exp.bullets) {
      if (yPos > 275) {
        pdf.addPage();
        yPos = margin;
      }
      pdf.setTextColor('#444444');
      yPos = addWrappedText(`• ${bullet}`, margin + 3, yPos, contentWidth - 6, 10, '#444444');
      yPos += 2;
    }
    yPos += 4;
  }

  // Education Section
  if (resumeData.education && resumeData.education.length > 0) {
    yPos += 6;
    if (yPos > 260) {
      pdf.addPage();
      yPos = margin;
    }
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor('#1a1a1a');
    pdf.text('EDUCATION', margin, yPos);
    yPos += 2;
    pdf.setDrawColor('#3b82f6');
    pdf.line(margin, yPos, margin + 40, yPos);
    yPos += 8;

    for (const edu of resumeData.education) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor('#1a1a1a');
      pdf.text(`${edu.degree}`, margin, yPos);
      yPos += 5;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor('#666666');
      pdf.text(edu.school + (edu.date ? ` | ${edu.date}` : ''), margin, yPos);
      yPos += 6;
    }
  }

  return pdf;
};

// Main export function - generates PDF resume with complete content
export const downloadTemplateResume = async (
  template: TemplateType,
  resumeData: ResumeData,
  modifications: ResumeModifications,
): Promise<void> => {
  const pdf = generatePdfResume(resumeData, modifications);
  const filename = `${resumeData.name.replace(/[^a-zA-Z0-9]/g, '_')}_${modifications.company?.replace(/[^a-zA-Z0-9]/g, '_') || 'Tailored'}_Resume.pdf`;
  pdf.save(filename);
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
  
  await downloadTemplateResume('creative', resumeData, modifications);
};
